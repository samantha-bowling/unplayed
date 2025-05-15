
import { AuthModal } from '@/components/AuthModal';
import { useIsMounted } from '@/hooks/useIsMounted';
import Header from "../components/Header";
import DustScoreMeter from "../components/DustScoreMeter";
import UnplayedCounter from "../components/UnplayedCounter";
import GenreHoarding from "../components/GenreHoarding";
import ShelfLife from "../components/ShelfLife";
import RandomPicker from "../components/RandomPicker";
import LibraryPreview from "../components/LibraryPreview";
import SpendingEstimate from "../components/SpendingEstimate";
import Footer from "../components/Footer";
import FullScreenModeWrapper from "@/components/FullScreenModeWrapper";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useSteamSession } from "@/hooks/useSteamSession";
import { useFullScreenMode } from "@/context/FullScreenModeContext";
import { useDemoMode } from "@/context/DemoModeContext";
import { useEffect, useState } from "react";
import useUnplayedData from "@/hooks/use-unplayed-data";
import SteamLoginButton from "@/components/SteamLoginButton";
import { Loader2 } from "lucide-react";
import SteamLoader from "@/components/SteamLoader";

const Index = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const isMounted = useIsMounted();
  const { user, isAuthBootComplete } = useAuth();
  const { user: steamUser, logout: steamLogout } = useSteamSession();
  const [isNewSteamUser, setIsNewSteamUser] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    const justLoggedIn = sessionStorage.getItem("justLoggedIn");
    if (steamUser && justLoggedIn) {
      setIsNewSteamUser(true);
      sessionStorage.removeItem("justLoggedIn");
    }
  }, [steamUser]);

  const { isDemo } = useDemoMode();
  const { data: unplayedData, isLoading: dataLoading, lastRefreshed } = useUnplayedData();
  const { isFullScreenMode, focusedComponent } = useFullScreenMode();

  if (!isAuthBootComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <SteamLoader message="Loading your profile..." size="md" variant="ghost" />
      </div>
    );
  }

  if (isFullScreenMode && focusedComponent) {
    return (
      <FullScreenModeWrapper>
        <div className="min-h-screen flex items-center justify-center">
          {focusedComponent === "library" && <LibraryPreview zenModeFullScreen />}
          {focusedComponent === "picker" && <RandomPicker fullScreen />}
        </div>
      </FullScreenModeWrapper>
    );
  }

  return (
    <FullScreenModeWrapper>
      <div className="min-h-screen flex flex-col">
        <Header />

        {/* Hero */}
        <section className="w-full navbar-offset pb-8 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-space mb-6 text-unplayed-mint">
              {steamUser ? `Welcome, ${steamUser.personaName}` : "Your PC games are gathering dust."}
            </h1>
            {steamUser ? (
              <p className="text-xl text-gray-300 mb-6 max-w-3xl mx-auto">
                {isNewSteamUser
                  ? "🎉 You made it! It'll take a few minutes to import that massive library of yours. Sit back, relax, and let’s take this ride of shame together."
                  : "Welcome back! Time to face the backlog."}
              </p>
            ) : (
              <p className="text-xl text-gray-300 mb-6 max-w-3xl mx-auto">
                unplayed helps you conquer your massive Steam backlog and actually play the games you own.
              </p>
            )}
            <div className="flex justify-center gap-4">
             {!user && (
                <Button onClick={() => setAuthModalOpen(true)}>
                  Sign In / Sign Up
                </Button>
              )}
              {steamUser && (
                <>
                  <button
                    onClick={() => {
                      setIsImporting(true);
                    
                      fetch("https://gwmygthanyycveyqqspr.functions.supabase.co/import-library", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ steamId: steamUser.steamId }),
                      })
                        .then(() => window.location.reload())
                        .catch((err) => {
                          console.error("Import failed", err);
                          setIsImporting(false);
                        });
                    }}
                    className="bg-white text-black font-semibold py-2 px-6 rounded hover:bg-gray-200"
                  >
                    {isNewSteamUser ? "Import My Steam Library" : "Refresh My Data"}
                  </button>
                  
                  {isImporting && (
                    <div className="mt-6">
                      <SteamLoader message="Importing your Steam shame..." size="md" variant="secondary" />
                    </div>
                  )}

                  {lastRefreshed && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Last updated: {lastRefreshed.toLocaleString()}
                    </p>
                  )}
                  <button
                    onClick={steamLogout}
                    className="bg-red-600 text-white font-semibold py-2 px-6 rounded hover:bg-red-500"
                  >
                    Log Out
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Dashboard */}
        <section id="dashboard" className="w-full py-8 px-4 bg-black/30">
          <div className="max-w-7xl mx-auto">
            {isDemo && (
              <div className="mb-6 glass-panel p-4 border-unplayed-amber/30 border rounded-lg">
                <h3 className="text-lg font-medium text-unplayed-amber mb-2">🔍 Demo Mode Active</h3>
                <p className="text-sm text-gray-300 mb-4">
                  You're viewing example data. Connect sign in or sign up and link your Steam account to see your personal gaming data.
                </p>
              </div>
            )}
            <h2 className="text-3xl font-bold font-space mb-6 text-center">
              <span className="text-unplayed-mint">Dashboard</span>
              <span className="text-white">.exe</span>
            </h2>
            <div className="dashboard-grid">
              <UnplayedCounter count={unplayedData.unplayedGames} />
              <DustScoreMeter score={unplayedData.dustScore} />
              <SpendingEstimate amount={unplayedData.totalSpent} />
            </div>
            <div className="mt-4">
              <GenreHoarding />
            </div>
            <div className="mt-4">
              <ShelfLife />
            </div>
          </div>
        </section>

        {/* Library */}
        <section id="library" className="w-full py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold font-space mb-6 text-center">
              <span className="text-unplayed-pink">Library</span>
              <span className="text-white">.exe</span>
            </h2>
            <LibraryPreview />
          </div>
        </section>

        {/* Picker */}
        <section id="picker" className="w-full py-8 px-4 bg-black/30">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold font-space mb-6 text-center">
              <span className="text-unplayed-amber">Picker</span>
              <span className="text-white">.exe</span>
            </h2>
            <RandomPicker />
          </div>
        </section>

        {/* CTA */}
        {!user && (
          <section className="w-full py-10 px-4">
            <div className="max-w-7xl mx-auto text-center">
              <h2 className="text-3xl font-bold font-space mb-4 text-white">
                Ready to confront your backlog?
              </h2>
              <p className="text-xl text-gray-300 mb-6 max-w-3xl mx-auto">
                Log in to explore your unplayed library and start tracking your Steam games.
              </p>
              <div className="flex justify-center">
                <Button onClick={() => setAuthModalOpen(true)}>
                  Sign In / Sign Up
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-4 mb-2">
                You’ll connect your Steam account after login.
              </p>
            </div>
          </section>
        )}

        <Footer />
        {isMounted && (
          <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
        )}
      </div>
    </FullScreenModeWrapper>
  );
};

export default Index;
