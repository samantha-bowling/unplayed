// supabase/functions/fetch-steam-app-details/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STEAM_API_KEY = Deno.env.get("STEAM_API_KEY")!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// CORS headers for browser preflight requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Adaptive rate limiting settings
const DEFAULT_DELAY_MS = 300;
const MIN_DELAY_MS = 200;
const MAX_DELAY_MS = 1000;
let currentDelayMs = DEFAULT_DELAY_MS;
let consecutiveSuccess = 0;
let consecutiveErrors = 0;

// Image utility functions (updated for consistent Steam Store API usage)
function constructSteamImageUrl(appId, imageHash, imageType = 'icon') {
  if (!appId || !imageHash) return null;
  
  // Remove any existing URL prefix if present
  const cleanHash = imageHash.replace(/^https?:\/\/.*\//, '');
  
  // Construct the proper Steam CDN URL
  const baseUrl = 'https://media.steampowered.com/steamcommunity/public/images/apps';
  return `${baseUrl}/${appId}/${cleanHash}.jpg`;
}

function extractImageHashFromUrl(steamUrl) {
  if (!steamUrl || steamUrl === '/placeholder.svg') return null;
  
  // Match pattern: https://media.steampowered.com/steamcommunity/public/images/apps/{appid}/{hash}.jpg
  const match = steamUrl.match(/\/apps\/\d+\/([^\/]+)\.jpg$/);
  return match ? match[1] : null;
}

/**
 * Updated image normalization for consistent Steam Store API usage
 * Always prioritizes header_image from Steam Store API and extracts hash for image_url
 */
function normalizeGameImageData(imageData, gameId) {
  // Priority 1: Use header_image from Steam Store API (full URL)
  let header_image = null;
  let image_url = null;
  
  if (imageData.header_image) {
    // Store the full header_image URL from Steam Store API
    header_image = imageData.header_image;
    
    // Extract hash from header_image for image_url consistency
    const extractedHash = extractImageHashFromUrl(imageData.header_image);
    if (extractedHash) {
      image_url = extractedHash;
    }
  }
  
  // Fallback: If no header_image but we have other image data
  if (!header_image && imageData.img_logo_url) {
    header_image = constructSteamImageUrl(gameId, imageData.img_logo_url, 'logo');
    image_url = imageData.img_logo_url;
  } else if (!header_image && imageData.img_icon_url) {
    // Last resort: use icon as header if nothing else available
    header_image = constructSteamImageUrl(gameId, imageData.img_icon_url, 'icon');
    image_url = imageData.img_icon_url;
  }
  
  return {
    image_url,
    header_image
  };
}

// Process app details from Steam's API response
function processAppDetails(appId, details) {
  try {
    if (!details || !details.success) return null;
    
    // Handle invalid release dates that cause Invalid time value errors
    let releaseDate = null;
    if (details.data.release_date && details.data.release_date.date && details.data.release_date.date !== "") {
      try {
        releaseDate = new Date(details.data.release_date.date).toISOString();
      } catch (e) {
        console.log(`Invalid release date for app ${appId}: ${details.data.release_date.date}`);
      }
    }
    
    // Use the updated image normalization function for consistent Steam Store API format
    const normalizedImages = normalizeGameImageData({
      header_image: details.data.header_image
    }, appId);
    
    return {
      id: appId,
      name: details.data.name,
      description: details.data.detailed_description || details.data.about_the_game || null,
      image_url: normalizedImages.image_url,
      header_image: normalizedImages.header_image,
      price_cents: details.data.price_overview ? details.data.price_overview.initial : null,
      release_date: releaseDate,
      metacritic_score: details.data.metacritic ? details.data.metacritic.score : null,
      developer: Array.isArray(details.data.developers) ? details.data.developers : null,
      publisher: Array.isArray(details.data.publishers) ? details.data.publishers : null,
      genres: details.data.genres 
        ? details.data.genres.map((genre) => genre.description) 
        : [],
      categories: details.data.categories 
        ? details.data.categories.map((category) => category.description) 
        : [],
      platforms: determinePlatforms(details.data.platforms),
      screenshots: details.data.screenshots 
        ? details.data.screenshots.map((screenshot) => screenshot.path_full) 
        : null,
    };
  } catch (error) {
    console.error(`Error processing app details for ${appId}:`, error);
    return null;
  }
}

// Helper to determine platforms from Steam's response
function determinePlatforms(platforms: any) {
  if (!platforms) return null;
  
  const result = [];
  if (platforms.windows) result.push('windows');
  if (platforms.mac) result.push('mac');
  if (platforms.linux) result.push('linux');
  
  return result.length > 0 ? result : null;
}

// Safely increment the attempts value for a queue item
async function incrementAttempts(appId: number) {
  try {
    const { data: queueItem } = await supabase
      .from("steam_app_queue")
      .select("attempts")
      .eq("app_id", appId)
      .single();
      
    const currentAttempts = queueItem?.attempts || 0;
    return currentAttempts + 1;
  } catch (error) {
    console.error(`Error getting current attempts for app ${appId}:`, error);
    return 1; // Default to 1 if we can't get the current value
  }
}

// Adjust the delay time based on API responses
function adjustDelayTime(success: boolean) {
  if (success) {
    consecutiveSuccess++;
    consecutiveErrors = 0;
    
    // Reduce delay after multiple consecutive successes
    if (consecutiveSuccess >= 5 && currentDelayMs > MIN_DELAY_MS) {
      currentDelayMs = Math.max(MIN_DELAY_MS, currentDelayMs - 20);
      console.log(`Reduced delay to ${currentDelayMs}ms after ${consecutiveSuccess} successful requests`);
    }
  } else {
    consecutiveErrors++;
    consecutiveSuccess = 0;
    
    // Increase delay after errors
    if (consecutiveErrors >= 2) {
      currentDelayMs = Math.min(MAX_DELAY_MS, currentDelayMs + 100);
      console.log(`Increased delay to ${currentDelayMs}ms after ${consecutiveErrors} failed requests`);
    }
  }
  
  return currentDelayMs;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    console.log("Starting fetch-steam-app-details function with updated image processing");
    
    // Parse request for appId or batch processing parameter
    let appId: number | null = null;
    let processBatch: boolean = false;
    let batchSize: number = 10;
    
    // Try to parse request body
    try {
      const body = await req.json();
      appId = body.appId ? Number(body.appId) : null;
      processBatch = body.processBatch === true;
      batchSize = body.batchSize ? Number(body.batchSize) : batchSize;
    } catch {
      // If body parsing fails, check URL parameters
      const url = new URL(req.url);
      const appIdParam = url.searchParams.get('appId');
      const processBatchParam = url.searchParams.get('processBatch');
      
      appId = appIdParam ? Number(appIdParam) : null;
      processBatch = processBatchParam === 'true';
      
      const batchSizeParam = url.searchParams.get('batchSize');
      if (batchSizeParam) batchSize = Number(batchSizeParam);
    }
    
    // Validate batchSize to prevent abuse (max 50)
    if (batchSize > 50) batchSize = 50;
    
    // If processing a single appId
    if (appId && !processBatch) {
      console.log(`Fetching details for app ID: ${appId}`);
      
      // Fetch from Steam Store API
      const storeUrl = `https://store.steampowered.com/api/appdetails?appids=${appId}`;
      const response = await fetch(storeUrl);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error fetching details for app ${appId}:`, response.status, errorText);
        return new Response(
          JSON.stringify({ error: "Steam API error", details: errorText }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const data = await response.json();
      const details = data[appId];
      
      if (!details || !details.success) {
        console.log(`No valid details returned for app ${appId}`);
        
        // Mark this app as failed in the queue
        const { error: updateError } = await supabase
          .from("steam_app_queue")
          .update({ 
            status: "failed", 
            attempts: await incrementAttempts(appId),
            last_attempt: new Date().toISOString()
          })
          .eq("app_id", appId);
          
        if (updateError) {
          console.error(`Error updating queue status for app ${appId}:`, updateError);
        }
        
        return new Response(
          JSON.stringify({ error: "No valid details returned from Steam" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Process the app details
      const processedDetails = processAppDetails(appId, details);
      
      if (!processedDetails) {
        console.error(`Failed to process details for app ${appId}`);
        return new Response(
          JSON.stringify({ error: "Failed to process app details" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      console.log(`Processed app ${appId} with images:`, {
        header_image: processedDetails.header_image,
        image_url: processedDetails.image_url
      });
      
      // Upsert the game details to our database
      const { error: upsertError } = await supabase
        .from("games")
        .upsert(processedDetails, {
          onConflict: "id",
          ignoreDuplicates: false,
        });
      
      if (upsertError) {
        console.error(`Error upserting game ${appId}:`, upsertError);
        return new Response(
          JSON.stringify({ error: "Database error", details: upsertError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Update the queue status
      const { error: queueUpdateError } = await supabase
        .from("steam_app_queue")
        .update({ 
          status: "completed", 
          attempts: await incrementAttempts(appId),
          last_attempt: new Date().toISOString()
        })
        .eq("app_id", appId);
        
      if (queueUpdateError) {
        console.error(`Error updating queue status for app ${appId}:`, queueUpdateError);
      }
      
      return new Response(
        JSON.stringify({ 
          success: true,
          appId,
          details: processedDetails
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    // Process a batch of apps from the queue
    else if (processBatch) {
      console.log(`Processing batch of up to ${batchSize} apps with updated image processing`);
      
      // Get next batch of apps from the queue, with priority sorting
      const { data: queueItems, error: queueError } = await supabase
        .from("steam_app_queue")
        .select("app_id, name, priority")
        .eq("status", "pending")
        .order("priority", { ascending: false })
        .order("attempts", { ascending: true })
        .limit(batchSize);
      
      if (queueError) {
        console.error("Error fetching from queue:", queueError);
        return new Response(
          JSON.stringify({ error: "Queue fetch error", details: queueError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (!queueItems || queueItems.length === 0) {
        console.log("No pending items found in queue");
        return new Response(
          JSON.stringify({ message: "No pending items in queue" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      console.log(`Found ${queueItems.length} items to process`);
      
      // Background processing of the batch
      const processBatchPromise = async () => {
        const results = {
          total: queueItems.length,
          success: 0,
          failed: 0,
          skipped: 0,
          details: {} as Record<number, any>,
          currentDelay: currentDelayMs,
          updatedImages: 0
        };
        
        for (const item of queueItems) {
          const appId = item.app_id;
          console.log(`Processing app ${appId} (${item.name || 'Unknown'}) with priority ${item.priority || 0}`);
          
          try {
            // Mark as processing
            await supabase
              .from("steam_app_queue")
              .update({ 
                status: "processing", 
                last_attempt: new Date().toISOString()
              })
              .eq("app_id", appId);
            
            // Add adaptive delay to avoid hitting Steam API rate limits
            await new Promise(resolve => setTimeout(resolve, currentDelayMs));
            
            // Fetch from Steam Store API
            const storeUrl = `https://store.steampowered.com/api/appdetails?appids=${appId}`;
            const response = await fetch(storeUrl);
            
            if (!response.ok) {
              console.error(`Error fetching details for app ${appId}:`, response.status);
              results.failed++;
              
              // Update status based on response status
              let newStatus = "error";
              if (response.status === 429) {
                console.log("Rate limiting detected, increasing delay");
                currentDelayMs = adjustDelayTime(false);
                newStatus = "pending"; // Requeue for later if rate limited
              }
              
              await supabase
                .from("steam_app_queue")
                .update({ 
                  status: newStatus, 
                  attempts: await incrementAttempts(appId),
                  last_attempt: new Date().toISOString()
                })
                .eq("app_id", appId);
              
              continue;
            }
            
            const data = await response.json();
            const details = data[appId];
            
            // Successfully received response, adjust delay time
            currentDelayMs = adjustDelayTime(true);
            
            if (!details || !details.success) {
              console.log(`No valid details returned for app ${appId}`);
              results.failed++;
              
              await supabase
                .from("steam_app_queue")
                .update({ 
                  status: "failed", 
                  attempts: await incrementAttempts(appId),
                  last_attempt: new Date().toISOString()
                })
                .eq("app_id", appId);
              
              continue;
            }
            
            // Process the app details
            const processedDetails = processAppDetails(appId, details);
            
            if (!processedDetails) {
              console.error(`Failed to process details for app ${appId}`);
              results.failed++;
              
              await supabase
                .from("steam_app_queue")
                .update({ 
                  status: "error", 
                  attempts: await incrementAttempts(appId),
                  last_attempt: new Date().toISOString()
                })
                .eq("app_id", appId);
                
              continue;
            }
            
            // Add to results
            results.details[appId] = {
              name: processedDetails.name,
              release_date: processedDetails.release_date,
              header_image: processedDetails.header_image,
              image_url: processedDetails.image_url,
            };
            
            // Track if this is an image metadata update
            if (processedDetails.header_image) {
              results.updatedImages++;
            }
            
            // Upsert the game details to our database
            const { error: upsertError } = await supabase
              .from("games")
              .upsert(processedDetails, {
                onConflict: "id",
                ignoreDuplicates: false,
              });
            
            if (upsertError) {
              console.error(`Error upserting game ${appId}:`, upsertError);
              results.failed++;
              
              await supabase
                .from("steam_app_queue")
                .update({ 
                  status: "error", 
                  attempts: await incrementAttempts(appId),
                  last_attempt: new Date().toISOString()
                })
                .eq("app_id", appId);
              
              continue;
            }
            
            // Update the queue status
            await supabase
              .from("steam_app_queue")
              .update({ 
                status: "completed", 
                attempts: await incrementAttempts(appId),
                last_attempt: new Date().toISOString()
              })
              .eq("app_id", appId);
            
            results.success++;
            console.log(`Successfully updated app ${appId} with consistent image metadata`);
          } catch (error) {
            console.error(`Error processing app ${appId}:`, error);
            results.failed++;
            
            // Update queue status
            await supabase
              .from("steam_app_queue")
              .update({ 
                status: "error", 
                attempts: await incrementAttempts(appId),
                last_attempt: new Date().toISOString()
              })
              .eq("app_id", appId);
          }
        }
        
        console.log(`Batch processing complete: ${results.success} successful, ${results.failed} failed, ${results.updatedImages} images updated`);
        return results;
      };
      
      // For Edge Functions supporting waitUntil, we can continue processing after response
      if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
        // Send immediate response while continuing processing in background
        EdgeRuntime.waitUntil(processBatchPromise().catch(err => {
          console.error("Background batch processing failed:", err);
        }));
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Batch processing started with updated image handling",
            batchSize,
            itemsInBatch: queueItems.length,
            processing: "background",
            currentDelay: currentDelayMs
          }), 
          { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        // For environments not supporting waitUntil, process and wait for completion
        const results = await processBatchPromise();
        
        return new Response(
          JSON.stringify({ 
            success: true,
            completed: true, 
            ...results
          }), 
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    // Neither appId nor processBatch provided
    else {
      console.error("No valid parameters provided");
      return new Response(
        JSON.stringify({ error: "Missing required parameters. Provide either appId or set processBatch=true" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
