
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// CORS headers for browser preflight requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

// Enhanced price validation function
function validateGamePrice(priceCents: number | null | undefined, gameName?: string): {
  isValid: boolean;
  validatedPrice: number | null;
  reason?: string;
} {
  if (priceCents === null || priceCents === undefined) {
    return { isValid: false, validatedPrice: null, reason: 'No price data' };
  }

  if (priceCents < 0) {
    return { isValid: false, validatedPrice: null, reason: 'Negative price' };
  }

  if (priceCents > 50000) { // $500 cap
    console.warn(`Rejecting unrealistic price for game "${gameName}": $${(priceCents / 100).toFixed(2)}`);
    return { isValid: false, validatedPrice: null, reason: 'Price too high (likely bad data)' };
  }

  return { isValid: true, validatedPrice: priceCents };
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

  try {
    console.log("🚀 Enhanced price refresh function starting");
    
    const body = await req.json();
    const { app_ids, force_refresh = false, validate_prices = true } = body;

    if (!app_ids || !Array.isArray(app_ids) || app_ids.length === 0) {
      return new Response(JSON.stringify({
        error: "app_ids array is required"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log(`📊 Processing ${app_ids.length} games with validation: ${validate_prices}`);

    // Process games in batches to avoid timeouts
    const batchSize = 10;
    let totalUpdated = 0;
    let totalValidated = 0;
    let totalRejected = 0;
    const validationErrors: string[] = [];

    for (let i = 0; i < app_ids.length; i += batchSize) {
      const batch = app_ids.slice(i, i + batchSize);
      console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(app_ids.length / batchSize)}`);

      try {
        // Build Steam Store API URL for batch
        const steamUrl = `https://store.steampowered.com/api/appdetails?appids=${batch.join(',')}&filters=price_overview`;
        console.log(`🌐 Fetching Steam prices for batch: ${batch.join(',')}`);

        const response = await fetch(steamUrl);
        if (!response.ok) {
          console.error(`Steam API error for batch: ${response.status}`);
          continue;
        }

        const steamData = await response.json();

        // Process each game in the batch
        for (const appId of batch) {
          try {
            const gameData = steamData[appId];
            
            if (!gameData || !gameData.success) {
              console.log(`⚠️ No valid data for app ${appId}`);
              continue;
            }

            const priceOverview = gameData.data?.price_overview;
            let finalPrice: number | null = null;
            let initialPrice: number | null = null;
            let discountPercent: number | null = null;
            let currency = 'USD';

            if (priceOverview) {
              // Extract price data
              finalPrice = priceOverview.final || null;
              initialPrice = priceOverview.initial || priceOverview.final || null;
              discountPercent = priceOverview.discount_percent || null;
              currency = priceOverview.currency || 'USD';
            } else {
              // Game might be free or not available for purchase
              finalPrice = 0;
              initialPrice = 0;
            }

            // Apply validation if enabled
            if (validate_prices) {
              const finalValidation = validateGamePrice(finalPrice, `App ${appId}`);
              const initialValidation = validateGamePrice(initialPrice, `App ${appId}`);

              if (!finalValidation.isValid) {
                console.log(`❌ Rejected final price for app ${appId}: ${finalValidation.reason}`);
                finalPrice = null;
                totalRejected++;
                validationErrors.push(`App ${appId}: ${finalValidation.reason}`);
              } else {
                totalValidated++;
              }

              if (!initialValidation.isValid) {
                console.log(`❌ Rejected initial price for app ${appId}: ${initialValidation.reason}`);
                initialPrice = null;
              }
            }

            // Upsert price data
            const { error: upsertError } = await supabase
              .from('game_prices')
              .upsert({
                app_id: parseInt(appId),
                final_price_cents: finalPrice,
                initial_price_cents: initialPrice,
                discount_percent: discountPercent,
                currency: currency,
                last_checked: new Date().toISOString()
              }, {
                onConflict: 'app_id'
              });

            if (upsertError) {
              console.error(`Error upserting price for app ${appId}:`, upsertError);
            } else {
              totalUpdated++;
              console.log(`✅ Updated price for app ${appId}: $${(finalPrice || 0) / 100}`);
            }

          } catch (gameError) {
            console.error(`Error processing app ${appId}:`, gameError);
          }
        }

        // Add delay between batches to respect rate limits
        if (i + batchSize < app_ids.length) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }

      } catch (batchError) {
        console.error(`Error processing batch starting at ${i}:`, batchError);
      }
    }

    console.log(`🎯 Enhanced price refresh completed: ${totalUpdated} updated, ${totalValidated} validated, ${totalRejected} rejected`);

    return new Response(JSON.stringify({
      success: true,
      updated_count: totalUpdated,
      validated_count: totalValidated,
      rejected_count: totalRejected,
      total_processed: app_ids.length,
      validation_enabled: validate_prices,
      validation_errors: validationErrors.slice(0, 10), // Return first 10 errors
      message: `Successfully updated ${totalUpdated} prices with enhanced validation`
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("❌ Enhanced price refresh error:", error);
    return new Response(JSON.stringify({
      error: "Enhanced price refresh failed",
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
