// supabase/functions/steam-auth/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FRONTEND_URL = Deno.env.get("FRONTEND_URL") || "https://unplayed.wtf";
const STEAM_API_KEY = Deno.env.get("STEAM_API_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  const url = new URL(req.url);

  if (url.pathname === "/api/auth/steam/callback") {
    try {
      const claimedId = url.searchParams.get("openid.claimed_id") || "";
      const match = claimedId.match(/\/(\d{17,})$/);
      const steamId = match?.[1];

      if (!steamId) {
        return new Response("Missing or invalid Steam ID", { status: 400 });
      }

      const uid = url.searchParams.get("uid");
      if (!uid) {
        return new Response("Missing Supabase user ID", { status: 400 });
      }

      const { data: authUser, error } = await supabase.auth.admin.getUserById(uid);
      if (error || !authUser) {
        return new Response("Supabase user not found", { status: 404 });
      }

      // Validate Steam ID by checking public profile visibility
      const steamApiUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${steamId}`;
      const steamRes = await fetch(steamApiUrl);
      const steamData = await steamRes.json();
      const player = steamData?.response?.players?.[0];

      if (!player || player.communityvisibilitystate !== 3) {
        return new Response("Steam profile not public or not found", { status: 403 });
      }

      const redirectUrl = new URL(`${FRONTEND_URL}/welcome`);
      redirectUrl.searchParams.set("steam_id", steamId);
      redirectUrl.searchParams.set("steam_name", encodeURIComponent(player.personaname || ""));
      redirectUrl.searchParams.set("steam_avatar", encodeURIComponent(player.avatarfull || ""));
      redirectUrl.searchParams.set("uid", uid);

      return Response.redirect(redirectUrl.toString(), 302);
    } catch (e) {
      console.error("Steam callback error:", e);
      return new Response("Steam callback processing failed", { status: 500 });
    }
  }

  return new Response("Not Found", { status: 404 });
});
