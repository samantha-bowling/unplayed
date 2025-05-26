
// supabase/functions/import-library/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { 
  fetchSteamLibrary, 
  SteamGame 
} from '../shared/steam-api-utils.ts';
import { 
  processGamesInBatches, 
  queueGamesForDetailedEnrichment 
} from '../shared/database-utils.ts';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// CORS headers for browser preflight requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

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

  // Validate authorization
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

    // Handle different payload formats
    let userId: string, steamId: string, games: SteamGame[];

    if (body.steamId) {
      // Format from frontend: { steamId: "..." }
      steamId = body.steamId;
      console.log("Looking up user with steam_id:", steamId);
      
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("steam_id", steamId)
        .eq("id", user.id)
        .maybeSingle();
        
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
      
      // Fetch Steam library using utility function
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
        games = await fetchSteamLibrary(steamId, STEAM_API_KEY);
        
        console.log(`Successfully fetched ${games.length} games from Steam library`);
        
        // Handle empty library
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
        message: "Import started successfully",
        totalGames: games.length,
        processing: "background",
        status: "processing",
        helpText: "Your games are being imported. This may take a few minutes.",
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
        status: "complete",
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
      error: "Unexpected error occurred",
      details: err.message,
      status: "error"
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
