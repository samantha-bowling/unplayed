// supabase/functions/import-library/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { id, steam_id, games } = await req.json();

    if (!id || !steam_id || !Array.isArray(games)) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    const upserts = games
      .map((game) => {
        if (!game.appid || !game.name || typeof game.appid !== "number") {
          console.warn("Skipping invalid game:", game);
          return null;
        }
        return {
          user_id: id,
          steam_id,
          appid: game.appid,
          name: game.name,
          img_icon_url: game.img_icon_url,
          img_logo_url: game.img_logo_url,
          playtime_forever: game.playtime_forever,
          playtime_windows_forever: game.playtime_windows_forever,
          playtime_mac_forever: game.playtime_mac_forever,
          playtime_linux_forever: game.playtime_linux_forever,
          has_community_visible_stats: game.has_community_visible_stats ?? false,
        };
      })
      .filter(Boolean);

    if (upserts.length === 0) {
      return new Response(
        JSON.stringify({ success: true, warning: "No valid games to import" }),
        { status: 200 }
      );
    }

    const { error: insertError } = await supabase.from("game_library").upsert(upserts, {
      onConflict: "user_id,appid",
    });

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: insertError.message }), { status: 500 });
    }

    const { error: updateError } = await supabase
      .from("users")
      .update({ last_sync: new Date().toISOString() })
      .eq("id", id);

    if (updateError) {
      console.error("Last sync update error:", updateError);
      return new Response(JSON.stringify({ error: updateError.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, imported: upserts.length }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Unexpected error" }), { status: 500 });
  }
});
