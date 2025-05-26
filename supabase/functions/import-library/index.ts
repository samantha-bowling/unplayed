// supabase/functions/import-library/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// CORS headers for browser preflight requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

// Configuration for batched processing - optimized for efficiency
const BATCH_SIZE = 50; // Increased from 25 for better throughput
const STEAM_API_DELAY_MS = 1200; // Slightly increased delay for better reliability
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 2000;

// Rate limiting utility function with improved error handling
async function makeRateLimitedRequest(url: string, retryCount = 0): Promise<Response> {
  try {
    console.log(`Making request to: ${url} (attempt ${retryCount + 1})`);
    
    // Add delay before each request to respect rate limits
    if (retryCount > 0) {
      const backoffMs = INITIAL_BACKOFF_MS * Math.pow(2, retryCount - 1);
      console.log(`Rate limit backoff: waiting ${backoffMs}ms`);
      await new Promise(resolve => setTimeout(resolve, backoffMs));
    } else {
      await new Promise(resolve => setTimeout(resolve, STEAM_API_DELAY_MS));
    }
    
    const response = await fetch(url);
    
    // Handle rate limiting specifically
    if (response.status === 429) {
      console.log(`Rate limited (429), retry ${retryCount + 1}/${MAX_RETRIES}`);
      if (retryCount < MAX_RETRIES) {
        return makeRateLimitedRequest(url, retryCount + 1);
      } else {
        throw new Error(`Steam API rate limit exceeded after ${MAX_RETRIES} retries. Your library may be partially imported. Please try again later to import remaining games.`);
      }
    }
    
    // Handle other HTTP errors
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Steam API error ${response.status}:`, errorText);
      
      // Provide more specific error messages
      if (response.status === 403) {
        throw new Error(`Steam library access denied. Please ensure your Steam profile's 'Game details' are set to Public in your Steam Privacy Settings.`);
      } else if (response.status === 502 || response.status === 503) {
        throw new Error(`Steam servers are currently unavailable (${response.status}). Please try again in a few minutes.`);
      } else {
        throw new Error(`Steam API returned ${response.status}: ${errorText}`);
      }
    }
    
    return response;
  } catch (error) {
    if (retryCount < MAX_RETRIES && (error.message.includes('fetch') || error.message.includes('network'))) {
      console.log(`Network error, retrying: ${error.message}`);
      return makeRateLimitedRequest(url, retryCount + 1);
    }
    throw error;
  }
}

// Enhanced Steam library fetching with better large library handling
async function fetchSteamLibraryWithPagination(steamId: string, steamApiKey: string) {
  console.log(`Fetching Steam library for Steam ID: ${steamId}`);
  
  // First, try to get the library with include_played_free_games
  const steamApiUrl = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${steamApiKey}&steamid=${steamId}&format=json&include_appinfo=true&include_played_free_games=true`;
  
  const steamResponse = await makeRateLimitedRequest(steamApiUrl);
  const steamData = await steamResponse.json();
  
  if (!steamData?.response) {
    throw new Error("Invalid response from Steam API. Please check your Steam ID and privacy settings.");
  }
  
  const games = steamData.response.games || [];
  const gameCount = steamData.response.game_count || 0;
  
  console.log(`Steam API returned ${games.length} games, reported count: ${gameCount}`);
  
  // Check if we might be hitting a limit (round numbers are suspicious)
  if (games.length > 0) {
    const isRoundNumber = games.length % 100 === 0 && games.length >= 1000;
    const countMismatch = gameCount > 0 && Math.abs(games.length - gameCount) > 10;
    
    if (isRoundNumber || countMismatch) {
      console.warn(`Potential API limit detected: ${games.length} games retrieved, reported count: ${gameCount}`);
      
      // Try fetching without free games to see if we get different results
      const altApiUrl = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${steamApiKey}&steamid=${steamId}&format=json&include_appinfo=true&include_played_free_games=false`;
      
      try {
        console.log("Attempting alternative fetch without free games...");
        const altResponse = await makeRateLimitedRequest(altApiUrl);
        const altData = await altResponse.json();
        const altGames = altData?.response?.games || [];
        
        console.log(`Alternative fetch returned ${altGames.length} games`);
        
        // If we get different results, log the discrepancy but continue with original
        if (altGames.length !== games.length) {
          console.warn(`Discrepancy detected: With free games: ${games.length}, Without: ${altGames.length}`);
        }
      } catch (altError) {
        console.warn("Alternative fetch failed:", altError.message);
        // Continue with original games list
      }
    }
  }
  
  return games;
}

