
// supabase/functions/import-library/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { fetchCompleteSteamLibrary, validateLibraryCompleteness } from '../shared/enhanced-steam-api-utils.ts';
import { safeImportNewGames, updateExistingGamesPlaytime } from '../shared/import-analysis-utils.ts';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// CORS headers for browser preflight requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

// Helper function to trigger user metrics calculation with error handling
async function triggerUserMetricsCalculation(userId: string, authToken: string) {
  try {
    console.log(`🧮 Triggering user metrics calculation for user ${userId}`);
    
    const { data, error } = await supabase.functions.invoke('calculate-user-metrics', {
      headers: {
        Authorization: `Bearer ${authToken}`,
      }
    });

    if (error) {
      console.error('Error triggering user metrics calculation:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ User metrics calculation completed successfully');
    return { success: true, data };
  } catch (error) {
    console.error('Exception during user metrics calculation:', error);
    return { success: false, error: error.message };
  }
}

// Helper function to trigger spending metrics calculation with error handling
async function triggerSpendingCalculation(userId: string, authToken: string) {
  try {
    console.log(`💰 Triggering spending calculation for user ${userId}`);
    
    const { data, error } = await supabase.functions.invoke('calculate-user-spending', {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      body: { 
        user_id: userId,
        force_refresh: true 
      }
    });

    if (error) {
      console.error('Error triggering spending calculation:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Spending calculation completed successfully');
    return { success: true, data };
  } catch (error) {
    console.error('Exception during spending calculation:', error);
    return { success: false, error: error.message };
  }
}

// Helper function to run the complete calculation chain with improved sequencing
async function runCalculationChain(userId: string, authToken: string) {
  console.log(`🔄 Starting automated calculation chain for user ${userId}`);
  
  const results = {
    userMetrics: { success: false, error: null },
    spending: { success: false, error: null }
  };

  // Run user metrics calculation first (sequential for data consistency)
  const metricsResult = await triggerUserMetricsCalculation(userId, authToken);
  results.userMetrics = metricsResult;

  // Only run spending calculation if metrics succeeded OR if metrics failed non-critically
  if (metricsResult.success || !metricsResult.error?.includes('critical')) {
    // Small delay to ensure metrics are committed before spending calculation
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const spendingResult = await triggerSpendingCalculation(userId, authToken);
    results.spending = spendingResult;
  } else {
    console.warn('⚠️ Skipping spending calculation due to critical metrics failure');
    results.spending = { success: false, error: 'Skipped due to metrics failure' };
  }

  const successCount = (results.userMetrics.success ? 1 : 0) + (results.spending.success ? 1 : 0);
  
  console.log(`📊 Calculation chain completed: ${successCount}/2 successful`);
  return results;
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
    console.log("🚀 Processing enhanced import-library request");
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

    const { steamId } = body;
    if (!steamId) {
      return new Response(JSON.stringify({
        error: "steamId is required"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

    console.log("🔍 Looking up user with steam_id:", steamId);
    
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
    
    const userId = userData.id;
    console.log(`✅ Found user ${userId} with Steam ID ${steamId}`);
    
    // Get Steam API key
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
    
    // Step 1: Fetch complete Steam library with enhanced API handling
    console.log("📚 Fetching complete Steam library...");
    let steamGames;
    try {
      steamGames = await fetchCompleteSteamLibrary(steamId, STEAM_API_KEY, {
        includeAppInfo: true,
        includePlayedFreeGames: true,
        retryAttempts: 3
      });
      
      console.log(`✅ Successfully fetched ${steamGames.length} games from Steam library`);
      
      // Validate library completeness
      const validation = validateLibraryCompleteness(steamGames);
      if (!validation.isComplete) {
        console.warn("⚠️ Library validation warnings:", validation.warnings);
      }
      
    } catch (error) {
      console.error("Steam API error:", error);
      let errorMessage = "Failed to fetch Steam library";
      let helpText = "";
      
      if (error.message.includes('rate limit')) {
        errorMessage = "Steam API rate limit reached";
        helpText = "Please wait a few minutes before trying to import again.";
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

    // Handle empty library
    if (steamGames.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        warning: "No games found in Steam library. This could be due to privacy settings.",
        helpText: "Make sure your Steam profile's 'Game details' are set to Public in your Steam Privacy Settings.",
        imported: 0,
        updated: 0,
        total: 0
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

    // Step 2: Analyze what needs to be imported vs updated
    console.log("🔍 Analyzing library for import...");
    
    // Get existing user games
    const { data: existingUserGames, error: existingError } = await supabase
      .from('user_games')
      .select('game_id')
      .eq('user_id', userId);
    
    if (existingError) {
      console.error('Error fetching existing user games:', existingError);
      throw existingError;
    }
    
    const existingGameIds = new Set(existingUserGames?.map(ug => ug.game_id) || []);
    console.log(`📚 User already has ${existingGameIds.size} games imported`);
    
    // Separate new games from existing games
    const newGames = steamGames.filter(game => !existingGameIds.has(game.appid));
    const existingGames = steamGames.filter(game => existingGameIds.has(game.appid));
    
    console.log(`🆕 Found ${newGames.length} new games to import`);
    console.log(`🔄 Found ${existingGames.length} existing games to update`);

    // Background processing for the import
    const importPromise = async () => {
      const results = {
        newGamesImported: 0,
        existingGamesUpdated: 0,
        totalProcessed: 0,
        errors: [] as string[],
        warnings: [] as string[]
      };

      try {
        // Step 3: Safely import new games (preserving enriched data)
        if (newGames.length > 0) {
          console.log(`📥 Importing ${newGames.length} new games...`);
          const importResult = await safeImportNewGames(supabase, userId, steamId, newGames);
          
          results.newGamesImported = importResult.newGamesImported;
          results.errors.push(...importResult.errors);
          results.warnings.push(...importResult.warnings);
          
          // Queue new games for detailed enrichment (metadata, images, etc.)
          if (importResult.newGamesImported > 0) {
            console.log(`🎯 Queueing ${importResult.newGamesImported} new games for enrichment...`);
            try {
              const queueInserts = newGames.slice(0, importResult.newGamesImported).map(game => ({
                app_id: game.appid,
                name: game.name,
                priority: 50 // Medium priority for newly imported games
              }));

              const { error: queueError } = await supabase
                .from('steam_app_queue')
                .upsert(queueInserts, { 
                  onConflict: 'app_id',
                  ignoreDuplicates: true 
                });

              if (queueError) {
                console.error('Error queueing games for enrichment:', queueError);
                results.warnings.push(`Failed to queue ${queueInserts.length} games for enrichment`);
              } else {
                console.log(`✅ Queued ${queueInserts.length} games for enrichment`);
              }
            } catch (queueErr) {
              console.error('Unexpected error queueing games:', queueErr);
              results.warnings.push('Failed to queue some games for enrichment');
            }
          }
        }

        // Step 4: Update existing games (playtime only, preserve enriched data)
        if (existingGames.length > 0) {
          console.log(`🔄 Updating ${existingGames.length} existing games...`);
          const updateResult = await updateExistingGamesPlaytime(supabase, userId, existingGames);
          
          results.existingGamesUpdated = updateResult.existingGamesUpdated;
          results.errors.push(...updateResult.errors);
          results.warnings.push(...updateResult.warnings);
        }

        results.totalProcessed = results.newGamesImported + results.existingGamesUpdated;

        // Update last_sync timestamp on the user record
        if (results.totalProcessed > 0 || steamGames.length > 0) {
          console.log(`🕐 Updating last_sync for user ${userId}...`);
          const { error: syncError } = await supabase
            .from('users')
            .update({ last_sync: new Date().toISOString() })
            .eq('id', userId);
          
          if (syncError) {
            console.error('Failed to update last_sync:', syncError);
            results.warnings.push('Failed to update sync timestamp');
          } else {
            console.log('✅ last_sync updated successfully');
          }
        }

        console.log(`🎯 Import completed:`, results);

        // **NEW: Auto-trigger calculation chain after successful import**
        if (results.totalProcessed > 0) {
          console.log(`🤖 Auto-triggering calculation chain for user ${userId}...`);
          const calculationResults = await runCalculationChain(userId, authHeader);
          
          // Log calculation results but don't fail the import if calculations fail
          if (calculationResults.userMetrics.success && calculationResults.spending.success) {
            console.log(`🎉 Import and auto-calculations completed successfully!`);
            results.warnings.push('Metrics and spending data calculated automatically');
          } else {
            console.warn(`⚠️ Import succeeded but some calculations failed:`, calculationResults);
            results.warnings.push('Import successful, but some metric calculations failed. You may need to refresh your dashboard.');
          }
        }

        return results;

      } catch (error) {
        console.error('Import processing error:', error);
        results.errors.push(`Import processing failed: ${error.message}`);
        return results;
      }
    };

    // For Edge Functions supporting waitUntil, continue processing in background
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      EdgeRuntime.waitUntil(importPromise().then((result) => {
        console.log("Enhanced import completed in background:", result);
      }).catch((err) => {
        console.error("Background import failed:", err);
      }));
      
      return new Response(JSON.stringify({
        success: true,
        message: "Enhanced library import started with auto-calculations",
        totalGames: steamGames.length,
        newGamesFound: newGames.length,
        existingGames: existingGames.length,
        processing: "background",
        status: "processing",
        helpText: "Your games are being imported with smart detection and metrics will be calculated automatically.",
        improvements: [
          "Only new games will be imported",
          "Existing games will have playtime updated only", 
          "Enriched metadata (images, descriptions) will be preserved",
          "Metrics and spending data will be calculated automatically",
          "Large libraries are handled more reliably"
        ]
      }), {
        status: 202,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    } else {
      // For environments not supporting waitUntil, process and wait for completion
      const result = await importPromise();
      return new Response(JSON.stringify({
        success: true,
        imported: result.newGamesImported,
        updated: result.existingGamesUpdated,
        total: result.totalProcessed,
        errors: result.errors,
        warnings: result.warnings,
        status: "complete",
        improvements: [
          "Smart import detection implemented",
          "Preserved enriched metadata",
          "Enhanced Steam API handling",
          "Automatic metrics calculation",
          "Better error handling and validation"
        ]
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
