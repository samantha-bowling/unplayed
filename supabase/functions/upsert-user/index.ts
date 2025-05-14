// supabase/functions/upsert-user/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const body = await req.json();
  const { id, steam_id, steam_name, steam_avatar, onboarding_complete } = body;

  if (!id || !steam_id || !steam_name) {
    return new Response(JSON.stringify({ error: "Missing required fields." }), {
      status: 400,
    });
  }

  const { data, error } = await supabase.from("users").upsert(
    {
      id,
      steam_id,
      steam_name,
      steam_avatar,
      onboarding_complete: onboarding_complete ?? true,
    },
    { onConflict: "id" }
  );

  if (error) {
    console.error("❌ Failed to upsert user:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ user: data[0] }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
