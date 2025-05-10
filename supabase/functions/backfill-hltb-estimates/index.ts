
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create Supabase client
const supabaseUrl = 'https://gwmygthanyycveyqqspr.supabase.co';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to delay execution (sleep)
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin role (for production) - can be bypassed in development
    const authorization = req.headers.get('Authorization');
    if (!authorization) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Get request parameters
    const { limit = 10, batchSize = 5, startAfter = 0 } = await req.json();
    
    // Find games without estimates
    console.log(`[backfill-hltb-estimates] Finding games without estimates, startAfter=${startAfter}, limit=${limit}`);
    const { data: games, error } = await supabase
      .from('games')
      .select('id, name')
      .not('id', 'in', (supabase.from('game_estimates').select('game_id')))
      .gt('id', startAfter)
      .order('id', { ascending: true })
      .limit(limit);
    
    if (error) {
      throw new Error(`Error fetching games: ${error.message}`);
    }
    
    if (!games || games.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'No games found that need estimates',
        processedCount: 0,
        complete: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log(`[backfill-hltb-estimates] Found ${games.length} games without estimates`);
    
    // Process games in batches
    const results = [];
    const batches = [];
    
    // Split into batches
    for (let i = 0; i < games.length; i += batchSize) {
      batches.push(games.slice(i, i + batchSize));
    }
    
    // Process each batch with a delay between
    for (const batch of batches) {
      console.log(`[backfill-hltb-estimates] Processing batch of ${batch.length} games`);
      
      const batchPromises = batch.map(async (game) => {
        try {
          // Call the fetch-hltb-estimate function
          const response = await fetch(
            `https://gwmygthanyycveyqqspr.functions.supabase.co/fetch-hltb-estimate`, 
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': authorization,
              },
              body: JSON.stringify({
                game_id: game.id,
                title: game.name,
              }),
            }
          );
          
          const result = await response.json();
          return { 
            game_id: game.id, 
            name: game.name, 
            success: response.ok, 
            data: result 
          };
        } catch (err) {
          console.error(`[backfill-hltb-estimates] Error processing game ${game.id}: ${err.message}`);
          return { 
            game_id: game.id, 
            name: game.name, 
            success: false, 
            error: err.message 
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Wait between batches to avoid rate limiting
      if (batches.indexOf(batch) < batches.length - 1) {
        console.log('[backfill-hltb-estimates] Waiting between batches...');
        await sleep(2000); // 2 second delay between batches
      }
    }
    
    // Find the highest game_id we processed
    const lastProcessedId = games[games.length - 1]?.id || startAfter;
    const complete = games.length < limit;
    
    return new Response(JSON.stringify({
      message: `Processed ${results.length} games`,
      processedCount: results.length,
      successCount: results.filter(r => r.success).length,
      errorCount: results.filter(r => !r.success).length,
      lastProcessedId,
      complete,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error(`[backfill-hltb-estimates] Error: ${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
