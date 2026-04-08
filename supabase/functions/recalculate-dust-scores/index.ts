
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

    const userId = claimsData.claims.sub;

    // Check admin role using the service-role client
    const { data: isAdmin, error: roleError } = await supabase.rpc('is_admin', {
      check_user_id: userId,
    });

    if (roleError || !isAdmin) {
      return new Response(JSON.stringify({ success: false, error: 'Forbidden: admin role required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    const body = await req.json().catch(() => ({}));
    // Clamp batchSize to 1–20000
    const rawBatchSize = Number(body.batchSize) || 5000;
    const batchSize = Math.max(1, Math.min(20000, rawBatchSize));
    const startAfter = body.startAfter || null;

    console.log(`Processing dust score batch: size=${batchSize}, startAfter=${startAfter}, requestedBy=${userId}`);

    const { data, error } = await supabase.rpc('recalculate_dust_scores_batch', {
      p_batch_size: batchSize,
      p_start_after_id: startAfter,
    });

    if (error) throw error;

    const result = data?.[0] || { updated_count: 0, last_processed_id: null, complete: true };

    console.log(`Batch complete: updated=${result.updated_count}, lastId=${result.last_processed_id}, complete=${result.complete}`);

    return new Response(JSON.stringify({
      processedCount: result.updated_count,
      lastProcessedId: result.last_processed_id,
      complete: result.complete,
      success: true,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error recalculating dust scores:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
