
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

// Set up the Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting dust score recalculation migration...');

    // Call the database function to recalculate all dust scores
    const { error } = await supabase.rpc('recalculate_all_dust_scores');

    if (error) {
      throw error;
    }

    console.log('Successfully recalculated all dust scores');

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'All dust scores have been recalculated using the enhanced algorithm'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    console.error('Error recalculating dust scores:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