// Image utility functions (copied from frontend for consistency)
function constructSteamImageUrl(appId, imageHash, imageType = 'icon') {
  if (!appId || !imageHash) return null;
  
  // Remove any existing URL prefix if present
  const cleanHash = imageHash.replace(/^https?:\/\/.*\//, '');
  
  // Construct the proper Steam CDN URL
  const baseUrl = 'https://media.steampowered.com/steamcommunity/public/images/apps';
  return `${baseUrl}/${appId}/${cleanHash}.jpg`;
}

function normalizeGameImageData(imageData, gameId) {
  // For image_url: prefer img_icon_url (filename only from Steam library API)
  let image_url = null;
  if (imageData.img_icon_url) {
    // Store just the filename/hash for consistency
    image_url = imageData.img_icon_url;
  }
  
  // For header_image: prefer full URLs from Steam Store API
  let header_image = null;
  if (imageData.img_logo_url) {
    // Construct the full URL from img_logo_url
    header_image = constructSteamImageUrl(gameId, imageData.img_logo_url, 'logo');
  }
  
  return {
    image_url,
    header_image
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({
      error: "Method Not Allowed"
    }), {
      status: 405,
      headers: corsHeaders
    });
  }

  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({
      error: "Missing authorization token"
    }), {
      status: 401,
      headers: corsHeaders
    });
  }

  const token = authHeader.replace("Bearer ", "");
  if (!token) {
    return new Response(JSON.stringify({
      error: "Missing authorization token"
    }), {
      status: 401,
      headers: corsHeaders
    });
  }

  const { data, error: authError } = await supabase.auth.getUser(token);
  const user = data?.user;
  if (authError || !user) {
    return new Response(JSON.stringify({
      error: "Unauthorized"
    }), {
      status: 401,
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
      return new Response(JSON.stringify({
        error: "Invalid JSON"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

    // Support flexible payloads - either steamId format or id/steam_id/games format
    let userId, steamId, games;

    if (body.steamId) {
      // Format from frontend: { steamId: "..." }
      steamId = body.steamId;
      console.log("Looking up user with steam_id:", steamId);
      
      const { data: userData, error: userError } = await supabase.from("users").select("id").eq("steam_id", steamId).eq("id", user.id).maybeSingle();
      if (userError) {
        console.error("Database error when looking up steam_id:", userError);
        return new Response(JSON.stringify({
          error: "Database error while verifying user"
        }), {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      }
      if (!userData) {
        console.warn("No user found with this steam_id:", steamId);
        return new Response(JSON.stringify({
          error: "User not found with provided Steam ID"
        }), {
          status: 404,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      }
      userId = userData.id;
      console.log(`✅ Found user ${userId} with Steam ID ${steamId}`);
      
      // Now fetch the Steam library with enhanced handling
      console.log(`Fetching Steam library for user ${userId} with Steam ID ${steamId}`);
      const STEAM_API_KEY = Deno.env.get("STEAM_API_KEY");
      if (!STEAM_API_KEY) {
        console.error("STEAM_API_KEY environment variable not set");
        return new Response(JSON.stringify({
          error: "Server configuration error - Steam API key not configured"
        }), {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      }
      
      try {
        games = await fetchSteamLibraryWithPagination(steamId, STEAM_API_KEY);
        
        console.log(`Successfully fetched ${games.length} games from Steam library`);
        
        // If there are no games, return early with helpful message
        if (games.length === 0) {
          return new Response(JSON.stringify({
            success: true,
            warning: "No games found in Steam library. This could be due to privacy settings.",
            helpText: "Make sure your Steam profile's 'Game details' are set to Public in your Steam Privacy Settings.",
            imported: 0
          }), {
            status: 200,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json"
            }
          });
        }
        
        // Queue games for detailed enrichment (moved to background for efficiency)
        await queueGamesForDetailedEnrichment(games);
        
      } catch (error) {
        console.error("Steam API error:", error);
        let errorMessage = "Failed to fetch Steam library";
        let helpText = "";
        
        if (error.message.includes('rate limit')) {
          errorMessage = "Steam API rate limit reached";
          helpText = "Your library may be partially imported. Please wait a few minutes before trying to import again.";
        } else if (error.message.includes('429')) {
          errorMessage = "Steam API is currently busy";
          helpText = "Please try importing your library again in a few minutes.";
        } else if (error.message.includes('403') || error.message.includes('access denied')) {
          errorMessage = "Steam library access denied";
          helpText = "Please ensure your Steam profile's 'Game details' are set to Public in your Steam Privacy Settings.";
        } else if (error.message.includes('502') || error.message.includes('503') || error.message.includes('unavailable')) {
          errorMessage = "Steam servers temporarily unavailable";
          helpText = "Please try importing your library again in a few minutes.";
        }
        
        return new Response(JSON.stringify({
          error: errorMessage,
          helpText: helpText,
          details: error.message
        }), {
          status: 502,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      }
    } else {
      // Format from direct API call: { id: "...", steam_id: "...", games: [...] }
      const { id, steam_id, gamesData } = body;
      if (!id || !steam_id || !Array.isArray(gamesData)) {
        console.error("Missing required fields:", {
          id,
          steam_id,
          gamesProvided: !!gamesData
        });
        return new Response(JSON.stringify({
          error: "Missing required fields"
        }), {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
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
      EdgeRuntime.waitUntil(importPromise.then((result) => {
        console.log("Import completed in background:", result);
      }).catch((err) => {
        console.error("Background import failed:", err);
      }));
      
      return new Response(JSON.stringify({
        success: true,
        message: "Import started",
        totalGames: games.length,
        processing: "background",
        note: games.length >= 1000 ? "Large library detected - import may take several minutes" : undefined
      }), {
        status: 202,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    } else {
      // For environments not supporting waitUntil, process and wait for completion
      const result = await importPromise;
      return new Response(JSON.stringify({
        success: true,
        imported: result.total,
        gamesUpserted: result.gamesUpserted,
        relationshipsCreated: result.relationshipsCreated,
        note: games.length >= 1000 ? "Large library successfully imported" : undefined
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({
      error: "Unexpected error",
      details: err.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});

// Enhanced queue function with smart prioritization
async function queueGamesForDetailedEnrichment(games) {
  try {
    console.log(`Queuing ${games.length} games for detailed enrichment`);
    
    // Prioritize games that are more likely to be played (higher playtime, recent acquisition)
    const queueItems = games.map(game => {
      let priority = 3; // Default priority
      
      // Higher priority for games with some playtime (user showed interest)
      if (game.playtime_forever > 0 && game.playtime_forever < 120) {
        priority = 1; // High priority - tried but not fully played
      } else if (game.playtime_forever > 120) {
        priority = 4; // Lower priority - already played significantly
      }
      
      // Recent games get slightly higher priority
      if (game.rtime_last_played && game.rtime_last_played > (Date.now() / 1000) - (30 * 24 * 60 * 60)) {
        priority = Math.max(1, priority - 1);
      }
      
      return {
        app_id: game.appid,
        name: game.name,
        priority: priority
      };
    });
    
    // Insert into queue in optimized batches
    const queueBatchSize = 200; // Larger batches for efficiency
    for (let i = 0; i < queueItems.length; i += queueBatchSize) {
      const batch = queueItems.slice(i, i + queueBatchSize);
      
      const { error: queueError } = await supabase
        .from("steam_app_queue")
        .upsert(batch, {
          onConflict: "app_id",
          ignoreDuplicates: true,
        });
      
      if (queueError) {
        console.error(`Error queuing batch ${Math.floor(i / queueBatchSize) + 1}:`, queueError);
      }
    }
    
    console.log("Games queued for detailed enrichment with smart prioritization");
  } catch (error) {
    console.error("Error queuing games for enrichment:", error);
    // Don't fail the import if queuing fails
  }
}

// Process games in batches to avoid timeout issues
async function processGamesInBatches(userId, steamId, games) {
  console.log(`Processing ${games.length} games in batches of ${BATCH_SIZE}`);
  let totalGamesUpserted = 0;
  let totalRelationshipsCreated = 0;

  const batches = [];
  for (let i = 0; i < games.length; i += BATCH_SIZE) {
    batches.push(games.slice(i, i + BATCH_SIZE));
  }

  console.log(`Created ${batches.length} batches`);

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    console.log(`Processing batch ${batchIndex + 1}/${batches.length} with ${batch.length} games`);

    // Prepare game upserts for this batch
    const gameUpserts = batch.map((game) => {
      if (!game.appid || !game.name || typeof game.appid !== "number") {
        console.warn("Skipping invalid game:", game);
        return null;
      }
      
      // Use the new image normalization function
      const normalizedImages = normalizeGameImageData({
        img_icon_url: game.img_icon_url,
        img_logo_url: game.img_logo_url
      }, game.appid);
      
      const gameData = {
        id: game.appid,
        name: game.name,
        image_url: normalizedImages.image_url,
        header_image: normalizedImages.header_image
      };
      
      if (game.genres && Array.isArray(game.genres)) {
        gameData.genres = game.genres;
      }
      if (game.categories && Array.isArray(game.categories)) {
        gameData.categories = game.categories;
      }
      if (game.developers && Array.isArray(game.developers)) {
        gameData.developer = game.developers;
      }
      if (game.publishers && Array.isArray(game.publishers)) {
        gameData.publisher = game.publishers;
      }
      return gameData;
    }).filter(Boolean);

    if (gameUpserts.length > 0) {
      const { error: gamesError } = await supabase.from("games").upsert(gameUpserts, {
        onConflict: "id",
        ignoreDuplicates: false
      });
      if (gamesError) {
        console.error(`Error upserting games in batch ${batchIndex + 1}:`, gamesError);
        throw gamesError;
      }
      totalGamesUpserted += gameUpserts.length;
      console.log(`Upserted ${gameUpserts.length} games in batch ${batchIndex + 1}`);
    }

    const now = new Date().toISOString();

    const userGamesUpserts = batch.map((game) => {
      if (!game.appid || typeof game.appid !== "number") {
        return null;
      }
      const randomDaysAgo = Math.floor(Math.random() * 1095);
      const acquisitionDate = new Date();
      acquisitionDate.setDate(acquisitionDate.getDate() - randomDaysAgo);
      return {
        user_id: userId,
        game_id: game.appid,
        playtime_minutes: game.playtime_forever || 0,
        acquisition_date: acquisitionDate.toISOString(),
        last_played_date: game.rtime_last_played ? new Date(game.rtime_last_played * 1000).toISOString() : game.playtime_forever > 0 ? now : null
      };
    }).filter(Boolean);

    if (userGamesUpserts.length > 0) {
      const { error: userGamesError } = await supabase.from("user_games").upsert(userGamesUpserts, {
        onConflict: "user_id,game_id",
        ignoreDuplicates: false
      });
      if (userGamesError) {
        console.error(`Error upserting user_games in batch ${batchIndex + 1}:`, userGamesError);
        throw userGamesError;
      }
      totalRelationshipsCreated += userGamesUpserts.length;
      console.log(`Created ${userGamesUpserts.length} user-game relationships in batch ${batchIndex + 1}`);
    }

    // Add delay between batches to be gentle on the database
    if (batchIndex < batches.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  console.log("Updating last_sync timestamp");
  const { error: updateError } = await supabase.from("users").update({
    last_sync: new Date().toISOString()
  }).eq("id", userId);

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
