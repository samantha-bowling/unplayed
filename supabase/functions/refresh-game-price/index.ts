
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create a Supabase client
const supabaseUrl = 'https://gwmygthanyycveyqqspr.supabase.co';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Delay helper function for rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Type for the request payload
interface RefreshGamePriceRequest {
  app_ids: number | number[];
  force_refresh?: boolean;
}

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
async function fetchGamePrices(appId: number): Promise<{
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

// Function to process app IDs in batches to respect rate limits
async function processBatch(appIds: number[], forceRefresh: boolean = false) {
  const results = [];
  
  // If force refresh is not set, check which app_ids need updating
  let appIdsToProcess = appIds;
  if (!forceRefresh) {
    // Query DB for app_ids that were checked more than 24 hours ago
    const { data: existingPrices } = await supabase
      .from('game_prices')
      .select('app_id, last_checked')
      .in('app_id', appIds);
    
    // Filter out recently checked app_ids
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const stalePrices = existingPrices?.filter(price => {
      const lastChecked = new Date(price.last_checked);
      return now.getTime() - lastChecked.getTime() > oneDay;
    }) || [];
    
    // Get list of app_ids to process
    const staleAppIds = stalePrices.map(price => price.app_id);
    const newAppIds = appIds.filter(id => 
      !existingPrices?.some(price => price.app_id === id)
    );
    
    appIdsToProcess = [...staleAppIds, ...newAppIds];
  }
  
  console.log(`Processing ${appIdsToProcess.length} app_ids (out of ${appIds.length} requested)`);
  
  // Process each app ID with a delay to respect rate limits
  for (let i = 0; i < appIdsToProcess.length; i++) {
    const appId = appIdsToProcess[i];
    const priceData = await fetchGamePrices(appId);
    
    if (priceData) {
      results.push(priceData);
      
      // Upsert the data into the game_prices table
      const { error } = await supabase
        .from('game_prices')
        .upsert({
          app_id: priceData.app_id,
          currency: priceData.currency || 'USD',
          initial_price_cents: priceData.initial_price_cents,
          final_price_cents: priceData.final_price_cents,
          discount_percent: priceData.discount_percent,
          last_checked: new Date().toISOString()
        });
        
      if (error) {
        console.error(`Error upserting price data for app_id ${appId}:`, error);
      }
    }
    
    // Add delay between requests to avoid hitting rate limits
    if (i < appIdsToProcess.length - 1) {
      await delay(200); // 200ms delay between requests (5 requests per second)
    }
  }
  
  return results;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }
  
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
      );
    }
    
    // Parse request body
    const requestData: RefreshGamePriceRequest = await req.json();
    
    // Validate the request
    if (!requestData.app_ids) {
      return new Response(
        JSON.stringify({ error: 'Missing app_ids parameter' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Convert single app_id to array for uniform handling
    const appIds = Array.isArray(requestData.app_ids)
      ? requestData.app_ids
      : [requestData.app_ids];
    
    // Limit batch size to prevent timeouts
    const batchSize = 10;
    const results = [];
    
    // Process in batches if needed
    if (appIds.length > batchSize) {
      for (let i = 0; i < appIds.length; i += batchSize) {
        const batch = appIds.slice(i, i + batchSize);
        const batchResults = await processBatch(batch, requestData.force_refresh);
        results.push(...batchResults);
      }
    } else {
      const batchResults = await processBatch(appIds, requestData.force_refresh);
      results.push(...batchResults);
    }
    
    // Return the results
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${results.length} game prices`,
        updated_count: results.length,
        results: results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in refresh-game-price function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
