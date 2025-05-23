
// supabase/functions/steam-auth/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FRONTEND_URL = Deno.env.get("FRONTEND_URL") || "https://unplayed.wtf";
const STEAM_API_KEY = Deno.env.get("STEAM_API_KEY")!;

const RETURN_URL = `${FRONTEND_URL}/api/auth/steam/callback`;
const REALM = FRONTEND_URL;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Steam account linking flow - NOT for authentication.
 * This function links a Steam account to an already authenticated user.
 * Users must authenticate first via Email, Discord, or Twitch before linking Steam.
 */
serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  console.log(`[Steam Auth] Request received: ${req.method} ${path}`);
  console.log(`[Steam Auth] Full URL: ${req.url}`);
  console.log(`[Steam Auth] Query params:`, Object.fromEntries(url.searchParams.entries()));
  console.log(`[Steam Auth] Headers:`, Object.fromEntries(req.headers.entries()));

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log(`[Steam Auth] Responding to OPTIONS request with CORS headers`);
    return new Response(null, { headers: corsHeaders });
  }

  // Check for required environment variables
  if (!STEAM_API_KEY) {
    console.error("[Steam Auth] STEAM_API_KEY not configured");
    return new Response(
      JSON.stringify({ error: "Steam API key not configured" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  // Verify we have a valid UID (user must be authenticated already)
  const uid = url.searchParams.get("uid");
  if (!uid) {
    console.error("[Steam Auth] Missing Supabase user ID - Steam linking requires authentication first");
    console.error("[Steam Auth] Available query params:", Object.fromEntries(url.searchParams.entries()));
    return new Response(
      JSON.stringify({ 
        error: "Authentication required", 
        message: "You must be logged in before linking your Steam account",
        debug: {
          receivedParams: Object.fromEntries(url.searchParams.entries()),
          path: path,
          method: req.method
        }
      }),
      { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  // Handle Steam login request
  if (path === "/steam-auth" || (path.includes("/steam-auth") && !path.includes("/callback"))) {
    console.log("[Steam Auth] Processing steam login request");
    const redirectTo = url.searchParams.get("redirectTo");
    const steamLoginUrl = new URL("https://steamcommunity.com/openid/login");

    steamLoginUrl.searchParams.set("openid.ns", "http://specs.openid.net/auth/2.0");
    steamLoginUrl.searchParams.set("openid.mode", "checkid_setup");
    steamLoginUrl.searchParams.set("openid.return_to", `${RETURN_URL}?uid=${uid}&redirectTo=${encodeURIComponent(redirectTo || FRONTEND_URL)}`);
    steamLoginUrl.searchParams.set("openid.realm", REALM);
    steamLoginUrl.searchParams.set("openid.identity", "http://specs.openid.net/auth/2.0/identifier_select");
    steamLoginUrl.searchParams.set("openid.claimed_id", "http://specs.openid.net/auth/2.0/identifier_select");

    console.log(`[Steam Auth] Redirecting to Steam login for user ${uid}`);
    console.log(`[Steam Auth] Steam URL: ${steamLoginUrl.toString()}`);
    return Response.redirect(steamLoginUrl.toString(), 302);
  }

  // Handle OpenID callback from Steam
  if (path.includes("/steam-auth/callback") || path.includes("/callback")) {
    try {
      console.log(`[Steam Auth] Handling callback from Steam`);
      const claimedId = url.searchParams.get("openid.claimed_id") || "";
      const match = claimedId.match(/\/(\d{17,})$/);
      const steamId = match?.[1];

      if (!steamId) {
        console.error("[Steam Auth] Missing or invalid Steam ID in callback");
        console.error("[Steam Auth] Claimed ID:", claimedId);
        console.error("[Steam Auth] All callback params:", Object.fromEntries(url.searchParams.entries()));
        return new Response(
          JSON.stringify({ 
            error: "Invalid Steam ID",
            debug: {
              claimedId: claimedId,
              allParams: Object.fromEntries(url.searchParams.entries())
            }
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const uid = url.searchParams.get("uid");
      if (!uid) {
        console.error("[Steam Auth] Missing Supabase user ID in callback");
        console.error("[Steam Auth] All callback params:", Object.fromEntries(url.searchParams.entries()));
        return new Response(
          JSON.stringify({ 
            error: "Missing user ID",
            debug: {
              allParams: Object.fromEntries(url.searchParams.entries())
            }
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Verify the user exists in Supabase
      const { data: authUser, error } = await supabase.auth.admin.getUserById(uid);
      if (error || !authUser) {
        console.error(`[Steam Auth] Supabase user not found: ${uid}`, error);
        return new Response(
          JSON.stringify({ error: "User not found", details: error?.message }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Get Steam user profile information
      const steamApiUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${steamId}`;
      console.log(`[Steam Auth] Fetching Steam profile for Steam ID: ${steamId}`);
      const steamRes = await fetch(steamApiUrl);
      const steamData = await steamRes.json();
      const player = steamData?.response?.players?.[0];

      if (!player) {
        console.error(`[Steam Auth] Steam player data not found for Steam ID: ${steamId}`);
        return new Response(
          JSON.stringify({ error: "Steam profile not found" }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Check if Steam profile is public
      if (player.communityvisibilitystate !== 3) {
        console.error(`[Steam Auth] Steam profile is not public for Steam ID: ${steamId}`);
        return new Response(
          JSON.stringify({ 
            error: "Steam profile not public", 
            message: "Your Steam profile must be set to public to link your account" 
          }),
          { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Successful Steam account linking
      console.log(`[Steam Auth] Successfully linked Steam ID ${steamId} to user ${uid}`);
      console.log(`[Steam Auth] Steam profile name: ${player.personaname}`);
      
      // Redirect to the new dedicated Steam auth callback handler with Steam data
      const redirectUrl = new URL(`${FRONTEND_URL}/auth/steam-callback`);
      redirectUrl.searchParams.set("steam_id", steamId);
      redirectUrl.searchParams.set("steam_name", encodeURIComponent(player.personaname || ""));
      redirectUrl.searchParams.set("steam_avatar", encodeURIComponent(player.avatarfull || ""));
      redirectUrl.searchParams.set("uid", uid);

      console.log(`[Steam Auth] Redirecting to: ${redirectUrl.toString()}`);
      return Response.redirect(redirectUrl.toString(), 302);
    } catch (e) {
      console.error("[Steam Auth] Error processing Steam callback:", e);
      return new Response(
        JSON.stringify({ error: "Steam account linking failed", details: e.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
  }

  console.log(`[Steam Auth] Unhandled path: ${path}`);
  return new Response(
    JSON.stringify({ 
      error: "Not Found",
      debug: {
        path: path,
        method: req.method,
        params: Object.fromEntries(url.searchParams.entries())
      }
    }),
    { 
      status: 404, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
});
