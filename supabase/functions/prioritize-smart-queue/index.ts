
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create Supabase client
const supabaseUrl = 'https://gwmygthanyycveyqqspr.supabase.co';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Configuration for smart prioritization
const DEFAULT_TARGET_COUNT = 5000;
const BATCH_SIZE = 500; // Process in smaller batches to avoid timeouts
const MAX_PRIORITY = 10;
const HIGH_PRIORITY = 8;
const MEDIUM_PRIORITY = 5;
const LOW_PRIORITY = 2;

// Scoring weights for the prioritization algorithm
interface ScoringWeights {
  userOwned: number;      // Games owned by actual users
  metacriticScore: number; // High-rated games
  recentRelease: number;  // Recently released games
  priceRange: number;     // Commercial viability
  popularGenres: number;  // Popular game genres
}

const DEFAULT_WEIGHTS: ScoringWeights = {
  userOwned: 100,        // Highest priority - user-owned games
  metacriticScore: 30,   // High-rated games are valuable
  recentRelease: 20,     // Recent games are more relevant
  priceRange: 15,        // Commercial games are higher priority
  popularGenres: 10,     // Popular genres get slight boost
};

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

    // Get request parameters
    const { 
      targetCount = DEFAULT_TARGET_COUNT,
      weights = DEFAULT_WEIGHTS,
      dryRun = false 
    } = await req.json();

    console.log(`[smart-prioritization] Starting smart prioritization for ${targetCount} games`);
    console.log(`[smart-prioritization] Weights:`, weights);
    console.log(`[smart-prioritization] Dry run: ${dryRun}`);

    // Step 1: Get all pending games from the queue
    console.log(`[smart-prioritization] Fetching pending games from queue...`);
    const { data: pendingGames, error: queueError } = await supabase
      .from('steam_app_queue')
      .select(`
        app_id,
        name,
        priority
      `)
      .eq('status', 'pending')
      .order('app_id');

    if (queueError) {
      console.error(`[smart-prioritization] Error fetching queue: ${queueError.message}`);
      return new Response(JSON.stringify({ 
        error: `Error fetching queue: ${queueError.message}` 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!pendingGames || pendingGames.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'No pending games found in queue',
        processed: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[smart-prioritization] Found ${pendingGames.length} pending games`);
    
    // Step 2: Get game details for all app_ids in the queue
    const appIds = pendingGames.map(game => game.app_id);
    console.log(`[smart-prioritization] Fetching game details for ${appIds.length} games...`);
    
    // Batch the requests to avoid overloading the database
    const GAME_QUERY_BATCH_SIZE = 1000;
    let allGameDetails: any[] = [];
    
    for (let i = 0; i < appIds.length; i += GAME_QUERY_BATCH_SIZE) {
      const batchAppIds = appIds.slice(i, i + GAME_QUERY_BATCH_SIZE);
      
      const { data: gameDetails, error: gameError } = await supabase
        .from('games')
        .select(`
          id,
          name,
          release_date,
          price_cents,
          metacritic_score,
          genres,
          developer,
          publisher
        `)
        .in('id', batchAppIds);
      
      if (gameError) {
        console.error(`[smart-prioritization] Error fetching game details batch ${i}: ${gameError.message}`);
        continue;
      }
      
      if (gameDetails && gameDetails.length > 0) {
        allGameDetails = [...allGameDetails, ...gameDetails];
      }
    }
    
    console.log(`[smart-prioritization] Found ${allGameDetails.length} game details`);
    
    // Step 3: Get user-owned games for maximum priority
    const { data: userOwnedGames, error: userGamesError } = await supabase
      .from('user_games')
      .select('game_id')
      .then(result => {
        if (result.error) return result;
        return {
          ...result,
          data: new Set(result.data?.map(ug => ug.game_id) || [])
        };
      });

    if (userGamesError) {
      console.error(`[smart-prioritization] Error fetching user games: ${userGamesError.message}`);
    }

    const userOwnedSet = userOwnedGames?.data || new Set();
    console.log(`[smart-prioritization] Found ${userOwnedSet.size} user-owned games`);

    // Step 4: Create a mapping of app_id to game details
    const gameDetailsMap = new Map();
    allGameDetails.forEach(game => {
      gameDetailsMap.set(game.id, game);
    });

    // Step 5: Calculate smart scores for each game
    const scoredGames = pendingGames.map(queueItem => {
      const game = gameDetailsMap.get(queueItem.app_id);
      if (!game) {
        // If we don't have game details, return with minimal score
        return {
          app_id: queueItem.app_id,
          name: queueItem.name || `Unknown Game ${queueItem.app_id}`,
          score: 1, // Minimal score
          userOwned: false,
          metacriticScore: null,
          releaseDate: null,
          price: null
        };
      }
      
      let score = 0;

      // User-owned games get maximum priority
      if (userOwnedSet.has(game.id)) {
        score += weights.userOwned;
      }

      // Metacritic score bonus (0-100 scale)
      if (game.metacritic_score && game.metacritic_score > 0) {
        const metacriticBonus = (game.metacritic_score / 100) * weights.metacriticScore;
        score += metacriticBonus;
      }

      // Recent release bonus (games from last 3 years)
      if (game.release_date) {
        const releaseDate = new Date(game.release_date);
        const yearsOld = (Date.now() - releaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
        if (yearsOld <= 3) {
          const recentBonus = Math.max(0, (3 - yearsOld) / 3) * weights.recentRelease;
          score += recentBonus;
        }
      }

      // Price range bonus (commercial games are often higher quality)
      if (game.price_cents && game.price_cents > 0) {
        const price = game.price_cents / 100; // Convert to dollars
        // Sweet spot around $20-60 gets highest bonus
        let priceBonus = 0;
        if (price >= 5 && price <= 60) {
          priceBonus = weights.priceRange;
        } else if (price > 60) {
          priceBonus = weights.priceRange * 0.7; // Premium games still valuable
        } else if (price > 0) {
          priceBonus = weights.priceRange * 0.3; // Cheap games lower priority
        }
        score += priceBonus;
      }

      // Popular genres bonus
      if (game.genres && Array.isArray(game.genres)) {
        const popularGenres = ['Action', 'Adventure', 'RPG', 'Strategy', 'Indie', 'Simulation'];
        const hasPopularGenre = game.genres.some(genre => 
          popularGenres.some(popular => genre.toLowerCase().includes(popular.toLowerCase()))
        );
        if (hasPopularGenre) {
          score += weights.popularGenres;
        }
      }

      return {
        app_id: queueItem.app_id,
        name: game.name || queueItem.name || `Unknown Game ${queueItem.app_id}`,
        score,
        userOwned: userOwnedSet.has(game.id),
        metacriticScore: game.metacritic_score,
        releaseDate: game.release_date,
        price: game.price_cents ? game.price_cents / 100 : null
      };
    });

    // Step 6: Sort by score and take top games
    scoredGames.sort((a, b) => b.score - a.score);
    const topGames = scoredGames.slice(0, targetCount);

    console.log(`[smart-prioritization] Top 10 scored games:`, 
      topGames.slice(0, 10).map(g => ({
        name: g.name,
        score: g.score.toFixed(2),
        userOwned: g.userOwned,
        metacritic: g.metacriticScore
      }))
    );

    // Step 7: If not a dry run, update priorities in the queue
    let updatedCount = 0;
    if (!dryRun) {
      console.log(`[smart-prioritization] Updating priorities for ${topGames.length} games...`);
      
      // Process in batches to avoid overwhelming the database
      for (let i = 0; i < topGames.length; i += BATCH_SIZE) {
        const batch = topGames.slice(i, i + BATCH_SIZE);
        
        // Determine priority based on score ranking
        const updates = batch.map((game, index) => {
          const globalRank = i + index;
          let priority;
          
          if (game.userOwned) {
            priority = MAX_PRIORITY; // User-owned games get max priority
          } else if (globalRank < targetCount * 0.1) {
            priority = HIGH_PRIORITY; // Top 10%
          } else if (globalRank < targetCount * 0.4) {
            priority = MEDIUM_PRIORITY; // Top 40%
          } else {
            priority = LOW_PRIORITY; // Remaining
          }

          return {
            app_id: game.app_id,
            priority: priority,
            status: 'pending'
          };
        });

        // Batch update
        const { error: updateError } = await supabase
          .from('steam_app_queue')
          .upsert(updates, {
            onConflict: 'app_id',
            ignoreDuplicates: false
          });

        if (updateError) {
          console.error(`[smart-prioritization] Error updating batch: ${updateError.message}`);
        } else {
          updatedCount += updates.length;
          console.log(`[smart-prioritization] Updated batch ${Math.floor(i / BATCH_SIZE) + 1}, total updated: ${updatedCount}`);
        }

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Step 8: Prepare response statistics
    const userOwnedCount = topGames.filter(g => g.userOwned).length;
    const averageScore = topGames.reduce((sum, g) => sum + g.score, 0) / topGames.length;

    const response = {
      success: true,
      message: dryRun ? 
        `Analysis complete: identified ${topGames.length} top games for prioritization` :
        `Successfully prioritized ${updatedCount} games in the queue`,
      analysis: {
        totalAnalyzed: pendingGames.length,
        topGamesSelected: topGames.length,
        userOwnedGames: userOwnedCount,
        averageScore: Math.round(averageScore * 100) / 100
      },
      dryRun,
      updated: dryRun ? 0 : updatedCount,
      topGames: topGames.slice(0, 20).map(g => ({
        name: g.name,
        score: Math.round(g.score * 100) / 100,
        userOwned: g.userOwned,
        metacriticScore: g.metacriticScore,
        price: g.price
      }))
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(`[smart-prioritization] Fatal error: ${error.message}`);
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
