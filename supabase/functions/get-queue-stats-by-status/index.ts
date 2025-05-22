
// supabase/functions/get-queue-stats-by-status/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// CORS headers for browser preflight requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
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
    console.log("Getting queue stats by status");

    // Try to use a more efficient query first
    try {
      const { data, error } = await supabase.rpc('get_queue_stats');
      
      if (!error && data) {
        console.log("Successfully fetched queue stats using RPC");
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      } else {
        console.log("RPC function not available, falling back to manual counts");
      }
    } catch (rpcError) {
      console.log("RPC error, falling back to manual counts:", rpcError);
    }

    // Get distinct statuses and their counts manually since group() is causing issues
    const statusesToQuery = ["pending", "processing", "completed", "failed", "error"];
    const statusCounts = [];

    // Query each status count individually with retries
    for (const status of statusesToQuery) {
      let retries = 3;
      let success = false;
      
      while (retries > 0 && !success) {
        try {
          const { count, error } = await supabase
            .from("steam_app_queue")
            .select("*", { count: "exact", head: true })
            .eq("status", status);
          
          if (error) {
            console.error(`Error counting ${status} items (attempt ${4-retries}/3):`, error);
            retries--;
            if (retries > 0) {
              // Add small delay before retry
              await new Promise(resolve => setTimeout(resolve, 200));
            }
            continue;
          }
          
          statusCounts.push({ status, count: count || 0 });
          success = true;
        } catch (countError) {
          console.error(`Unexpected error counting ${status} items (attempt ${4-retries}/3):`, countError);
          retries--;
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
      }
      
      // If all retries failed, add zero count
      if (!success) {
        statusCounts.push({ status, count: 0 });
      }
    }

    // Add total count if we have data
    if (statusCounts.length > 0) {
      try {
        const { count: totalCount, error: totalError } = await supabase
          .from("steam_app_queue")
          .select("*", { count: "exact", head: true });
          
        if (!totalError) {
          statusCounts.push({ status: "total", count: totalCount || 0 });
        }
      } catch (totalError) {
        console.error("Error getting total count:", totalError);
      }
    }

    return new Response(JSON.stringify(statusCounts), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Unexpected error in get-queue-stats-by-status:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
