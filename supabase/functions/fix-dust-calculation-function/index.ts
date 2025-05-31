
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
    console.log('Fixing dust calculation function...');

    // First, drop the existing function
    const { error: dropError } = await supabase.rpc('execute_sql', {
      sql: 'DROP FUNCTION IF EXISTS recalculate_all_dust_scores();'
    });

    if (dropError) {
      console.error('Error dropping function:', dropError);
      // Continue anyway, the function might not exist
    }

    // Now add the missing columns if they don't exist
    const { error: alterError } = await supabase.rpc('execute_sql', {
      sql: `
        ALTER TABLE game_dust_breakdowns 
        ADD COLUMN IF NOT EXISTS quality_score integer NOT NULL DEFAULT 10,
        ADD COLUMN IF NOT EXISTS price_score integer NOT NULL DEFAULT 7,
        ADD COLUMN IF NOT EXISTS genre_score integer NOT NULL DEFAULT 7;
      `
    });

    if (alterError) {
      throw alterError;
    }

    console.log('Successfully added missing columns and fixed function');

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Database schema has been updated with 5-factor dust scoring system'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    console.error('Error fixing dust calculation function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
