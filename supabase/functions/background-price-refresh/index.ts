
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create a Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Delay helper function for rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Type for Steam API response
interface SteamAppDetailsResponse {
  [key: string]: {
    success: boolean;
    data?: {
      price_overview?: {
        currency: string;
        initial: number;
        final: number;
        discount_percent: number;
      };
    };
  };
}

// Function to fetch price data from Steam API
async function fetchGamePrice(appId: number): Promise<{
  app_id: number;
  currency: string;
  initial_price_cents: number | null;
  final_price_cents: number | null;
  discount_percent: number | null;
} | null> {
  try {
    console.log(`Fetching price data for app_id: ${appId}`);
    const response = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}&cc=us&filters=price_overview`);
    
    if (!response.ok) {
      console.error(`Steam API error for app_id ${appId}: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json() as SteamAppDetailsResponse;
    
    // Check if we have valid price data
    if (!data[appId]?.success || !data[appId]?.data?.price_overview) {
      console.log(`No price data available for app_id ${appId}`);
      return {
        app_id: appId,
        currency: 'USD',
        initial_price_cents: null,
        final_price_cents: null,
        discount_percent: null
      };
    }
    
    const priceOverview = data[appId].data.price_overview;
    
    return {
      app_id: appId,
      currency: priceOverview.currency,
      initial_price_cents: priceOverview.initial,
      final_price_cents: priceOverview.final,
      discount_percent: priceOverview.discount_percent
    };
  } catch (error) {
    console.error(`Error fetching price for app_id ${appId}:`, error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }
  
  try {
    console.log('🔄 Starting background price refresh...');
    
    // Get stale prices that need refreshing
    const { data: stalePrices, error: staleError } = await supabase
      .rpc('get_stale_prices_for_refresh', { batch_size: 25 }); // Smaller batch for background
    
    if (staleError) {
      console.error('Error getting stale prices:', staleError);
      throw staleError;
    }
    
    console.log(`📊 Found ${stalePrices?.length || 0} stale prices to refresh`);
    
    if (!stalePrices?.length) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No stale prices found',
          updated_count: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const results = [];
    let successCount = 0;
    let errorCount = 0;
    
    // Process each stale price with rate limiting
    for (let i = 0; i < stalePrices.length; i++) {
      const { app_id } = stalePrices[i];
      
      try {
        const priceData = await fetchGamePrice(app_id);
        
        if (priceData) {
          // Upsert the data into the game_prices table
          const { error: upsertError } = await supabase
            .from('game_prices')
            .upsert({
              app_id: priceData.app_id,
              currency: priceData.currency || 'USD',
              initial_price_cents: priceData.initial_price_cents,
              final_price_cents: priceData.final_price_cents,
              discount_percent: priceData.discount_percent,
              last_checked: new Date().toISOString()
            });
            
          if (upsertError) {
            console.error(`Error upserting price data for app_id ${app_id}:`, upsertError);
            errorCount++;
          } else {
            results.push(priceData);
            successCount++;
          }
        } else {
          errorCount++;
        }
        
        // Add delay between requests to respect Steam's rate limits
        if (i < stalePrices.length - 1) {
          await delay(300); // 300ms delay between requests
        }
        
      } catch (error) {
        console.error(`Error processing app_id ${app_id}:`, error);
        errorCount++;
      }
    }
    
    console.log(`✅ Background refresh complete: ${successCount} updated, ${errorCount} errors`);
    
    // Return the results
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Background refresh completed`,
        updated_count: successCount,
        error_count: errorCount,
        processed_count: stalePrices.length,
        results: results.slice(0, 5) // Only return first 5 for brevity
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in background-price-refresh function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
