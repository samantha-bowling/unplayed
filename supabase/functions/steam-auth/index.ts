
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.5";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STEAM_API_KEY = Deno.env.get("STEAM_API_KEY")!;
const STEAM_RETURN_URL = Deno.env.get("STEAM_RETURN_URL")!;
const FRONTEND_URL = Deno.env.get("FRONTEND_URL")!;

serve(async (req) => {
  const { pathname, searchParams } = new URL(req.url);
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Step 1: Generate redirect to Steam login
  if (pathname.endsWith("/login")) {
    const token = crypto.randomUUID();
    const redirectTo = searchParams.get("redirectTo") ?? "/";
    const returnTo = `${STEAM_RETURN_URL}?token=${token}&redirectTo=${encodeURIComponent(redirectTo)}`;

    const steamLoginUrl = new URL("https://steamcommunity.com/openid/login");
    steamLoginUrl.searchParams.set("openid.ns", "http://specs.openid.net/auth/2.0");
    steamLoginUrl.searchParams.set("openid.mode", "checkid_setup");
    steamLoginUrl.searchParams.set("openid.return_to", returnTo);
    steamLoginUrl.searchParams.set("openid.realm", FRONTEND_URL);
    steamLoginUrl.searchParams.set("openid.identity", "http://specs.openid.net/auth/2.0/identifier_select");
    steamLoginUrl.searchParams.set("openid.claimed_id", "http://specs.openid.net/auth/2.0/identifier_select");

    return Response.redirect(steamLoginUrl.toString(), 302);
  }

  // Step 2: Handle Steam OpenID callback
  if (pathname.endsWith("/callback")) {
    const params = new URLSearchParams(await req.text());
    params.set("openid.mode", "check_authentication");

    const response = await fetch("https://steamcommunity.com/openid/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const body = await response.text();

    const claimedId = new URLSearchParams(req.url.split("?")[1]).get("openid.claimed_id");
    const steamId = claimedId?.split("/").pop();

    if (!body.includes("is_valid:true") || !steamId) {
      console.error("❌ OpenID validation failed or Steam ID missing.");
      return new Response("Invalid Steam login", { status: 400 });
    }

    await supabase.from("users").upsert({ steam_id: steamId }, { onConflict: "steam_id" });

    const redirectTo = searchParams.get("redirectTo") ?? "/";
    const redirectUrl = `${FRONTEND_URL}${redirectTo}?steamId=${steamId}`;

    return Response.redirect(redirectUrl, 302);
  }

  return new Response("Not found", { status: 404 });
});
