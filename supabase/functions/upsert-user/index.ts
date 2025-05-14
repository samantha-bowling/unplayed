// supabase/functions/upsert-user/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "https://unplayed.wtf",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    const { user } = await req.json();

    if (!user || !user.id) {
      return new Response(JSON.stringify({ error: "Invalid user data" }), {
        status: 400,
        headers: {
          "Access-Control-Allow-Origin": "https://unplayed.wtf",
        },
      });
    }

    const { error } = await supabase
      .from("users")
      .upsert({ id: user.id, ...user });

    if (error) {
      console.error("Upsert error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "https://unplayed.wtf",
        },
      });
    }

    return new Response(JSON.stringify({ message: "User upserted successfully" }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "https://unplayed.wtf",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Invalid request format" }), {
      status: 400,
      headers: {
        "Access-Control-Allow-Origin": "https://unplayed.wtf",
      },
    });
  }
});
