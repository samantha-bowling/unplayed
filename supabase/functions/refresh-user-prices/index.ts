
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const STEAM_API_KEY = Deno.env.get("STEAM_API_KEY");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    // Validate authorization
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: corsHeaders
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders
      });
    }

    const { user_id } = await req.json();
    
    if (user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403,
        headers: corsHeaders
      });
    }

    console.log(`💰 Starting price refresh for user: ${user_id}`);

    // Get user's game IDs that need price updates
    const { data: userGames, error: gamesError } = await supabase
      .from('user_games')
      .select('game_id')
      .eq('user_id', user_id)
      .limit(100); // Limit to prevent API overload

    if (gamesError) {
      console.error('Error fetching user games:', gamesError);
      throw gamesError;
    }

    if (!userGames || userGames.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: "No games found to update",
        updatedGames: 0
      }), {
        status: 200,
        headers: corsHeaders
      });
    }

    const gameIds = userGames.map(g => g.game_id);
    console.log(`📋 Found ${gameIds.length} games to check for price updates`);

    // Track which games for user price requests
    await supabase.rpc('track_user_price_request', { p_app_ids: gameIds });

    // Get stale prices that need refreshing (this will prioritize user's games)
    const { data: stalePrices, error: staleError } = await supabase
      .rpc('get_stale_prices_for_refresh', { batch_size: 50 });

    if (staleError) {
      console.error('Error getting stale prices:', staleError);
      throw staleError;
    }

    let updatedCount = 0;
    
    if (stalePrices && stalePrices.length > 0) {
      console.log(`🔄 Refreshing prices for ${stalePrices.length} games`);
      
      // Process games in smaller batches to avoid Steam API rate limits
      const batchSize = 10;
      for (let i = 0; i < stalePrices.length; i += batchSize) {
        const batch = stalePrices.slice(i, i + batchSize);
        
        // Call the existing refresh-game-price function for each game
        const batchPromises = batch.map(async (game) => {
          try {
            const { data, error } = await supabase.functions.invoke('refresh-game-price', {
              body: { app_id: game.app_id }
            });
            
            if (error) {
              console.error(`Error refreshing price for game ${game.app_id}:`, error);
              return false;
            }
            
            return data?.success || false;
          } catch (err) {
            console.error(`Exception refreshing game ${game.app_id}:`, err);
            return false;
          }
        });
        
        const results = await Promise.all(batchPromises);
        updatedCount += results.filter(success => success).length;
        
        // Add small delay between batches to respect rate limits
        if (i + batchSize < stalePrices.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    console.log(`✅ Price refresh completed. Updated ${updatedCount} games.`);

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully refreshed prices for ${updatedCount} games`,
      updatedGames: updatedCount,
      totalChecked: stalePrices?.length || 0
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Price refresh error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to refresh prices'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
});
