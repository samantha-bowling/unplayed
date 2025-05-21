
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
  
  const upserts = games
    .map((game) => {
      if (!game.appid || !game.name || typeof game.appid !== "number") {
        console.warn("Skipping invalid game:", game);
        return null;
      }
      
      return {
        user_id: userId,
        steam_id: steamId,
        appid: game.appid,
        name: game.name,
        img_icon_url: game.img_icon_url,
        img_logo_url: game.img_logo_url,
        playtime_forever: game.playtime_forever,
        playtime_windows_forever: game.playtime_windows_forever,
        playtime_mac_forever: game.playtime_mac_forever,
        playtime_linux_forever: game.playtime_linux_forever,
        has_community_visible_stats: game.has_community_visible_stats ?? false,
      };
    })
    .filter(Boolean);

  if (upserts.length === 0) {
    return new Response(
      JSON.stringify({ success: true, warning: "No valid games to import" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Insert games into the database
  console.log(`Upserting ${upserts.length} games`);
  const { error: insertError } = await supabase.from("game_library").upsert(upserts, {
    onConflict: "user_id,appid",
  });

  if (insertError) {
    console.error("Insert error:", insertError);
    return new Response(
      JSON.stringify({ error: insertError.message }), 
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
    JSON.stringify({ success: true, imported: upserts.length }), 
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
