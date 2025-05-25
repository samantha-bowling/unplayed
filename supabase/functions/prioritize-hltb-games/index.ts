import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import * as hltb from 'https://esm.sh/howlongtobeat@1.8.0';

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create Supabase client
const supabaseUrl = 'https://gwmygthanyycveyqqspr.supabase.co';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Create HowLongToBeat service
const hltbService = new hltb.HowLongToBeatService();

// Configuration
const BATCH_SIZE = 25;
const PRIORITY_LEVEL = 8; // Higher priority for games with HLTB data (but not highest)
const MAX_GAMES_TO_PROCESS = 100; // Maximum number of games to process per call

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Verify admin role and get authorization header
    const authorization = req.headers.get('Authorization');
    
    if (!authorization) {
      return new Response(JSON.stringify({ error: 'Unauthorized - No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Get request parameters
    const { gameList, limit = MAX_GAMES_TO_PROCESS } = await req.json();
    
    console.log(`[prioritize-hltb-games] Starting process with limit: ${limit}`);
    
    let gamesToProcess = [];
    
    if (gameList && Array.isArray(gameList) && gameList.length > 0) {
      // If a game list was provided, use it directly
      console.log(`[prioritize-hltb-games] Using provided game list with ${gameList.length} games`);
      gamesToProcess = gameList.slice(0, limit);
    } else {
      // Otherwise, fetch games from the database that don't have estimates yet
      console.log(`[prioritize-hltb-games] Fetching games without HLTB estimates from database`);
      
      // Get games that don't have HLTB estimates yet, prioritizing games already in the queue with lower priority
      const { data: games, error } = await supabase
        .from('games')
        .select(`
          id, 
          name,
          game_estimates!left(game_id)
        `)
        .is('game_estimates.game_id', null)
        .order('id')
        .limit(limit);
      
      if (error) {
        console.error(`[prioritize-hltb-games] Error fetching games: ${error.message}`);
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
        console.log('[prioritize-hltb-games] No games found that need HLTB estimates');
        return new Response(JSON.stringify({ 
          message: 'No games found that need HLTB estimates',
          processed: 0,
          found: 0
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      console.log(`[prioritize-hltb-games] Found ${games.length} games without estimates`);
      gamesToProcess = games;
    }
    
    // Process games in batches
    const results = {
      processed: 0,
      found: 0,
      prioritized: 0,
      gamesWithData: []
    };
    
    // Split into batches to avoid rate limiting
    const batches = [];
    for (let i = 0; i < gamesToProcess.length; i += BATCH_SIZE) {
      batches.push(gamesToProcess.slice(i, i + BATCH_SIZE));
    }
    
    console.log(`[prioritize-hltb-games] Processing ${batches.length} batches`);
    
    for (const [batchIndex, batch] of batches.entries()) {
      console.log(`[prioritize-hltb-games] Processing batch ${batchIndex + 1}/${batches.length} with ${batch.length} games`);
      
      // Process each game in the batch
      for (const game of batch) {
        results.processed++;
        
        try {
          // Search HLTB for the game
          console.log(`[prioritize-hltb-games] Searching HLTB for: "${game.name}"`);
          const searchResults = await hltbService.search(game.name);
          
          if (searchResults && searchResults.length > 0) {
            // We found a match in HLTB
            console.log(`[prioritize-hltb-games] Found HLTB match for "${game.name}": ${searchResults[0].name}`);
            results.found++;
            results.gamesWithData.push({
              id: game.id,
              name: game.name,
              hltb_name: searchResults[0].name
            });
            
            // Update the game priority in the queue
            const { error: queueError } = await supabase
              .from("steam_app_queue")
              .upsert({
                app_id: game.id,
                name: game.name,
                priority: PRIORITY_LEVEL,
                status: "pending"
              }, {
                onConflict: "app_id",
                ignoreDuplicates: false
              });
            
            if (queueError) {
              console.error(`[prioritize-hltb-games] Error updating queue for game ${game.id}: ${queueError.message}`);
            } else {
              results.prioritized++;
            }
          }
        } catch (err) {
          console.error(`[prioritize-hltb-games] Error processing game ${game.id}: ${err.message}`);
        }
        
        // Add a small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Wait between batches
      if (batchIndex < batches.length - 1) {
        console.log('[prioritize-hltb-games] Waiting between batches...');
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay between batches
      }
    }
    
    // Return the results
    return new Response(JSON.stringify({
      message: `Processed ${results.processed} games, found ${results.found} with HLTB data, prioritized ${results.prioritized} in queue`,
      processed: results.processed,
      found: results.found,
      prioritized: results.prioritized,
      gamesWithData: results.gamesWithData.slice(0, 20) // Return only first 20 games for brevity
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error(`[prioritize-hltb-games] Fatal error: ${error.message}`);
    console.error('[prioritize-hltb-games] Error stack:', error.stack);
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
