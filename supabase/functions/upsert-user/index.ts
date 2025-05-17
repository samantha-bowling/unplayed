
// supabase/functions/upsert-user/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Add CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }
  
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method Not Allowed" }), 
      { status: 405, headers: corsHeaders }
    );
  }

  try {
    console.log("🔄 Processing upsert-user request");
    
    const body = await req.json();
    console.log("🔄 Request body:", JSON.stringify(body));
    
    const { id, steam_id, steam_name, steam_avatar, onboarding_complete } = body;

    if (!id || !steam_id || !steam_name) {
      console.error("❌ Missing required fields:", { id, steam_id, steam_name });
      return new Response(
        JSON.stringify({ error: "Missing required fields." }), 
        { status: 400, headers: corsHeaders }
      );
    }

    console.log(`🔄 Upserting user: ${id}, steam: ${steam_id}, name: ${steam_name}`);
    
    const { data, error } = await supabase.from("users").upsert(
      {
        id,
        steam_id,
        steam_name,
        steam_avatar,
        onboarding_complete: onboarding_complete ?? true,
        updated_at: new Date().toISOString(),
      },
      { 
        onConflict: "id",
        returning: "representation"
      }
    );

    if (error) {
      console.error("❌ Failed to upsert user:", error);
      return new Response(
        JSON.stringify({ error: error.message }), 
        { status: 500, headers: corsHeaders }
      );
    }

    console.log("✅ User upserted successfully:", data && data[0] ? data[0].id : "unknown");
    
    return new Response(
      JSON.stringify({ user: data ? data[0] : null, success: true }), 
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error("💥 Critical error in upsert-user:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Unknown server error" }), 
      { status: 500, headers: corsHeaders }
    );
  }
});
