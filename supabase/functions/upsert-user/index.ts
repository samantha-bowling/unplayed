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
    
    // Extract and validate JWT
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error("❌ Missing or invalid authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid or missing token" }), 
        { status: 401, headers: corsHeaders }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify JWT and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error("❌ Failed to authenticate user:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid token" }), 
        { status: 401, headers: corsHeaders }
      );
    }

    const authenticatedUserId = user.id;
    console.log(`✅ Authenticated user: ${authenticatedUserId}`);
    
    const body = await req.json();
    console.log("🔄 Request body:", JSON.stringify(body));
    
    const { id, steam_id, steam_name, steam_avatar, onboarding_complete } = body;

    // Validate required fields
    if (!id || !steam_id || !steam_name) {
      console.error("❌ Missing required fields:", { id, steam_id, steam_name });
      return new Response(
        JSON.stringify({ error: "Missing required fields" }), 
        { status: 400, headers: corsHeaders }
      );
    }

    // CRITICAL SECURITY CHECK: Verify ownership
    // Users can only upsert their own data unless they are an admin
    if (authenticatedUserId !== id) {
      // Check if user is admin
      const { data: isAdminResult, error: adminCheckError } = await supabase
        .rpc('is_admin', { check_user_id: authenticatedUserId });
      
      if (adminCheckError) {
        console.error('❌ Failed to check admin status:', adminCheckError);
        return new Response(
          JSON.stringify({ error: 'Failed to verify permissions' }),
          { status: 500, headers: corsHeaders }
        );
      }
      
      const isAdmin = isAdminResult === true;
      
      if (!isAdmin) {
        console.error(`❌ User ${authenticatedUserId} attempted to upsert data for ${id}`);
        
        // Log unauthorized access attempt
        await supabase.from('admin_audit_logs').insert({
          user_id: authenticatedUserId,
          action: 'unauthorized_upsert_attempt',
          target_user_id: id,
          metadata: { 
            endpoint: 'upsert-user',
            attempted_steam_id: steam_id 
          }
        });
        
        return new Response(
          JSON.stringify({ error: "Forbidden: Cannot modify other users' data" }), 
          { status: 403, headers: corsHeaders }
        );
      }
      
      console.log(`🔓 Admin ${authenticatedUserId} upserting data for ${id}`);
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
    
    // Log successful operation
    await supabase.from('admin_audit_logs').insert({
      user_id: authenticatedUserId,
      action: 'user_upsert',
      target_user_id: id,
      metadata: { 
        steam_id,
        endpoint: 'upsert-user'
      }
    });
    
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
