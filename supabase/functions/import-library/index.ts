
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
    let userId, steamId;
    
    if (body.steamId) {
      // Format from frontend: { steamId: "..." }
      steamId = body.steamId;
      
      // Lookup user by steam_id
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("steam_id", steamId)
        .single();
      
      if (userError || !userData) {
        console.error("Error finding user by steam_id:", userError || "No user found");
        return new Response(
          JSON.stringify({ error: "User not found with provided Steam ID" }), 
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      userId = userData.id;
      
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
      const games = steamData?.response?.games || [];
      
      console.log(`Found ${games.length} games in Steam library`);
      
      // Continue to process games
      return await processGames(userId, steamId, games, corsHeaders);
    }
    else {
      // Format from direct API call: { id: "...", steam_id: "...", games: [...] }
      const { id, steam_id, games } = body;

      if (!id || !steam_id || !Array.isArray(games)) {
        console.error("Missing required fields:", { id, steam_id, gamesProvided: !!games });
        return new Response(
          JSON.stringify({ error: "Missing required fields" }), 
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      userId = id;
      steamId = steam_id;
      
      // Continue to process games
      return await processGames(userId, steamId, games, corsHeaders);
    }
    
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Unexpected error", details: err.message }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function processGames(userId, steamId, games, corsHeaders) {
  // Process games to update database
  console.log(`Processing ${games.length} games for user ${userId} with Steam ID ${steamId}`);
  
  if (games.length === 0) {
    return new Response(
      JSON.stringify({ success: true, warning: "No games to import" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // First, prepare the game data for the games table
  const gameUpserts = games
    .map((game) => {
      if (!game.appid || !game.name || typeof game.appid !== "number") {
        console.warn("Skipping invalid game:", game);
        return null;
      }
      
      return {
        id: game.appid,  // Use appid as the primary key
        name: game.name,
        image_url: game.img_icon_url ? `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg` : null,
        header_image: game.img_logo_url ? `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_logo_url}.jpg` : null,
      };
    })
    .filter(Boolean);

  // Upsert the games into the games table
  console.log(`Upserting ${gameUpserts.length} games into games table`);
  const { error: gamesError } = await supabase
    .from("games")
    .upsert(gameUpserts, {
      onConflict: "id",
      ignoreDuplicates: false,
    });

  if (gamesError) {
    console.error("Error upserting games:", gamesError);
    return new Response(
      JSON.stringify({ error: "Error upserting games", details: gamesError.message }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Now prepare the user_games relationships
  const userGamesUpserts = games
    .map((game) => {
      if (!game.appid || typeof game.appid !== "number") {
        return null;
      }
      
      return {
        user_id: userId,
        game_id: game.appid,
        playtime_minutes: game.playtime_forever || 0,
        // Calculate timestamp for acquisition date (just using current time for now)
        acquisition_date: new Date().toISOString(),
        // Add any last played date if available from Steam
        last_played_date: null, // Steam API doesn't provide this directly
      };
    })
    .filter(Boolean);

  // Upsert the user-game relationships
  console.log(`Upserting ${userGamesUpserts.length} relationships into user_games table`);
  const { error: userGamesError } = await supabase
    .from("user_games")
    .upsert(userGamesUpserts, {
      onConflict: "user_id,game_id",
      ignoreDuplicates: false,
    });

  if (userGamesError) {
    console.error("Error upserting user_games:", userGamesError);
    return new Response(
      JSON.stringify({ error: "Error creating user-game relationships", details: userGamesError.message }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Update the last_sync timestamp for the user
  console.log("Updating last_sync timestamp");
  const { error: updateError } = await supabase
    .from("users")
    .update({ last_sync: new Date().toISOString() })
    .eq("id", userId);

  if (updateError) {
    console.error("Last sync update error:", updateError);
    return new Response(
      JSON.stringify({ error: updateError.message }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      imported: userGamesUpserts.length,
      gamesUpserted: gameUpserts.length,
      relationshipsCreated: userGamesUpserts.length
    }), 
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
