import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.5";
import * as steam from "https://deno.land/x/openid_steam@v1.0.3/mod.ts";

// Required environment variables
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STEAM_API_KEY = Deno.env.get("STEAM_API_KEY")!;
const STEAM_RETURN_URL = Deno.env.get("STEAM_RETURN_URL")!;
const FRONTEND_URL = Deno.env.get("FRONTEND_URL")!;

serve(async (req) => {
  const { pathname, searchParams } = new URL(req.url);
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // 🔹 Step 1: Initiate Steam Login
  if (pathname.endsWith("/login")) {
    const token = crypto.randomUUID();
    const redirectTo = searchParams.get("redirectTo") ?? "/";
    const steamReturnUrl = `${STEAM_RETURN_URL}?token=${token}&redirectTo=${encodeURIComponent(redirectTo)}`;
    const steamLoginUrl = steam.openid.getRedirectUrl(steamReturnUrl);

    return Response.redirect(steamLoginUrl, 302);
  }

  // 🔹 Step 2: Handle Steam Callback
  if (pathname.endsWith("/callback")) {
    try {
      const verified = await steam.openid.verifyAssertion(req, {
        apiKey: STEAM_API_KEY,
      });

      const steamId = verified.openid.claimed_id?.split("/").pop();

      if (!steamId) {
        console.error("❌ Missing or invalid Steam ID:", verified.openid);
        return new Response("Invalid Steam ID", { status: 400 });
      }

      const { error } = await supabase
        .from("users")
        .upsert({ steam_id: steamId }, { onConflict: "steam_id" });

      if (error) {
        console.error("❌ Error saving user:", error.message);
        return new Response("Could not create user", { status: 500 });
      }

      const sessionToken = crypto.randomUUID();
      const redirectTo = searchParams.get("redirectTo") ?? "/";
      const redirectUrl = `${FRONTEND_URL}${redirectTo}?steamId=${steamId}&token=${sessionToken}`;

      return Response.redirect(redirectUrl, 302);
    } catch (err) {
      console.error("❌ Steam verification failed:", err);
      return new Response("Steam verification failed", { status: 500 });
    }
  }

  return new Response("Not found", { status: 404 });
});
