
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

serve(async (req) => {
  try {
    const { steamId, personaName, avatar, userId } = await req.json();

    // Debug logging
    console.log("Function received payload:", {
      steamId,
      personaName,
      avatar,
      userId,
    });
    
    if (!steamId || !personaName || !avatar || !userId) {
      console.error("Missing required fields", { steamId, personaName, avatar, userId });
      return new Response("Missing fields", { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error } = await supabase.from("users").upsert({
      id: userId,
      steam_id: steamId,
      steam_name: personaName,
      steam_avatar: avatar,
      last_sync: new Date().toISOString(),
    });

    if (error) {
      console.error("Upsert failed with error:", error);
      return new Response(JSON.stringify({ error }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("User successfully upserted:", userId);
    return new Response(JSON.stringify({ status: "success", userId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error in upsert-user:", err);
    return new Response("Server error", { status: 500 });
  }
});
