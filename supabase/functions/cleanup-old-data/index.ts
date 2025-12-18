import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Retention periods in days
const RETENTION_DAYS = {
  COMPLETED_QUEUE_ITEMS: 7,
  OLD_SYNC_RECORDS: 30,
};

interface CleanupStats {
  queueDeleted: number;
  syncDeleted: number;
  totalDeleted: number;
  executedAt: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the caller is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: isAdmin } = await supabase.rpc('is_admin', { check_user_id: user.id });
    
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const stats: CleanupStats = {
      queueDeleted: 0,
      syncDeleted: 0,
      totalDeleted: 0,
      executedAt: new Date().toISOString(),
    };

    // Parse request body for optional preview mode
    let previewOnly = false;
    try {
      const body = await req.json();
      previewOnly = body?.preview === true;
    } catch {
      // No body or invalid JSON - proceed with cleanup
    }

    // Calculate cutoff dates
    const queueCutoff = new Date();
    queueCutoff.setDate(queueCutoff.getDate() - RETENTION_DAYS.COMPLETED_QUEUE_ITEMS);
    
    const syncCutoff = new Date();
    syncCutoff.setDate(syncCutoff.getDate() - RETENTION_DAYS.OLD_SYNC_RECORDS);

    if (previewOnly) {
      // Preview mode - just count what would be deleted
      console.log('[cleanup-old-data] Running in preview mode');
      
      const { count: queueCount } = await supabase
        .from('steam_app_queue')
        .select('*', { count: 'exact', head: true })
        .in('status', ['completed', 'failed'])
        .lt('created_at', queueCutoff.toISOString());
      
      const { count: syncCount } = await supabase
        .from('steam_app_sync')
        .select('*', { count: 'exact', head: true })
        .lt('last_sync', syncCutoff.toISOString());

      stats.queueDeleted = queueCount || 0;
      stats.syncDeleted = syncCount || 0;
      stats.totalDeleted = stats.queueDeleted + stats.syncDeleted;

      console.log(`[cleanup-old-data] Preview: ${stats.totalDeleted} records would be deleted`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          preview: true,
          stats,
          message: `Preview: ${stats.totalDeleted} records would be deleted`
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Actual cleanup
    console.log('[cleanup-old-data] Starting database cleanup');
    console.log(`[cleanup-old-data] Queue cutoff: ${queueCutoff.toISOString()}`);
    console.log(`[cleanup-old-data] Sync cutoff: ${syncCutoff.toISOString()}`);

    // 1. Delete old completed/failed queue entries
    const { data: deletedQueue, error: queueError } = await supabase
      .from('steam_app_queue')
      .delete()
      .in('status', ['completed', 'failed'])
      .lt('created_at', queueCutoff.toISOString())
      .select('app_id');

    if (queueError) {
      console.error('[cleanup-old-data] Queue cleanup error:', queueError);
    } else {
      stats.queueDeleted = deletedQueue?.length || 0;
      console.log(`[cleanup-old-data] Deleted ${stats.queueDeleted} queue entries`);
    }

    // 2. Delete old sync records
    const { data: deletedSync, error: syncError } = await supabase
      .from('steam_app_sync')
      .delete()
      .lt('last_sync', syncCutoff.toISOString())
      .select('id');

    if (syncError) {
      console.error('[cleanup-old-data] Sync cleanup error:', syncError);
    } else {
      stats.syncDeleted = deletedSync?.length || 0;
      console.log(`[cleanup-old-data] Deleted ${stats.syncDeleted} sync entries`);
    }

    stats.totalDeleted = stats.queueDeleted + stats.syncDeleted;

    console.log(`[cleanup-old-data] Cleanup complete. Total deleted: ${stats.totalDeleted}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        preview: false,
        stats,
        message: `Cleanup complete: ${stats.totalDeleted} records deleted`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[cleanup-old-data] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
