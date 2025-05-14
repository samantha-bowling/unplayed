// supabase/functions/steam-auth/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FRONTEND_URL = Deno.env.get("FRONTEND_URL") || "https://unplayed.wtf";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  const url = new URL(req.url);

  if (url.pathname === "/api/auth/steam/callback") {
    try {
      const searchParams = url.searchParams;
      const steamId = searchParams.get("steamid");
      const steamNameRaw = searchParams.get("steamname") || "";
      const steamAvatar = searchParams.get("steamavatar") || "";
      const supabaseUserId = searchParams.get("uid");

      if (!steamId || !steamNameRaw || !supabaseUserId) {
        return new Response("Missing required query params", { status: 400 });
      }

      // Validate the user exists in Supabase Auth
      const { data: authUser, error } = await supabase.auth.admin.getUserById(supabaseUserId);
      if (error || !authUser) {
        return new Response("Auth user not found", { status: 404 });
      }

      // Sanitize the Steam display name (remove problematic characters)
      const steamName = steamNameRaw.replace(/["'<>\\]/g, "").trim();

      // Redirect to /welcome with encoded params
      const redirectUrl = new URL(FRONTEND_URL + "/welcome");
      redirectUrl.searchParams.set("steam_id", steamId);
      redirectUrl.searchParams.set("steam_name", encodeURIComponent(steamName));
      if (steamAvatar) {
        redirectUrl.searchParams.set("steam_avatar", encodeURIComponent(steamAvatar));
      }

      return Response.redirect(redirectUrl.toString(), 302);
    } catch (e) {
      console.error("Steam callback error:", e);
      return new Response("Steam callback processing failed", { status: 500 });
    }
  }

  return new Response("Not Found", { status: 404 });
});
