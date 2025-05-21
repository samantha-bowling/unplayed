
// supabase/functions/fetch-steam-app-list/index.ts
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    console.log("Starting fetch-steam-app-list function");

    // Check if we have a Steam API key
    if (!STEAM_API_KEY) {
      console.error("STEAM_API_KEY is not set");
      return new Response(
        JSON.stringify({ error: "STEAM_API_KEY is not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create a new sync record
    const { data: syncData, error: syncError } = await supabase
      .from("steam_app_sync")
      .insert([{ status: "running" }])
      .select()
      .single();

    if (syncError) {
      console.error("Error creating sync record:", syncError);
      return new Response(
        JSON.stringify({ error: "Failed to create sync record" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const syncId = syncData.id;
    console.log(`Created sync record with ID: ${syncId}`);

    // Fetch the list of all apps from Steam API
    const steamApiUrl = `https://api.steampowered.com/ISteamApps/GetAppList/v2/?key=${STEAM_API_KEY}`;
    
    console.log("Fetching from Steam API...");
    const response = await fetch(steamApiUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Steam API error:", response.status, errorText);
      
      // Update the sync record with error status
      await supabase
        .from("steam_app_sync")
        .update({ status: "error" })
        .eq("id", syncId);
      
      return new Response(
        JSON.stringify({ error: "Error fetching Steam app list", details: errorText }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    const data = await response.json();
    const apps = data?.applist?.apps || [];
    
    console.log(`Received ${apps.length} apps from Steam API`);

    // Update the sync record with the total number of apps
    await supabase
      .from("steam_app_sync")
      .update({ 
        total_apps: apps.length,
        status: "processing" 
      })
      .eq("id", syncId);

    // Process the apps in batches to avoid overwhelming the database
    const BATCH_SIZE = 500;
    const totalBatches = Math.ceil(apps.length / BATCH_SIZE);
    console.log(`Processing in ${totalBatches} batches of ${BATCH_SIZE}`);

    // Use EdgeRuntime.waitUntil to continue processing in the background
    const processPromise = async () => {
      let processedCount = 0;
      
      for (let i = 0; i < apps.length; i += BATCH_SIZE) {
        const batch = apps.slice(i, i + BATCH_SIZE);
        console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${totalBatches}`);
        
        // Prepare the batch for insert into steam_app_queue
        const queueItems = batch.map(app => ({
          app_id: app.appid,
          name: app.name,
          priority: Math.floor(Math.random() * 5) // Randomize priority for even distribution
        }));
        
        // Insert into queue with conflict handling
        const { error: insertError } = await supabase
          .from("steam_app_queue")
          .upsert(queueItems, {
            onConflict: "app_id",
            ignoreDuplicates: true,
          });
        
        if (insertError) {
          console.error(`Error inserting batch ${Math.floor(i / BATCH_SIZE) + 1}:`, insertError);
        } else {
          processedCount += batch.length;
          
          // Update the sync record with progress
          await supabase
            .from("steam_app_sync")
            .update({ 
              processed_apps: processedCount,
              status: i + BATCH_SIZE >= apps.length ? "completed" : "processing"
            })
            .eq("id", syncId);
        }
        
        // Add a small delay to avoid overwhelming the database
        if (i + BATCH_SIZE < apps.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      console.log(`Completed processing ${processedCount} apps`);
      
      // Final update to sync record
      return await supabase
        .from("steam_app_sync")
        .update({ 
          processed_apps: processedCount,
          status: "completed",
          last_sync: new Date().toISOString()
        })
        .eq("id", syncId);
    };

    // For Edge Functions supporting waitUntil, we can continue processing after response
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      // Send immediate response while continuing processing in background
      EdgeRuntime.waitUntil(processPromise().catch(err => {
        console.error("Background processing failed:", err);
        
        // Update sync record with error status
        supabase
          .from("steam_app_sync")
          .update({ 
            status: "error" 
          })
          .eq("id", syncId);
      }));
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Steam app list fetch started",
          totalApps: apps.length,
          syncId,
          processing: "background"
        }), 
        { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // For environments not supporting waitUntil, process and wait for completion
      await processPromise();
      
      return new Response(
        JSON.stringify({ 
          success: true,
          completed: true, 
          totalApps: apps.length,
          syncId
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
