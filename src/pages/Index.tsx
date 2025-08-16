
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useIsMounted } from "@/hooks/useIsMounted";
import { useDemoMode } from "@/context/DemoModeContext";
import { useFullScreenMode } from "@/context/FullScreenModeContext";
import { useProfile } from "@/hooks/use-profile";
import { useRefreshCoordinator } from "@/hooks/refresh/useRefreshCoordinator";
import { useLibraryImport } from "@/hooks/refresh/useLibraryImport";

import Header from "../components/Header";
import AuthModal from '@/components/AuthModal';
import OnboardingModal from '@/components/OnboardingModal';
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
import { useUnplayedData } from "@/hooks/useUnplayedData";
import LinkSteamAccount from "@/components/LinkSteamAccount";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RefreshCw, Import } from "lucide-react";

const Index = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [onboardingModalOpen, setOnboardingModalOpen] = useState(false);
  
  const isMounted = useIsMounted();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const { isDemo } = useDemoMode();
  const { data: unplayedData, isLoading: dataLoading, lastRefreshed, refetch } = useUnplayedData();
  const { isFullScreenMode, focusedComponent } = useFullScreenMode();
  
  // Use the new refresh coordinator and library import
  const { refreshAllData } = useRefreshCoordinator();
  const { importLibrary, isImporting } = useLibraryImport();

  // Main loading state when checking auth and profile
  const isLoading = profileLoading && user;

  // Safe data access with fallbacks
  const safeData = {
    unplayedGames: unplayedData?.unplayedGames || 0,
    totalGames: unplayedData?.totalGames || 0,
    unplayedSpent: unplayedData?.unplayedSpent || 0,
    cleanScore: unplayedData?.cleanScore || 0,
    cleanTier: unplayedData?.cleanTier || null
  };

  // Check if we should show onboarding modal
  useEffect(() => {
    if (user && profile?.steam_id && !dataLoading && safeData.totalGames === 0 && !isImporting) {
      // Check if user has dismissed the onboarding modal
      try {
        const dismissed = localStorage.getItem('unplayed_onboarding_dismissed');
        if (!dismissed) {
          setOnboardingModalOpen(true);
        }
      } catch (error) {
        console.warn('Failed to check onboarding preference:', error);
        // Show modal anyway if localStorage fails
        setOnboardingModalOpen(true);
      }
    }
  }, [user, profile?.steam_id, dataLoading, safeData.totalGames, isImporting]);

  // Simple refresh wrapper that uses the coordinator
  const handleRefreshAllData = async () => {
    if (!user) return;

    try {
      toast.info("Refreshing your data...", {
        description: "This may take a moment to update all your stats."
      });
      
      await refreshAllData();
      
      // Explicit refetch of dashboard data
      refetch?.();
      
      toast.success("Data refresh complete!", { 
        description: "Your dashboard has been updated with the latest information."
      });
    } catch (error) {
      console.error('Failed to refresh data:', error);
      toast.error("Failed to refresh data", {
        description: "Please try again later."
      });
    }
  };
  
  // Simple import wrapper that uses the library import hook
  const handleImportSteamLibrary = async () => {
    if (!profile?.steam_id) {
      toast.error("Steam account not linked");
      return;
    }
    
    try {
      await importLibrary(profile.steam_id);
    } catch (err) {
      // Error handling is done in the hook
      console.error("Import failed", err);
    }
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
            <div className="flex flex-col items-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleImportSteamLibrary}
                      className="bg-unplayed-pink text-white font-semibold hover:bg-unplayed-pink/90"
                      disabled={isImporting}
                    >
                      <Import className="mr-2 h-4 w-4" />
                      {isImporting ? "Importing..." : "Import Steam Library"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Fetch your games from Steam and recalculate dust scores</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            {!isImporting && (
              <div className="flex flex-col items-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleRefreshAllData}
                        variant="outline"
                        className="bg-unplayed-mint/20 text-unplayed-mint font-semibold hover:bg-unplayed-mint/30 border-unplayed-mint/30"
                        disabled={false}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh Dashboard
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Update metrics and refresh dashboard with latest data</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>
          
          {lastRefreshed && (
            <p className="text-sm text-gray-500 mt-2">
              Data last updated: {new Date(lastRefreshed).toLocaleString()}
            </p>
          )}
          
          {isImporting && (
            <div className="mt-6 max-w-md mx-auto">
              <div className="flex items-center justify-center mb-2">
                <SteamLoader message="Importing your library..." size="sm" variant="secondary" />
              </div>
              <p className="text-sm text-gray-400 mt-2">
                This may take a few minutes for large libraries. You can leave this page during the import process.
              </p>
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
        <section id="dashboard" className="w-full py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold font-space mb-6 text-center">
              <span className="text-unplayed-mint">Dashboard</span>
              <span className="text-white">.exe</span>
            </h2>
            
            {/* Show loading state if data is loading */}
            {dataLoading ? (
              <div className="flex items-center justify-center py-12">
                <SteamLoader message="Loading your dashboard..." size="md" variant="secondary" />
              </div>
            ) : (
              <>
                <div className="dashboard-grid">
                  <UnplayedCounter count={safeData.unplayedGames} />
                  <DustScoreMeter />
                  <SpendingEstimate />
                </div>
                <div className="mt-4">
                  <GenreHoarding />
                </div>
                <div className="mt-4">
                  <ShelfLife />
                </div>
              </>
            )}
          </div>
        </section>

        {/* Picker - Moved before Library */}
        <section id="picker" className="w-full py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold font-space mb-6 text-center">
              <span className="text-unplayed-amber">Picker</span>
              <span className="text-white">.exe</span>
            </h2>
            <RandomPicker />
          </div>
        </section>

        {/* Library - Moved after Picker */}
        <section id="library" className="w-full py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold font-space mb-6 text-center">
              <span className="text-unplayed-pink">Library</span>
              <span className="text-white">.exe</span>
            </h2>
            <LibraryPreview />
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
          <>
            <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
            <OnboardingModal
              open={onboardingModalOpen}
              onClose={() => setOnboardingModalOpen(false)}
              onImportLibrary={handleImportSteamLibrary}
              steamName={profile?.steam_name}
            />
          </>
        )}
      </div>
    </FullScreenModeWrapper>
  );
};

export default Index;
