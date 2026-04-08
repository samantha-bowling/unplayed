
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate caller and verify admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid token' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const callerId = claimsData.claims.sub;

    const { data: isAdmin, error: roleError } = await supabase.rpc('is_admin', {
      check_user_id: callerId,
    });

    if (roleError || !isAdmin) {
      return new Response(JSON.stringify({ success: false, error: 'Forbidden: admin role required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    const body = await req.json().catch(() => ({}));
    const batchSize = Math.max(1, Math.min(200, Number(body.batchSize) || 50));
    const startAfter: string | null = body.startAfter || null;

    console.log(`Batch user metrics: size=${batchSize}, startAfter=${startAfter}, requestedBy=${callerId}`);

    // Fetch distinct user_ids with cursor-based pagination
    let query = supabase
      .from('user_games')
      .select('user_id')
      .order('user_id', { ascending: true })
      .limit(batchSize);

    if (startAfter) {
      query = query.gt('user_id', startAfter);
    }

    const { data: rows, error: fetchError } = await query;
    if (fetchError) throw fetchError;

    // Deduplicate user_ids (user_games may have many rows per user)
    const userIds = [...new Set((rows || []).map((r: { user_id: string }) => r.user_id))];

    // If we got fewer unique users than batchSize, we might need more rows.
    // But for simplicity, process what we have. If userIds.length < batchSize, we're done.
    // Actually we need to handle: we fetched `batchSize` rows but they might all be the same user.
    // Let's fetch more intelligently using a raw approach via RPC isn't available.
    // A better approach: use the users table directly.
    
    // Re-fetch using the users table for distinct user_ids
    let usersQuery = supabase
      .from('users')
      .select('id')
      .order('id', { ascending: true })
      .limit(batchSize);

    if (startAfter) {
      usersQuery = usersQuery.gt('id', startAfter);
    }

    const { data: userRows, error: usersError } = await usersQuery;
    if (usersError) throw usersError;

    const userIdsFromUsersTable = (userRows || []).map((r: { id: string }) => r.id);

    console.log(`Found ${userIdsFromUsersTable.length} users to process`);

    let processedCount = 0;
    let errorCount = 0;
    let lastProcessedId: string | null = null;

    for (const uid of userIdsFromUsersTable) {
      try {
        const { error: metricsError } = await supabase.rpc(
          'calculate_user_metrics_with_clean_score',
          { p_user_id: uid }
        );

        if (metricsError) {
          console.error(`Error calculating metrics for user ${uid}:`, metricsError.message);
          errorCount++;
        } else {
          processedCount++;
        }
        lastProcessedId = uid;
      } catch (err) {
        console.error(`Exception for user ${uid}:`, err.message);
        errorCount++;
        lastProcessedId = uid;
      }
    }

    const complete = userIdsFromUsersTable.length < batchSize;

    console.log(`Batch complete: processed=${processedCount}, errors=${errorCount}, lastId=${lastProcessedId}, complete=${complete}`);

    return new Response(JSON.stringify({
      processedCount,
      errorCount,
      lastProcessedId,
      complete,
      success: true,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in recalculate-all-user-metrics:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
