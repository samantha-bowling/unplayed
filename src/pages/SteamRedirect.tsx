
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSteamSession } from "@/hooks/useSteamSession";

export default function SteamRedirect() {
  const { setUser } = useSteamSession();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const steamId = params.get("steamId");
    const personaName = params.get("personaName");
    const avatar = params.get("avatar");
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    const establishSession = async () => {
      if (accessToken && refreshToken) {
        console.log("Setting Supabase session from SteamRedirect...");
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error("Error establishing Supabase session:", error.message);
          navigate("/auth?error=session_setup_failed");
          return;
        }

        if (data?.session) {
          localStorage.setItem("supabase.access_token", accessToken);
          localStorage.setItem("supabase.refresh_token", refreshToken);
          console.log("Supabase session established");

          if (steamId && personaName && avatar) {
            setUser({ steamId, personaName, avatar });

            await fetch("/api/upsert-user", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ steamId, personaName, avatar }),
            }).catch(console.error);
          }

          navigate("/"); // or /home depending on app design
        } else {
          console.error("No session returned from setSession");
          navigate("/auth?error=no_session");
        }
      } else {
        console.error("Missing tokens or Steam info in redirect");
        navigate("/auth?error=missing_tokens");
      }
    };

    establishSession();
  }, [location, navigate, setUser]);

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center p-4">
      <h1 className="text-2xl font-bold mb-2">Logging you in via Steam…</h1>
      <p className="text-muted-foreground">Hang tight while we fetch your dusty games.</p>
    </div>
  );
}
