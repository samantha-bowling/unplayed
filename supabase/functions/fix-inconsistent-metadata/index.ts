
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// CORS headers for browser preflight requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    console.log("Starting fix-inconsistent-metadata function");
    
    // Parse request for options
    let dryRun = false;
    let prioritizeUserGames = true;
    
    try {
      const body = await req.json();
      dryRun = body.dryRun === true;
      prioritizeUserGames = body.prioritizeUserGames !== false;
    } catch {
      // If body parsing fails, check URL parameters
      const url = new URL(req.url);
      dryRun = url.searchParams.get('dryRun') === 'true';
      prioritizeUserGames = url.searchParams.get('prioritizeUserGames') !== 'false';
    }
    
    console.log(`Operation mode: ${dryRun ? 'DRY RUN' : 'LIVE'}, Prioritize user games: ${prioritizeUserGames}`);
    
    // Step 1: Identify games with inconsistent metadata
    console.log("Identifying games with inconsistent image metadata...");
    
    const { data: inconsistentGames, error: queryError } = await supabase
      .from("games")
      .select("id, name, image_url, header_image")
      .not("image_url", "is", null)
      .is("header_image", null);
    
    if (queryError) {
      console.error("Error querying inconsistent games:", queryError);
      return new Response(
        JSON.stringify({ error: "Database query error", details: queryError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Found ${inconsistentGames?.length || 0} games with inconsistent metadata`);
    
    if (!inconsistentGames || inconsistentGames.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: "No games found with inconsistent metadata",
          inconsistentCount: 0,
          userOwnedCount: 0,
          queuedCount: 0
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Step 2: If prioritizing user games, identify which games are owned by users
    let userOwnedGameIds: number[] = [];
    if (prioritizeUserGames) {
      console.log("Identifying user-owned games for prioritization...");
      
      const gameIds = inconsistentGames.map(game => game.id);
      
      const { data: userGames, error: userGamesError } = await supabase
        .from("user_games")
        .select("game_id")
        .in("game_id", gameIds);
      
      if (userGamesError) {
        console.error("Error querying user games:", userGamesError);
      } else {
        userOwnedGameIds = [...new Set(userGames?.map(ug => ug.game_id) || [])];
        console.log(`Found ${userOwnedGameIds.length} user-owned games among inconsistent games`);
      }
    }
    
    // Step 3: Prepare queue items with priority
    const queueItems = inconsistentGames.map(game => {
      const isUserOwned = userOwnedGameIds.includes(game.id);
      return {
        app_id: game.id,
        name: game.name,
        priority: isUserOwned ? 100 : 50, // High priority for user-owned, medium for others
        status: "pending"
      };
    });
    
    // Sort by priority for logging
    queueItems.sort((a, b) => b.priority - a.priority);
    
    const userOwnedCount = queueItems.filter(item => item.priority === 100).length;
    const otherGamesCount = queueItems.filter(item => item.priority === 50).length;
    
    console.log(`Prepared ${queueItems.length} items for queue:`);
    console.log(`- ${userOwnedCount} user-owned games (priority 100)`);
    console.log(`- ${otherGamesCount} other games (priority 50)`);
    
    // Step 4: Queue the games (unless dry run)
    if (dryRun) {
      console.log("DRY RUN: Would queue the above games but not making any changes");
      return new Response(
        JSON.stringify({
          message: "DRY RUN completed - no changes made",
          inconsistentCount: inconsistentGames.length,
          userOwnedCount,
          otherGamesCount,
          wouldQueue: queueItems.length,
          sampleGames: queueItems.slice(0, 10).map(item => ({
            id: item.app_id,
            name: item.name,
            priority: item.priority
          }))
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Live mode - actually queue the games
    console.log("Queueing games for metadata update...");
    
    // Process in batches to avoid timeout
    const BATCH_SIZE = 200;
    let totalQueued = 0;
    let totalErrors = 0;
    
    for (let i = 0; i < queueItems.length; i += BATCH_SIZE) {
      const batch = queueItems.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(queueItems.length / BATCH_SIZE)} (${batch.length} items)`);
      
      const { error: upsertError } = await supabase
        .from("steam_app_queue")
        .upsert(batch, {
          onConflict: "app_id",
          ignoreDuplicates: false, // Update existing entries
        });
      
      if (upsertError) {
        console.error(`Error queuing batch ${Math.floor(i / BATCH_SIZE) + 1}:`, upsertError);
        totalErrors += batch.length;
      } else {
        totalQueued += batch.length;
        console.log(`Successfully queued batch ${Math.floor(i / BATCH_SIZE) + 1}`);
      }
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`Metadata fix queuing complete: ${totalQueued} queued, ${totalErrors} errors`);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "Inconsistent metadata games queued for update",
        inconsistentCount: inconsistentGames.length,
        userOwnedCount,
        otherGamesCount,
        totalQueued,
        totalErrors,
        nextSteps: [
          "Use the admin dashboard to start batch processing",
          "Monitor progress in the Queue Manager",
          "Verify metadata consistency after processing completes"
        ]
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (err) {
    console.error("Unexpected error in fix-inconsistent-metadata:", err);
    return new Response(
      JSON.stringify({ error: "Unexpected error", details: err.message }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
