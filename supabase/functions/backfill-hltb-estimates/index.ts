
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
    console.log('[backfill-hltb-estimates] Request received');
    
    // Verify admin role and get authorization header
    const authorization = req.headers.get('Authorization');
    console.log('[backfill-hltb-estimates] Authorization header present:', !!authorization);
    
    if (!authorization) {
      console.error('[backfill-hltb-estimates] No authorization header provided');
      return new Response(JSON.stringify({ error: 'Unauthorized - No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Get request parameters
    let requestBody;
    try {
      const bodyText = await req.text();
      console.log('[backfill-hltb-estimates] Request body:', bodyText);
      requestBody = bodyText ? JSON.parse(bodyText) : {};
    } catch (parseError) {
      console.error('[backfill-hltb-estimates] Failed to parse request body:', parseError);
      requestBody = {};
    }
    
    const { limit = 10, batchSize = 5, startAfter = 0 } = requestBody;
    console.log(`[backfill-hltb-estimates] Parameters - limit: ${limit}, batchSize: ${batchSize}, startAfter: ${startAfter}`);
    
    // Test database connection first
    console.log('[backfill-hltb-estimates] Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('games')
      .select('count(*)')
      .limit(1);
    
    if (testError) {
      console.error('[backfill-hltb-estimates] Database connection test failed:', testError);
      return new Response(JSON.stringify({ 
        error: 'Database connection failed',
        details: testError.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log('[backfill-hltb-estimates] Database connection successful');
    
    // OPTIMIZED: Use LEFT JOIN to find games without estimates more efficiently
    console.log(`[backfill-hltb-estimates] Finding games without estimates using LEFT JOIN`);
    
    const { data: games, error } = await supabase
      .from('games')
      .select(`
        id, 
        name,
        game_estimates!left(game_id)
      `)
      .gt('id', startAfter)
      .is('game_estimates.game_id', null)
      .order('id', { ascending: true })
      .limit(limit);
    
    if (error) {
      console.error(`[backfill-hltb-estimates] Error fetching games: ${error.message}`);
      return new Response(JSON.stringify({ 
        error: `Error fetching games: ${error.message}`,
        code: error.code,
        details: error.details
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (!games || games.length === 0) {
      console.log('[backfill-hltb-estimates] No games found that need estimates');
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
    
    console.log(`[backfill-hltb-estimates] Processing ${batches.length} batches`);
    
    // Process each batch with a delay between
    for (const [batchIndex, batch] of batches.entries()) {
      console.log(`[backfill-hltb-estimates] Processing batch ${batchIndex + 1}/${batches.length} with ${batch.length} games`);
      
      const batchPromises = batch.map(async (game, gameIndex) => {
        try {
          console.log(`[backfill-hltb-estimates] Processing game ${gameIndex + 1}/${batch.length} in batch ${batchIndex + 1}: ${game.id} - ${game.name}`);
          
          // Create a new supabase client with the authorization header for the function call
          const authClient = createClient(supabaseUrl, supabaseKey, {
            global: {
              headers: {
                Authorization: authorization,
              },
            },
          });
          
          console.log(`[backfill-hltb-estimates] Calling fetch-hltb-estimate for game ${game.id}: ${game.name}`);
          
          const { data: result, error: functionError } = await authClient.functions.invoke(
            'fetch-hltb-estimate',
            {
              body: {
                game_id: game.id,
                title: game.name,
              },
            }
          );
          
          if (functionError) {
            console.error(`[backfill-hltb-estimates] Function error for game ${game.id}: ${functionError.message}`);
            return { 
              game_id: game.id, 
              name: game.name, 
              success: false, 
              error: functionError.message 
            };
          }
          
          console.log(`[backfill-hltb-estimates] Successfully processed game ${game.id}: ${game.name}`, result);
          return { 
            game_id: game.id, 
            name: game.name, 
            success: true, 
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
      if (batchIndex < batches.length - 1) {
        console.log('[backfill-hltb-estimates] Waiting between batches...');
        await sleep(2000); // 2 second delay between batches
      }
    }
    
    // Find the highest game_id we processed
    const lastProcessedId = games[games.length - 1]?.id || startAfter;
    const complete = games.length < limit;
    
    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;
    
    console.log(`[backfill-hltb-estimates] Batch complete - processed: ${results.length}, success: ${successCount}, errors: ${errorCount}`);
    
    return new Response(JSON.stringify({
      message: `Processed ${results.length} games`,
      processedCount: results.length,
      successCount,
      errorCount,
      lastProcessedId,
      complete,
      results,
      debug: {
        foundGames: games.length,
        batchesProcessed: batches.length,
        authPresent: !!authorization
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error(`[backfill-hltb-estimates] Fatal error: ${error.message}`);
    console.error('[backfill-hltb-estimates] Error stack:', error.stack);
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack,
      type: 'fatal_error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
