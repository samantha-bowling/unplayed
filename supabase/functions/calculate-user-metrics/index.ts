
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the user from the Authorization header
    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader);
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    console.log(`Processing metrics for user: ${user.id}`);

    // Use the new fixed database function that processes ALL games and handles clean scores properly
    const { data: metricsResult, error: metricsError } = await supabase.rpc(
      'calculate_user_metrics_with_clean_score',
      { p_user_id: user.id }
    );

    if (metricsError) {
      console.error('Error calculating user metrics:', metricsError);
      throw new Error(`Failed to calculate metrics: ${metricsError.message}`);
    }

    console.log('Metrics calculation completed successfully:', {
      userId: user.id,
      totalGames: metricsResult.total_games,
      cleanScore: metricsResult.clean_score,
      calculationVersion: metricsResult.calculation_version
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Metrics calculated successfully for ${metricsResult.total_games} games`,
        metrics: metricsResult
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in calculate-user-metrics function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
