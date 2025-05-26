
import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useIsMounted } from "@/hooks/useIsMounted";
import { useDemoMode } from "@/context/DemoModeContext";
import { useFullScreenMode } from "@/context/FullScreenModeContext";
import { useProfile } from "@/hooks/use-profile";
import { callSupabaseFunction } from '@/utils/supabase-functions';
import { useUnplayedDataOptimized } from '@/hooks/use-unplayed-data-optimized';
import { useOptimizedCacheManagement } from '@/hooks/use-query-keys-optimized';

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
import LinkSteamAccount from "@/components/LinkSteamAccount";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RefreshCw, Import, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

// Consolidated import state interface
interface ImportState {
  isImporting: boolean;
  progress: string;
  percentage: number;
}

const IndexOptimized = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [importState, setImportState] = useState<ImportState>({
    isImporting: false,
    progress: "Preparing to import...",
    percentage: 0
  });
  
  const isMounted = useIsMounted();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile, isLoading: profileLoading, refreshProfile } = useProfile();
  const { isDemo } = useDemoMode();
  const { data: unplayedData, isLoading: dataLoading, lastRefreshed, refetch } = useUnplayedDataOptimized();
  const { isFullScreenMode, focusedComponent } = useFullScreenMode();
  const queryClient = useQueryClient();
  const { queryKeys, utils } = useOptimizedCacheManagement();

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
      
      // Explicit refetch of unplayed data
      refetch?.();
      
      // Refresh profile
      refreshProfile(true);
      
      // Success notification
      setTimeout(() => {
        toast.success("Data refresh complete!", { 
          description: "Your dashboard has been updated with the latest information."
        });
      }, 2000);
    }, 1000);
  }, [user?.id, queryKeys, queryClient, refetch, refreshProfile]);
  
  // Optimized import function
  const importSteamLibrary = useCallback(async () => {
    if (!profile?.steam_id) {
      toast.error("Steam account not linked");
      return;
    }
    
    updateImportState({
      isImporting: true,
      progress: "Connecting to Steam...",
      percentage: 10
    });
    
    toast.loading("Importing your Steam library...", {
      description: "This may take a few minutes for large libraries."
    });
    
    try {
      const data = await callSupabaseFunction('import-library', {
        steamId: profile.steam_id,
      });

      console.log("Import response:", data);
      
      if (data.processing === "background") {
        updateImportState({
          progress: "Fetching game details...",
          percentage: 30
        });
        
        let progressCounter = 30;
        const progressInterval = setInterval(() => {
          progressCounter += 5;
          if (progressCounter >= 90) {
            clearInterval(progressInterval);
          }
          updateImportState({
            percentage: progressCounter,
            progress: `Processing games (${progressCounter}%)...`
          });
        }, 2000);
        
        setTimeout(() => {
          clearInterval(progressInterval);
          updateImportState({
            percentage: 100,
            progress: "Import complete!"
          });
          
          toast.success(`Steam library import completed!`, {
            description: "Your dashboard will update shortly."
          });
          
          refreshAllData();
          
          setTimeout(() => {
            updateImportState({
              isImporting: false,
              progress: "Preparing to import...",
              percentage: 0
            });
          }, 1000);
        }, 20000);
      } else {
        toast.success(`Successfully imported ${data.imported || 0} games!`, {
          description: "Your dashboard will update shortly."
        });
        
        updateImportState({
          percentage: 100,
          progress: "Import complete!"
        });
        
        refreshAllData();
        
        setTimeout(() => {
          updateImportState({
            isImporting: false,
            progress: "Preparing to import...",
            percentage: 0
          });
        }, 1000);
      }
    } catch (err) {
      console.error("Import failed", err);
      toast.error(`Import failed: ${err.message}`);
      updateImportState({
        isImporting: false,
        progress: "Import failed",
        percentage: 0
      });
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
                  <p>Fetch your games from Steam and recalculate dust scores</p>
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
          
          {importState.isImporting && (
            <div className="mt-6 max-w-md mx-auto">
              <div className="flex items-center justify-center mb-2">
                <SteamLoader 
                  message={importState.progress} 
                  size="sm" 
                  variant="secondary" 
                />
              </div>
              <Progress value={importState.percentage} className="h-2" />
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
  }, [user, profile, importState, lastRefreshed, importSteamLibrary, refreshAllData]);

  return (
    <FullScreenModeWrapper>
      <div className="min-h-screen flex flex-col">
        <Header />

        {/* Hero */}
        <section className="w-full navbar-offset pb-8 px-4">
          <div className="max-w-7xl mx-auto text-center">
            {heroContent}
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

        {/* Picker */}
        <section id="picker" className="w-full py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold font-space mb-6 text-center">
              <span className="text-unplayed-amber">Picker</span>
              <span className="text-white">.exe</span>
            </h2>
            <RandomPicker />
          </div>
        </section>

        {/* Library */}
        <section id="library" className="w-full py-8 px-4 bg-black/30">
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
          <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
        )}
      </div>
    </FullScreenModeWrapper>
  );
};

export default IndexOptimized;
