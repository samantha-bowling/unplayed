import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useIsMounted } from "@/hooks/useIsMounted";
import { useDemoMode } from "@/context/DemoModeContext";
import { useFullScreenMode } from "@/context/FullScreenModeContext";
import { useProfile } from "@/hooks/use-profile";
import { callSupabaseFunction } from '@/utils/supabase-functions';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useOptimizedCacheManagement } from '@/hooks/use-query-keys-optimized';
import { useSpendingMetrics } from '@/hooks/useSpendingMetrics';
import DataErrorBoundary from '@/components/DataErrorBoundary';

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
import ImportProgressIndicator from "@/components/ImportProgressIndicator";
import { Button } from "@/components/ui/button";
import LinkSteamAccount from "@/components/LinkSteamAccount";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RefreshCw, Import } from "lucide-react";

// Enhanced import state interface
interface ImportState {
  isImporting: boolean;
  progress: string;
  percentage: number;
  status: 'preparing' | 'processing' | 'complete' | 'error';
  totalGames?: number;
  helpText?: string;
}

const IndexOptimized = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [importState, setImportState] = useState<ImportState>({
    isImporting: false,
    progress: "Ready to import...",
    percentage: 0,
    status: 'preparing'
  });
  
  const isMounted = useIsMounted();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile, isLoading: profileLoading, refreshProfile } = useProfile();
  const { isDemo } = useDemoMode();
  const { data: dashboardData, isLoading: dataLoading, lastRefreshed, refetch } = useDashboardData();
  const { isFullScreenMode, focusedComponent } = useFullScreenMode();
  const queryClient = useQueryClient();
  const { queryKeys, utils } = useOptimizedCacheManagement();
  const { refreshMetrics: refreshSpendingMetrics } = useSpendingMetrics();

  // Memoized loading state
  const isLoading = useMemo(() => profileLoading && user, [profileLoading, user]);

  // Optimized update state function
  const updateImportState = useCallback((updates: Partial<ImportState>) => {
    setImportState(prev => ({ ...prev, ...updates }));
  }, []);

  // Optimized refresh function with targeted invalidation
  const refreshAllData = useCallback(() => {
    setTimeout(() => {
      toast.info("Refreshing your data...", {
        description: "This may take a moment to update all your stats."
      });
      
      // Use optimized cache invalidation
      if (user?.id) {
        const userDataKeys = queryKeys.helpers.allUserData(user.id);
        userDataKeys.forEach(key => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      }
      
      // Explicit refetch of dashboard data
      refetch?.();
      
      // Refresh profile and spending metrics
      refreshProfile(true);
      refreshSpendingMetrics();
      
      // Success notification
      setTimeout(() => {
        toast.success("Data refresh complete!", { 
          description: "Your dashboard has been updated with the latest information."
        });
      }, 2000);
    }, 1000);
  }, [user?.id, queryKeys, queryClient, refetch, refreshProfile, refreshSpendingMetrics]);

  // Enhanced import function with improved UX
  const importSteamLibrary = useCallback(async () => {
    if (!profile?.steam_id) {
      toast.error("Steam account not linked");
      return;
    }
    
    updateImportState({
      isImporting: true,
      progress: "Connecting to Steam API...",
      percentage: 10,
      status: 'preparing',
      helpText: "Fetching your game library from Steam..."
    });
    
    try {
      const data = await callSupabaseFunction('import-library', {
        steamId: profile.steam_id,
      });

      console.log("Import response:", data);
      
      if (data.success) {
        updateImportState({
          progress: "Library fetch complete!",
          percentage: 30,
          status: 'processing',
          totalGames: data.totalGames,
          helpText: data.helpText || "Processing and enriching your game data..."
        });

        if (data.processing === "background" || data.status === "processing") {
          // Background processing mode
          toast.success(`Found ${data.totalGames || 0} games in your library!`, {
            description: "Processing in background - your dashboard will update automatically."
          });
          
          // Simulate progress updates for background processing
          let progressCounter = 30;
          const progressInterval = setInterval(() => {
            progressCounter += 8;
            if (progressCounter >= 85) {
              clearInterval(progressInterval);
            }
            updateImportState({
              percentage: progressCounter,
              progress: `Enriching game data (${progressCounter}%)...`,
              helpText: "Prioritizing unplayed games for detailed information..."
            });
          }, 3000);
          
          // Complete after reasonable time
          setTimeout(() => {
            clearInterval(progressInterval);
            updateImportState({
              percentage: 100,
              progress: "Import complete!",
              status: 'complete',
              helpText: "Your library has been imported and unplayed games prioritized."
            });
            
            refreshAllData();
            
            setTimeout(() => {
              updateImportState({
                isImporting: false,
                progress: "Ready to import...",
                percentage: 0,
                status: 'preparing'
              });
            }, 3000);
          }, 25000);
        } else {
          // Synchronous completion
          updateImportState({
            percentage: 100,
            progress: "Import complete!",
            status: 'complete',
            helpText: `Successfully imported ${data.imported || data.gamesUpserted || 0} games.`
          });
          
          toast.success(`Successfully imported ${data.imported || data.gamesUpserted || 0} games!`);
          refreshAllData();
          
          setTimeout(() => {
            updateImportState({
              isImporting: false,
              progress: "Ready to import...",
              percentage: 0,
              status: 'preparing'
            });
          }, 2000);
        }
      } else {
        throw new Error(data.error || "Import failed");
      }
    } catch (err) {
      console.error("Import failed", err);
      
      updateImportState({
        status: 'error',
        progress: "Import failed",
        percentage: 0,
        helpText: err.helpText || "Please try again or check your Steam privacy settings."
      });
      
      toast.error(`Import failed: ${err.message}`, {
        description: err.helpText || "Please check your Steam privacy settings and try again."
      });
      
      setTimeout(() => {
        updateImportState({
          isImporting: false,
          progress: "Ready to import...",
          percentage: 0,
          status: 'preparing'
        });
      }, 5000);
    }
  }, [profile?.steam_id, updateImportState, refreshAllData]);

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

  // Memoized hero section content
  const heroContent = useMemo(() => {
    if (!user) {
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
      return <LinkSteamAccount />;
    } else if (profile?.steam_id) {
      return (
        <>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-space mb-6 text-unplayed-mint">
            Welcome, {profile.steam_name}
          </h1>
          <p className="text-xl text-gray-300 mb-6 max-w-3xl mx-auto">
            Time to face your backlog.
          </p>
          <div className="flex justify-center gap-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={importSteamLibrary}
                    className="bg-unplayed-pink text-white font-semibold hover:bg-unplayed-pink/90"
                    disabled={importState.isImporting}
                  >
                    <Import className="mr-2 h-4 w-4" />
                    {importState.isImporting ? "Importing..." : "Import Steam Library"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Fetch your games from Steam and prioritize unplayed games for enrichment</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {!importState.isImporting && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={refreshAllData}
                      variant="outline"
                      className="bg-unplayed-mint/20 text-unplayed-mint font-semibold hover:bg-unplayed-mint/30 border-unplayed-mint/30"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh Dashboard
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Update the dashboard with latest data without importing from Steam</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          
          {lastRefreshed && (
            <p className="text-sm text-gray-500 mt-2">
              Last updated: {lastRefreshed.toLocaleString()}
            </p>
          )}
          
          <ImportProgressIndicator
            isImporting={importState.isImporting}
            progress={importState.progress}
            percentage={importState.percentage}
            status={importState.status}
            totalGames={importState.totalGames}
            helpText={importState.helpText}
          />
        </>
      );
    }
    return null;
  }, [user, profile, importState, lastRefreshed, importSteamLibrary, refreshAllData]);

  return (
    <FullScreenModeWrapper>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        {/* Hero */}
        <section className="w-full navbar-offset pb-8 px-4 bg-background">
          <div className="max-w-7xl mx-auto text-center">
            {heroContent}
          </div>
        </section>

        {/* Dashboard */}
        <section id="dashboard" className="w-full py-8 px-4 bg-background">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold font-space mb-6 text-center">
              <span className="text-unplayed-mint">Dashboard</span>
              <span className="text-white">.exe</span>
            </h2>
            <DataErrorBoundary component="Dashboard">
              <div className="dashboard-grid">
                <UnplayedCounter count={dashboardData.unplayedGames} />
                <DustScoreMeter />
                <SpendingEstimate />
              </div>
              <div className="mt-4">
                <GenreHoarding />
              </div>
              <div className="mt-4">
                <ShelfLife />
              </div>
            </DataErrorBoundary>
          </div>
        </section>

        {/* Picker */}
        <section id="picker" className="w-full py-8 px-4 bg-background">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold font-space mb-6 text-center">
              <span className="text-unplayed-amber">Picker</span>
              <span className="text-white">.exe</span>
            </h2>
            <DataErrorBoundary component="Picker">
              <RandomPicker />
            </DataErrorBoundary>
          </div>
        </section>

        {/* Library */}
        <section id="library" className="w-full py-8 px-4 bg-background">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold font-space mb-6 text-center">
              <span className="text-unplayed-pink">Library</span>
              <span className="text-white">.exe</span>
            </h2>
            <DataErrorBoundary component="Library">
              <LibraryPreview />
            </DataErrorBoundary>
          </div>
        </section>

        {/* CTA */}
        {!user && (
          <section className="w-full py-10 px-4 bg-background">
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

export default IndexOptimized;
