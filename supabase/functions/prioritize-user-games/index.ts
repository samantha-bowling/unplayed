
// supabase/functions/prioritize-user-games/index.ts
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
    // Parse request body
    const { userId, priority = 10 } = await req.json();
    
    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    console.log(`Prioritizing games for user: ${userId} with priority level: ${priority}`);

    // Step 1: Get all games owned by the user
    const { data: userGames, error: userGamesError } = await supabase
      .from("user_games")
      .select("game_id")
      .eq("user_id", userId);
    
    if (userGamesError) {
      console.error("Error fetching user games:", userGamesError);
      return new Response(JSON.stringify({ error: "Failed to fetch user games" }), { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    if (!userGames || userGames.length === 0) {
      return new Response(JSON.stringify({ message: "No games found for this user" }), { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    console.log(`Found ${userGames.length} games for user ${userId}`);

    // Step 2: Extract the game IDs
    const gameIds = userGames.map(game => game.game_id);

    // Step 3: Update the priority for these games in the queue
    // We'll do this in batches to avoid hitting any limitations
    const BATCH_SIZE = 100;
    const totalGames = gameIds.length;
    let processedGames = 0;
    let queuedGames = 0;

    for (let i = 0; i < gameIds.length; i += BATCH_SIZE) {
      const batch = gameIds.slice(i, i + BATCH_SIZE);
      processedGames += batch.length;
      
      console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(gameIds.length / BATCH_SIZE)}, ${processedGames}/${totalGames}`);
      
      // Prepare the batch for upsert into steam_app_queue
      const queueItems = batch.map(appId => ({
        app_id: appId,
        priority: priority,
        status: "pending"
      }));
      
      // Upsert into queue with conflict handling
      const { data: upsertData, error: upsertError } = await supabase
        .from("steam_app_queue")
        .upsert(queueItems, {
          onConflict: "app_id",
          returning: ["app_id"]
        });
      
      if (upsertError) {
        console.error(`Error upserting batch:`, upsertError);
      } else if (upsertData) {
        queuedGames += upsertData.length;
        console.log(`Successfully prioritized ${upsertData.length} games in this batch`);
      }
      
      // Add a small delay to avoid overwhelming the database
      if (i + BATCH_SIZE < gameIds.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully processed ${queuedGames} games for prioritization`,
        totalGames,
        processedGames,
        queuedGames
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Unexpected error", details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
