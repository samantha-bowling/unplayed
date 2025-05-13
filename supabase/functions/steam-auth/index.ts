
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.5";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const STEAM_API_KEY = Deno.env.get("STEAM_API_KEY")!;
const STEAM_RETURN_URL = Deno.env.get("STEAM_RETURN_URL")!;
const FRONTEND_URL = Deno.env.get("FRONTEND_URL")!;

serve(async (req) => {
  const { pathname, searchParams } = new URL(req.url);

  // Step 1: Redirect to Steam login
  if (pathname.endsWith("/login")) {
    const redirectTo = searchParams.get("redirectTo") ?? "/";
    const returnUrl = `${STEAM_RETURN_URL}?redirectTo=${encodeURIComponent(redirectTo)}`;

    const steamLogin = new URL("https://steamcommunity.com/openid/login");
    steamLogin.searchParams.set("openid.ns", "http://specs.openid.net/auth/2.0");
    steamLogin.searchParams.set("openid.mode", "checkid_setup");
    steamLogin.searchParams.set("openid.return_to", returnUrl);
    steamLogin.searchParams.set("openid.realm", FRONTEND_URL);
    steamLogin.searchParams.set("openid.identity", "http://specs.openid.net/auth/2.0/identifier_select");
    steamLogin.searchParams.set("openid.claimed_id", "http://specs.openid.net/auth/2.0/identifier_select");

    return Response.redirect(steamLogin.toString(), 302);
  }

  // Step 2: Handle Steam OpenID callback
  if (pathname.endsWith("/callback")) {
    const params = new URL(req.url).searchParams;
    const body = new URLSearchParams();
    for (const [key, value] of params.entries()) {
      body.append(key, value);
    }
    body.set("openid.mode", "check_authentication");

    const verify = await fetch("https://steamcommunity.com/openid/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    const result = await verify.text();
    const claimedId = params.get("openid.claimed_id");
    const steamId = claimedId?.split("/").pop();

    if (!result.includes("is_valid:true") || !steamId) {
      return new Response("Steam OpenID verification failed", { status: 400 });
    }

    // Exchange SteamID as a pseudo ID token
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data: session, error } = await supabase.auth.signInWithIdToken({
      provider: "steam",
      token: steamId,
    });

    if (error || !session?.session) {
      console.error("Supabase signInWithIdToken failed", error);
      return new Response("Supabase sign-in failed", { status: 401 });
    }

    const redirectTo = params.get("redirectTo") ?? "/";
    const redirectUrl = `${FRONTEND_URL}${redirectTo}?access_token=${session.session.access_token}&refresh_token=${session.session.refresh_token}&steam_id=${steamId}&auth_success=true`;
    return Response.redirect(redirectUrl, 302);
  }

  return new Response("Not found", { status: 404 });
});
