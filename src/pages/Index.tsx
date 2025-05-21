
// src/pages/Index.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useIsMounted } from "@/hooks/useIsMounted";
import { useDemoMode } from "@/context/DemoModeContext";
import { useFullScreenMode } from "@/context/FullScreenModeContext";
import { useProfile } from "@/hooks/use-profile";

import Header from "../components/Header";
import AuthModal from '@/components/AuthModal';
import DustScoreMeter from "../components/DustScoreMeter";
import UnplayedCounter from "../components/UnplayedCounter";
import GenreHoarding from "../components/GenreHoarding";
import ShelfLife from "../components/ShelfLife";
import RandomPicker from "../components/RandomPicker";
import LibraryPreview from "../components/LibraryPreview";
import SpendingEstimate from "../components/SpendingEstimate";
import Footer from "../components/Footer";
import DemoModeIndicator from '@/components/DemoModeIndicator';
import FullScreenModeWrapper from "@/components/FullScreenModeWrapper";
import SteamLoader from "@/components/SteamLoader";
import { Button } from "@/components/ui/button";
import useUnplayedData from "@/hooks/use-unplayed-data";
import LinkSteamAccount from "@/components/LinkSteamAccount";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const Index = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<string>("Preparing to import...");
  
  const isMounted = useIsMounted();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile, isLoading: profileLoading, refreshProfile } = useProfile();
  const { isDemo } = useDemoMode();
  const { data: unplayedData, isLoading: dataLoading, lastRefreshed } = useUnplayedData();
  const { isFullScreenMode, focusedComponent } = useFullScreenMode();
  const queryClient = useQueryClient();

  // Main loading state when checking auth and profile
  const isLoading = profileLoading && user;

  // Function to update all data after import
  const refreshAllData = () => {
    // Set a slight delay to ensure backend processing completes
    setTimeout(() => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['unplayedData'] });
      queryClient.invalidateQueries({ queryKey: ['detailedDustData'] });
      queryClient.invalidateQueries({ queryKey: ['gameEstimates'] });
      queryClient.invalidateQueries({ queryKey: ['libraryGames'] });
      queryClient.invalidateQueries({ queryKey: ['pickerGames'] });
      queryClient.invalidateQueries({ queryKey: ['spendingData'] });
      
      // Refresh profile as well
      refreshProfile(true);
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <SteamLoader message="Loading your profile..." size="md" variant="secondary" />
      </div>
    );
  }

  // Handle fullscreen mode
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

  // Define hero section content based on authentication state
  const renderHeroSection = () => {
    if (!user) {
      // Not authenticated user - show standard intro and sign in button
      return (
        <>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-space mb-6 text-unplayed-mint">
            Your PC games are gathering dust.
          </h1>
          <p className="text-xl text-gray-300 mb-6 max-w-3xl mx-auto">
            unplayed helps you conquer your massive Steam backlog and actually play the games you own.
          </p>
          <div className="flex justify-center gap-4 mb-4">
            <Button onClick={() => setAuthModalOpen(true)}>
              Sign In / Sign Up
            </Button>
          </div>
          <div className="max-w-3xl mx-auto">
            <DemoModeIndicator />
          </div>
        </>
      );
    } else if (user && !profile?.steam_id) {
      // Authenticated but no Steam account linked
      return (
        <LinkSteamAccount />
      );
    } else if (profile?.steam_id) {
      // Fully authenticated with Steam
      return (
        <>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-space mb-6 text-unplayed-mint">
            Welcome, {profile.steam_name}
          </h1>
          <p className="text-xl text-gray-300 mb-6 max-w-3xl mx-auto">
            Time to face your backlog.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => {
                setIsImporting(true);
                setImportProgress("Connecting to Steam...");
                toast.info("Importing your Steam library...", {
                  description: "This may take a few minutes for large libraries."
                });
                
                // Use the Netlify redirect path instead of direct Supabase function URL
                fetch("/api/import-library", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ steamId: profile.steam_id }),
                })
                  .then(response => {
                    if (!response.ok) {
                      return response.json().then(data => {
                        throw new Error(data.error || `Server error: ${response.status}`);
                      });
                    }
                    return response.json();
                  })
                  .then(data => {
                    console.log("Import response:", data);
                    toast.success(`Successfully imported ${data.imported || 0} games!`, {
                      description: "Your dashboard will update shortly."
                    });
                    // Update all data
                    refreshAllData();
                  })
                  .catch((err) => {
                    console.error("Import failed", err);
                    toast.error(`Import failed: ${err.message}`);
                  })
                  .finally(() => {
                    setIsImporting(false);
                  });
              }}
              className="bg-white text-black font-semibold py-2 px-6 rounded hover:bg-gray-200"
              disabled={isImporting}
            >
              {isImporting ? "Importing..." : "Refresh My Data"}
            </button>
            
            {lastRefreshed && (
              <p className="text-sm text-muted-foreground mt-2">
                Last updated: {new Date(lastRefreshed).toLocaleString()}
              </p>
            )}
            <button
              onClick={signOut}
              className="bg-red-600 text-white font-semibold py-2 px-6 rounded hover:bg-red-500"
            >
              Log Out
            </button>
          </div>
          
          {isImporting && (
            <div className="mt-6">
              <SteamLoader message="Importing your Steam library..." size="md" variant="secondary" />
              <p className="text-sm text-gray-400 mt-2">This may take a few minutes for large libraries</p>
            </div>
          )}
        </>
      );
    }

    return null;
  };

  return (
    <FullScreenModeWrapper>
      <div className="min-h-screen flex flex-col">
        <Header />

        {/* Hero */}
        <section className="w-full navbar-offset pb-8 px-4">
          <div className="max-w-7xl mx-auto text-center">
            {renderHeroSection()}
          </div>
        </section>

        {/* Dashboard */}
        <section id="dashboard" className="w-full py-8 px-4 bg-black/30">
          <div className="max-w-7xl mx-auto">
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
                You'll connect your Steam account after login.
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
