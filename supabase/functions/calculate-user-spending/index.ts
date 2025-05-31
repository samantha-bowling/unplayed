
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SpendingRequest {
  user_id?: string;
  force_refresh?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from JWT
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { user_id, force_refresh = false }: SpendingRequest = await req.json();
    const targetUserId = user_id || user.id;

    // Security check - users can only calculate their own metrics unless admin
    if (targetUserId !== user.id) {
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role !== 'admin') {
        return new Response(
          JSON.stringify({ error: 'Forbidden' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log(`Calculating spending metrics for user ${targetUserId}${force_refresh ? ' (forced refresh)' : ''}`);

    // Check if we should recalculate (force refresh or data is stale)
    let shouldCalculate = force_refresh;

    if (!shouldCalculate) {
      const { data: existingMetrics } = await supabase
        .from('user_spending_metrics')
        .select('last_calculated')
        .eq('user_id', targetUserId)
        .single();

      if (!existingMetrics) {
        shouldCalculate = true;
      } else {
        // Recalculate if older than 1 hour
        const lastCalculated = new Date(existingMetrics.last_calculated);
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        shouldCalculate = lastCalculated < oneHourAgo;
      }
    }

    let metrics;

    if (shouldCalculate) {
      console.log('Calculating new spending metrics...');
      
      // Call our database function to calculate and upsert metrics
      const { data: calculatedMetrics, error: calcError } = await supabase
        .rpc('upsert_user_spending_metrics', { p_user_id: targetUserId });

      if (calcError) {
        console.error('Error calculating metrics:', calcError);
        throw calcError;
      }

      metrics = calculatedMetrics;
      console.log('Metrics calculated and stored successfully');
    } else {
      console.log('Using cached metrics...');
      
      // Fetch existing metrics
      const { data: cachedMetrics, error: fetchError } = await supabase
        .from('user_spending_metrics')
        .select('*')
        .eq('user_id', targetUserId)
        .single();

      if (fetchError) {
        console.error('Error fetching cached metrics:', fetchError);
        throw fetchError;
      }

      // Convert to same format as calculated metrics
      metrics = {
        total_games: cachedMetrics.total_games,
        unplayed_games: cachedMetrics.unplayed_games,
        free_games: cachedMetrics.free_games,
        paid_games: cachedMetrics.paid_games,
        games_with_price_data: cachedMetrics.games_with_price_data,
        games_missing_price_data: cachedMetrics.games_missing_price_data,
        total_spent_cents: cachedMetrics.total_spent_cents,
        unplayed_spent_cents: cachedMetrics.unplayed_spent_cents,
        total_saved_cents: cachedMetrics.total_saved_cents,
        unplayed_saved_cents: cachedMetrics.unplayed_saved_cents,
        total_spent_dollars: cachedMetrics.total_spent_cents / 100,
        unplayed_spent_dollars: cachedMetrics.unplayed_spent_cents / 100,
        confidence_score: cachedMetrics.confidence_score,
        currency: cachedMetrics.currency
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        metrics,
        cached: !shouldCalculate,
        calculated_at: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in calculate-user-spending function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
