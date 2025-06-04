
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Image utility functions for header image enhancement
function extractImageHashFromUrl(steamUrl: string): string | null {
  if (!steamUrl || steamUrl === '/placeholder.svg') return null;
  const match = steamUrl.match(/\/apps\/\d+\/([^\/]+)\.jpg$/);
  return match ? match[1] : null;
}

function isValidHeaderImage(headerImage: string | null): boolean {
  if (!headerImage) return false;
  if (headerImage === '/placeholder.svg') return false;
  if (headerImage === 'null' || headerImage === '') return false;
  return true;
}

async function enhanceGameHeaderImage(appId: number): Promise<{ success: boolean; enhanced: boolean; error?: string }> {
  try {
    console.log(`Enhancing header image for app ${appId}`);
    
    // Fetch from Steam Store API for high-quality header image
    const storeUrl = `https://store.steampowered.com/api/appdetails?appids=${appId}`;
    const response = await fetch(storeUrl);
    
    if (!response.ok) {
      console.error(`Steam API error for app ${appId}:`, response.status);
      return { success: false, enhanced: false, error: `Steam API error: ${response.status}` };
    }
    
    const data = await response.json();
    const details = data[appId];
    
    if (!details || !details.success || !details.data) {
      console.log(`No valid data for app ${appId}`);
      return { success: true, enhanced: false, error: "No valid data from Steam" };
    }
    
    const headerImage = details.data.header_image;
    
    if (!isValidHeaderImage(headerImage)) {
      console.log(`No valid header image found for app ${appId}`);
      return { success: true, enhanced: false, error: "No valid header image available" };
    }
    
    // Extract hash for image_url consistency (fallback compatibility)
    const imageHash = extractImageHashFromUrl(headerImage);
    
    // Update the game with the enhanced header image
    const { error: updateError } = await supabase
      .from("games")
      .update({
        header_image: headerImage,
        // Update image_url with hash if we extracted one for consistency
        ...(imageHash && { image_url: imageHash }),
        updated_at: new Date().toISOString()
      })
      .eq("id", appId);
    
    if (updateError) {
      console.error(`Database update error for app ${appId}:`, updateError);
      return { success: false, enhanced: false, error: `Database error: ${updateError.message}` };
    }
    
    console.log(`Successfully enhanced header image for app ${appId}: ${headerImage}`);
    return { success: true, enhanced: true };
    
  } catch (error) {
    console.error(`Error enhancing app ${appId}:`, error);
    return { success: false, enhanced: false, error: error.message };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    console.log("Starting header image enhancement function");
    
    // Parse request parameters
    let targetAppId: number | null = null;
    let batchSize: number = 20; // Conservative batch size to avoid rate limits
    let enhancementType: string = "missing_headers"; // missing_headers, failed_queue, low_quality
    
    try {
      const body = await req.json();
      targetAppId = body.appId ? Number(body.appId) : null;
      batchSize = body.batchSize ? Number(body.batchSize) : batchSize;
      enhancementType = body.enhancementType || enhancementType;
    } catch {
      // If body parsing fails, check URL parameters
      const url = new URL(req.url);
      const appIdParam = url.searchParams.get('appId');
      const batchSizeParam = url.searchParams.get('batchSize');
      const typeParam = url.searchParams.get('type');
      
      targetAppId = appIdParam ? Number(appIdParam) : null;
      batchSize = batchSizeParam ? Number(batchSizeParam) : batchSize;
      enhancementType = typeParam || enhancementType;
    }
    
    // Validate batch size (max 50 to prevent abuse)
    if (batchSize > 50) batchSize = 50;
    
    // Handle single app enhancement
    if (targetAppId) {
      console.log(`Enhancing single app: ${targetAppId}`);
      const result = await enhanceGameHeaderImage(targetAppId);
      
      return new Response(
        JSON.stringify({
          success: result.success,
          appId: targetAppId,
          enhanced: result.enhanced,
          error: result.error
        }),
        { status: result.success ? 200 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Handle batch enhancement based on type
    let query;
    let description = "";
    
    switch (enhancementType) {
      case "missing_headers":
        // Games with no header_image or placeholder/null values
        query = supabase
          .from("games")
          .select("id, name, header_image")
          .or("header_image.is.null,header_image.eq./placeholder.svg,header_image.eq.null,header_image.eq.")
          .order("id", { ascending: true })
          .limit(batchSize);
        description = "games with missing header images";
        break;
        
      case "failed_queue":
        // Games that failed in the steam_app_queue (likely missing data)
        query = supabase
          .from("games")
          .select("id, name, header_image")
          .in("id", 
            supabase
              .from("steam_app_queue")
              .select("app_id")
              .eq("status", "failed")
          )
          .order("id", { ascending: true })
          .limit(batchSize);
        description = "games that failed in processing queue";
        break;
        
      case "low_quality":
        // Games where header_image looks like it might be low quality (short hash-like strings)
        query = supabase
          .from("games")
          .select("id, name, header_image, image_url")
          .not("header_image", "like", "https://cdn.%")
          .not("header_image", "like", "https://media.steampowered.com%")
          .not("header_image", "is", null)
          .neq("header_image", "/placeholder.svg")
          .neq("header_image", "")
          .order("id", { ascending: true })
          .limit(batchSize);
        description = "games with potentially low-quality header images";
        break;
        
      default:
        return new Response(
          JSON.stringify({ error: "Invalid enhancement type. Use: missing_headers, failed_queue, low_quality" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
    
    const { data: games, error: fetchError } = await query;
    
    if (fetchError) {
      console.error("Error fetching games:", fetchError);
      return new Response(
        JSON.stringify({ error: "Database fetch error", details: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!games || games.length === 0) {
      console.log(`No games found for enhancement type: ${enhancementType}`);
      return new Response(
        JSON.stringify({ 
          message: `No games found for enhancement`,
          enhancementType,
          description
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Found ${games.length} ${description} to enhance`);
    
    // Process games with rate limiting
    const results = {
      total: games.length,
      enhanced: 0,
      failed: 0,
      skipped: 0,
      enhancementType,
      description,
      details: [] as any[]
    };
    
    for (const game of games) {
      // Add delay to respect Steam API rate limits
      await new Promise(resolve => setTimeout(resolve, 250)); // 250ms delay between requests
      
      const result = await enhanceGameHeaderImage(game.id);
      
      if (result.success && result.enhanced) {
        results.enhanced++;
      } else if (result.success && !result.enhanced) {
        results.skipped++;
      } else {
        results.failed++;
      }
      
      results.details.push({
        appId: game.id,
        name: game.name,
        success: result.success,
        enhanced: result.enhanced,
        error: result.error
      });
    }
    
    console.log(`Header image enhancement complete: ${results.enhanced} enhanced, ${results.failed} failed, ${results.skipped} skipped`);
    
    return new Response(
      JSON.stringify({
        success: true,
        completed: true,
        ...results
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Unexpected error", details: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
