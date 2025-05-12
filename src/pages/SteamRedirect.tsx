import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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

    if (steamId && personaName && avatar) {
      // Save to session
      setUser({ steamId, personaName, avatar });

      // Optional: call your backend to upsert the user in the DB
      fetch("/api/upsert-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steamId, personaName, avatar }),
      }).catch(console.error); // You can handle failure gracefully later

      // Redirect to home after a short delay (for a loading animation or logging)
      setTimeout(() => {
        navigate("/home");
      }, 1000);
    } else {
      // Handle failure
      navigate("/auth?error=missing_steam_data");
    }
  }, [location, navigate, setUser]);

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center p-4">
      <h1 className="text-2xl font-bold mb-2">Logging you in via Steam…</h1>
      <p className="text-muted-foreground">Hang tight while we fetch your dusty games.</p>
    </div>
  );
}
