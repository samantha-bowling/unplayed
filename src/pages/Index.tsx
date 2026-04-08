
import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useIsMounted } from "@/hooks/useIsMounted";
import { useDemoMode } from "@/context/DemoModeContext";
import { useFullScreenMode } from "@/context/FullScreenModeContext";
import { useProfile } from "@/hooks/use-profile";
import { useMetricsRefresh } from "@/hooks/useMetricsRefresh";
import { useUserMetrics } from "@/hooks/use-user-metrics";
import { callSupabaseFunction } from '@/utils/supabase-functions';
import { useOptimizedCacheManagement } from '@/hooks/use-query-keys';
import { formatRelativeTime, isOlderThanDays } from '@/utils/format-utils';

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
import { useQueryClient } from "@tanstack/react-query";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RefreshCw, Import, AlertCircle, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const Index = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [onboardingModalOpen, setOnboardingModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<string>("Preparing to import...");
  const [importPercentage, setImportPercentage] = useState(0);
  const [lastImportTime, setLastImportTime] = useState<Date | null>(null);
  const [lastDashboardRefreshTime, setLastDashboardRefreshTime] = useState<Date | null>(null);
  
  const isMounted = useIsMounted();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile, isLoading: profileLoading, refreshProfile } = useProfile();
  const { isDemo } = useDemoMode();
  const { data: unplayedData, isLoading: dataLoading, lastRefreshed, refetch } = useUnplayedData();
  const { isFullScreenMode, focusedComponent } = useFullScreenMode();
  const { refreshUserMetrics, isRefreshing } = useMetricsRefresh();
  const queryClient = useQueryClient();
  const { queryKeys, utils } = useOptimizedCacheManagement();

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

  // Enhanced function to update data with metrics refresh first
  const refreshAllData = async () => {
    if (isRefreshing || !user) return;

    try {
      // First refresh backend metrics
      await refreshUserMetrics();
      setLastDashboardRefreshTime(new Date());
      
      // Then refresh cache with a slight delay to ensure backend processing completes
      setTimeout(() => {
        toast.info("Refreshing your data...", {
          description: "This may take a moment to update all your stats."
        });
        
        // Use optimized cache invalidation
        const keysToInvalidate = [
          ...utils.invalidateUnplayed(user?.id),
          ...utils.invalidateProfile(user?.id),
          // Invalidate specific dashboard-related queries
          ['detailedDustData', user?.id],
          ['libraryGames', user?.id],
          ['paginatedLibraryGames', user?.id],
          ['libraryGamesCount', user?.id],
          ['pickerGames', user?.id],
          ['spendingData', user?.id]
        ];
        
        // Efficiently invalidate only necessary queries
        keysToInvalidate.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
        
        // Explicit refetch of dashboard data
        refetch?.();
        
        // Refresh profile as well
        refreshProfile(true);
        
        // Notify success after a short delay
        setTimeout(() => {
          toast.success("Data refresh complete!", { 
            description: "Your dashboard has been updated with the latest information."
          });
        }, 2000);
      }, 1000);
    } catch (error) {
      console.error('Failed to refresh data:', error);
      toast.error("Failed to refresh data", {
        description: "Please try again later."
      });
    }
  };
  
  // Function to import Steam library with progress updates
  const importSteamLibrary = async () => {
    if (!profile?.steam_id) {
      toast.error("Steam account not linked");
      return;
    }
    
    // Start import process
    setIsImporting(true);
    setImportProgress("Connecting to Steam...");
    setImportPercentage(10);
    
    toast.loading("Importing your Steam library...", {
      description: "This may take a few minutes for large libraries."
    });
    
    try {
      // Call import-library edge function directly via Supabase
      const data = await callSupabaseFunction('import-library', {
        steamId: profile.steam_id,
      });

      
      
      // If the server is processing in the background
      if (data.processing === "background") {
        // Show progress updates to user
        setImportProgress("Fetching game details...");
        setImportPercentage(30);
        
        // Poll for completion status or simulate progress
        let progressCounter = 30;
        const progressInterval = setInterval(() => {
          progressCounter += 5;
          if (progressCounter >= 90) {
            clearInterval(progressInterval);
          }
          setImportPercentage(progressCounter);
          setImportProgress(`Processing games (${progressCounter}%)...`);
        }, 2000);
        
        // Wait a reasonable amount of time, then assume processing is done
        // In a production app, you'd poll a status endpoint instead
        setTimeout(() => {
          clearInterval(progressInterval);
          setImportPercentage(100);
          setImportProgress("Import complete!");
          setLastImportTime(new Date());
          toast.success(`Steam library import completed!`, {
            description: "Your dashboard will update shortly."
          });
          
          // Update all data
          refreshAllData();
          
          // Reset state after a delay
          setTimeout(() => {
            setIsImporting(false);
          }, 1000);
        }, 20000); // Assume 20 seconds for processing
      } else {
        // Server completed processing synchronously
        setLastImportTime(new Date());
        toast.success(`Successfully imported ${data.imported || 0} games!`, {
          description: "Your dashboard will update shortly."
        });
        
        setImportPercentage(100);
        setImportProgress("Import complete!");
        
        // Update all data
        refreshAllData();
        
        // Reset state after a delay
        setTimeout(() => {
          setIsImporting(false);
        }, 1000);
      }
    } catch (err) {
      console.error("Import failed", err);
      toast.error(`Import failed: ${err.message}`);
      setIsImporting(false);
      setImportProgress("Import failed");
      setImportPercentage(0);
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
                      onClick={importSteamLibrary}
                      className="bg-unplayed-pink text-white font-semibold hover:bg-unplayed-pink/90"
                      disabled={isImporting || isRefreshing}
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
              {lastImportTime && (
                <p className="text-xs text-gray-500 mt-1">
                  Last import: {lastImportTime.toLocaleString()}
                </p>
              )}
            </div>
            
            {!isImporting && (
              <div className="flex flex-col items-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={refreshAllData}
                        variant="outline"
                        className="bg-unplayed-mint/20 text-unplayed-mint font-semibold hover:bg-unplayed-mint/30 border-unplayed-mint/30"
                        disabled={isRefreshing}
                      >
                        <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? "Refreshing..." : "Refresh Dashboard"}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Update metrics and refresh dashboard with latest data</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {lastDashboardRefreshTime && (
                  <p className="text-xs text-gray-500 mt-1">
                    Last refresh: {lastDashboardRefreshTime.toLocaleString()}
                  </p>
                )}
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
                <SteamLoader message={isImporting ? importProgress : "Import complete!"} size="sm" variant="secondary" />
              </div>
              <Progress value={importPercentage} className="h-2" />
              <p className="text-sm text-gray-400 mt-2">
                This may take a few minutes for large libraries
              </p>
              <div className="mt-4 text-sm bg-unplayed-mint/10 p-3 rounded-md flex items-start">
                <AlertCircle className="w-4 h-4 text-unplayed-mint mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-gray-300">
                  You can leave this page during the import process. Your games will still be imported in the background.
                </p>
              </div>
            </div>
          )}
        </>
      );
    }

    return null;
  };

  return (
    <FullScreenModeWrapper>
      <Helmet>
        <title>unplayed – Conquer Your Steam Backlog</title>
        <meta name="description" content="Discover how many Steam games you've never played. Track your backlog, dust scores, and spending with unplayed." />
      </Helmet>
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
              onImportLibrary={importSteamLibrary}
              steamName={profile?.steam_name}
            />
          </>
        )}
      </div>
    </FullScreenModeWrapper>
  );
};

export default Index;
