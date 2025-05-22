
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

    // Get distinct statuses and their counts manually since group() is causing issues
    const statusesToQuery = ["pending", "processing", "completed", "failed", "error"];
    const statusCounts = [];

    // Query each status count individually
    for (const status of statusesToQuery) {
      const { count, error } = await supabase
        .from("steam_app_queue")
        .select("*", { count: "exact", head: true })
        .eq("status", status);
      
      if (error) {
        console.error(`Error counting ${status} items:`, error);
        continue;
      }
      
      statusCounts.push({ status, count: count || 0 });
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
