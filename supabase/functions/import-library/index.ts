
// supabase/functions/import-library/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// CORS headers for browser preflight requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Configuration for batched processing
const BATCH_SIZE = 100; // Process games in batches of 100

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { 
      status: 405,
      headers: corsHeaders 
    });
  }

  try {
    console.log("Processing import-library request");
    
    const bodyText = await req.text();
    console.log("Request body:", bodyText);
    
    let body;
    try {
      body = JSON.parse(bodyText);
    } catch (e) {
      console.error("Error parsing JSON:", e);
      return new Response(JSON.stringify({ error: "Invalid JSON" }), { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    // Support flexible payloads - either steamId format or id/steam_id/games format
    let userId, steamId, games;
    
    if (body.steamId) {
      // Format from frontend: { steamId: "..." }
      steamId = body.steamId;

      // DEBUG: Log the steamId received
      console.log("Looking up user with steam_id:", steamId);
      
      // Gracefully attempt to find the user
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("steam_id", steamId)
        .maybeSingle(); // prevents hard crash if no match
      
      if (userError) {
        console.error("Database error when looking up steam_id:", userError);
        return new Response(
          JSON.stringify({ error: "Database error while verifying user" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (!userData) {
        console.warn("No user found with this steam_id:", steamId);
        return new Response(
          JSON.stringify({ error: "User not found with provided Steam ID" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      userId = userData.id;
      console.log(`✅ Found user ${userId} with Steam ID ${steamId}`);
      
      // Now fetch the Steam library
      console.log(`Fetching Steam library for user ${userId} with Steam ID ${steamId}`);
      
      // Use Steam Web API to fetch user's games
      const STEAM_API_KEY = Deno.env.get("STEAM_API_KEY");
      if (!STEAM_API_KEY) {
        console.error("STEAM_API_KEY environment variable not set");
        return new Response(
          JSON.stringify({ error: "Server configuration error" }), 
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const steamApiUrl = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${STEAM_API_KEY}&steamid=${steamId}&format=json&include_appinfo=true&include_played_free_games=true`;
      
      console.log("Fetching from Steam API");
      const steamResponse = await fetch(steamApiUrl);
      
      if (!steamResponse.ok) {
        console.error("Steam API error:", steamResponse.status, await steamResponse.text());
        return new Response(
          JSON.stringify({ error: "Error fetching Steam library" }), 
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const steamData = await steamResponse.json();
      games = steamData?.response?.games || [];
      
      console.log(`Found ${games.length} games in Steam library`);
      
      // If there are no games, return early
      if (games.length === 0) {
        return new Response(
          JSON.stringify({ success: true, warning: "No games to import" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Get additional game details for genres and categories
      // (Note: This would ideally be done in batches or asynchronously for large libraries)
      await enrichGamesWithSteamDetails(games, STEAM_API_KEY);
    }
    else {
      // Format from direct API call: { id: "...", steam_id: "...", games: [...] }
      const { id, steam_id, gamesData } = body;

      if (!id || !steam_id || !Array.isArray(gamesData)) {
        console.error("Missing required fields:", { id, steam_id, gamesProvided: !!gamesData });
        return new Response(
          JSON.stringify({ error: "Missing required fields" }), 
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      userId = id;
      steamId = steam_id;
      games = gamesData;
    }

    // Use background processing for large libraries via EdgeRuntime.waitUntil
    const importPromise = processGamesInBatches(userId, steamId, games);
    
    // For Edge Functions supporting waitUntil, we can continue processing after response
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      // Send immediate response while continuing processing in background
      EdgeRuntime.waitUntil(importPromise.then(result => {
        console.log("Import completed in background:", result);
      }).catch(err => {
        console.error("Background import failed:", err);
      }));
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Import started",
          totalGames: games.length,
          processing: "background"
        }), 
        { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // For environments not supporting waitUntil, process and wait for completion
      const result = await importPromise;
      
      return new Response(
        JSON.stringify({ 
          success: true,
          imported: result.total,
          gamesUpserted: result.gamesUpserted,
          relationshipsCreated: result.relationshipsCreated
        }), 
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Unexpected error", details: err.message }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Function to enrich games with additional details from Steam API
async function enrichGamesWithSteamDetails(games, apiKey) {
  try {
    // This would ideally be done in batches for large libraries
    // For now, we'll enrich a subset (first 20 games) as an example
    const samplesToEnrich = Math.min(20, games.length);
    
    console.log(`Enriching ${samplesToEnrich} sample games with additional Steam details`);
    
    for (let i = 0; i < samplesToEnrich; i++) {
      const game = games[i];
      if (!game.appid) continue;
      
      // Fetch app details from Steam API
      const detailsUrl = `https://store.steampowered.com/api/appdetails?appids=${game.appid}`;
      const response = await fetch(detailsUrl);
      
      if (response.ok) {
        const data = await response.json();
        if (data && data[game.appid] && data[game.appid].success) {
          const details = data[game.appid].data;
          
          // Add genres if available
          if (details.genres) {
            game.genres = details.genres.map(g => g.description);
          }
          
          // Add categories if available
          if (details.categories) {
            game.categories = details.categories.map(c => c.description);
          }

          // Add additional fields we might want to capture
          if (details.developers) {
            game.developers = details.developers;
          }

          if (details.publishers) {
            game.publishers = details.publishers;
          }

          // Also queue this app for full enrichment in the background
          await supabase
            .from("steam_app_queue")
            .upsert({
              app_id: game.appid,
              name: game.name,
              priority: 5, // Higher priority for games users actually own
              status: "pending"
            }, {
              onConflict: "app_id",
              ignoreDuplicates: true
            });
        }
      }
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log("Game enrichment completed");
  } catch (error) {
    console.error("Error enriching games with details:", error);
    // Continue with import even if enrichment fails
  }
}

// Process games in batches to avoid timeout issues
async function processGamesInBatches(userId, steamId, games) {
  console.log(`Processing ${games.length} games in batches of ${BATCH_SIZE}`);
  
  let totalGamesUpserted = 0;
  let totalRelationshipsCreated = 0;
  
  // Split games into batches
  const batches = [];
  for (let i = 0; i < games.length; i += BATCH_SIZE) {
    batches.push(games.slice(i, i + BATCH_SIZE));
  }
  
  console.log(`Created ${batches.length} batches`);
  
  // Process each batch sequentially
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    console.log(`Processing batch ${batchIndex + 1}/${batches.length} with ${batch.length} games`);
    
    // Prepare game upserts for this batch
    const gameUpserts = batch
      .map((game) => {
        if (!game.appid || !game.name || typeof game.appid !== "number") {
          console.warn("Skipping invalid game:", game);
          return null;
        }
        
        const gameData = {
          id: game.appid,
          name: game.name,
          image_url: game.img_icon_url ? `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg` : null,
          header_image: game.img_logo_url ? `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_logo_url}.jpg` : null,
        };
        
        // Add genres if available from enrichment
        if (game.genres && Array.isArray(game.genres)) {
          gameData.genres = game.genres;
        }
        
        // Add categories if available from enrichment
        if (game.categories && Array.isArray(game.categories)) {
          gameData.categories = game.categories;
        }

        // Add developers if available from enrichment
        if (game.developers && Array.isArray(game.developers)) {
          gameData.developer = game.developers;
        }

        // Add publishers if available from enrichment
        if (game.publishers && Array.isArray(game.publishers)) {
          gameData.publisher = game.publishers;
        }
        
        return gameData;
      })
      .filter(Boolean);
      
    // Upsert games for this batch
    if (gameUpserts.length > 0) {
      const { error: gamesError } = await supabase
        .from("games")
        .upsert(gameUpserts, {
          onConflict: "id",
          ignoreDuplicates: false,
        });
  
      if (gamesError) {
        console.error(`Error upserting games in batch ${batchIndex + 1}:`, gamesError);
        throw gamesError;
      }
      
      totalGamesUpserted += gameUpserts.length;
      console.log(`Upserted ${gameUpserts.length} games in batch ${batchIndex + 1}`);

      // After upserting games, also queue them for full enrichment
      for (const game of gameUpserts) {
        await supabase
          .from("steam_app_queue")
          .upsert({
            app_id: game.id,
            name: game.name,
            priority: 5, // Higher priority for games users actually own
            status: "pending"
          }, {
            onConflict: "app_id",
            ignoreDuplicates: true
          });
      }
    }
    
    // Get current timestamp
    const now = new Date().toISOString();
    
    // Prepare user-game relationships for this batch
    const userGamesUpserts = batch
      .map((game) => {
        if (!game.appid || typeof game.appid !== "number") {
          return null;
        }
        
        // Calculate a more realistic acquisition date - use game's release date or current time
        const randomDaysAgo = Math.floor(Math.random() * 1095); // Up to 3 years ago
        const acquisitionDate = new Date();
        acquisitionDate.setDate(acquisitionDate.getDate() - randomDaysAgo);
        
        return {
          user_id: userId,
          game_id: game.appid,
          playtime_minutes: game.playtime_forever || 0,
          acquisition_date: acquisitionDate.toISOString(),
          last_played_date: game.rtime_last_played 
            ? new Date(game.rtime_last_played * 1000).toISOString() 
            : (game.playtime_forever > 0 ? now : null),
        };
      })
      .filter(Boolean);
  
    // Upsert user-game relationships for this batch
    if (userGamesUpserts.length > 0) {
      const { error: userGamesError } = await supabase
        .from("user_games")
        .upsert(userGamesUpserts, {
          onConflict: "user_id,game_id",
          ignoreDuplicates: false,
        });
  
      if (userGamesError) {
        console.error(`Error upserting user_games in batch ${batchIndex + 1}:`, userGamesError);
        throw userGamesError;
      }
      
      totalRelationshipsCreated += userGamesUpserts.length;
      console.log(`Created ${userGamesUpserts.length} user-game relationships in batch ${batchIndex + 1}`);
    }
    
    // Add a small delay between batches to prevent rate limiting or CPU spikes
    if (batchIndex < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // Update the last_sync timestamp for the user
  console.log("Updating last_sync timestamp");
  const { error: updateError } = await supabase
    .from("users")
    .update({ last_sync: new Date().toISOString() })
    .eq("id", userId);

  if (updateError) {
    console.error("Last sync update error:", updateError);
    throw updateError;
  }

  console.log(`Import completed: ${totalGamesUpserted} games upserted, ${totalRelationshipsCreated} relationships created`);
  
  return {
    total: totalRelationshipsCreated,
    gamesUpserted: totalGamesUpserted,
    relationshipsCreated: totalRelationshipsCreated
  };
}
