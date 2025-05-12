
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.5";

const STEAM_API_KEY = Deno.env.get("STEAM_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { steamId } = await req.json();

  if (!steamId) {
    return new Response("Missing steamId", { status: 400 });
  }

  try {
    // Step 1: Fetch owned games
    const res = await fetch(
      `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_API_KEY}&steamid=${steamId}&include_appinfo=true`
    );

    const data = await res.json();
    const games = data?.response?.games;

    if (!games || games.length === 0) {
      return new Response("No games found or Steam profile is private", { status: 404 });
    }

    // Step 2: Map games to your schema
    const rows = games.map((game: any) => ({
      user_id: steamId,
      game_id: game.appid,
      playtime_minutes: game.playtime_forever,
      last_played_date: game.rtime_last_played
        ? new Date(game.rtime_last_played * 1000).toISOString()
        : null,
      acquisition_date: new Date().toISOString(),
      dust_score: 0,
      hidden: false,
      notes: null,
      updated_at: new Date().toISOString()
    }));

    // Step 3: Upsert into user_games
    const { error } = await supabase
      .from("user_games")
      .upsert(rows, { onConflict: ["user_id", "game_id"] });

    if (error) {
      console.error("Upsert error:", error);
      return new Response("Database error", { status: 500 });
    }

    return new Response(JSON.stringify({ inserted: rows.length }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("Steam fetch error:", err);
    return new Response("Failed to fetch Steam library", { status: 500 });
  }
});
