import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useIsMounted } from "@/hooks/useIsMounted";
import { useDemoMode } from "@/context/DemoModeContext";
import { useFullScreenMode } from "@/context/FullScreenModeContext";
import { useProfile } from "@/hooks/use-profile";
import { useRefreshManager } from "@/hooks/useRefreshManager";
import { useDashboardData } from '@/hooks/useDashboardData';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RefreshCw, Import, DollarSign } from "lucide-react";

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
  const { profile, isLoading: profileLoading } = useProfile();
  const { isDemo } = useDemoMode();
  const { data: dashboardData, isLoading: dataLoading } = useDashboardData();
  const { isFullScreenMode, focusedComponent } = useFullScreenMode();
  
  // Use the new refresh manager
  const {
    importLibrary,
    refreshDashboard,
    refreshPrices,
    refreshStates,
    timestamps,
    canPerformOperation,
    getRemainingCooldown
  } = useRefreshManager();

  // Memoized loading state
  const isLoading = useMemo(() => profileLoading && user, [profileLoading, user]);

  // Optimized update state function
  const updateImportState = useCallback((updates: Partial<ImportState>) => {
    setImportState(prev => ({ ...prev, ...updates }));
  }, []);

  // Enhanced import function using the new refresh manager
  const handleImportSteamLibrary = useCallback(async () => {
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
      const data = await importLibrary(profile.steam_id);

      if (data?.success) {
        updateImportState({
          progress: "Library import complete!",
          percentage: 30,
          status: 'processing',
          totalGames: data.totalGames,
          helpText: data.helpText || "Processing and enriching your game data..."
        });

        if (data.processing === "background" || data.status === "processing") {
          // Background processing mode
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
          
          setTimeout(() => {
            updateImportState({
              isImporting: false,
              progress: "Ready to import...",
              percentage: 0,
              status: 'preparing'
            });
          }, 2000);
        }
      }
    } catch (err) {
      console.error("Import failed", err);
      
      updateImportState({
        status: 'error',
        progress: "Import failed",
        percentage: 0,
        helpText: err.helpText || "Please try again or check your Steam privacy settings."
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
  }, [profile?.steam_id, updateImportState, importLibrary]);

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

  // Helper function to format timestamps
  const formatTimestamp = (timestamp?: Date) => {
    if (!timestamp) return null;
    return timestamp.toLocaleString();
  };

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
          <div className="flex flex-wrap justify-center gap-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleImportSteamLibrary}
                    className="bg-unplayed-pink text-white font-semibold hover:bg-unplayed-pink/90"
                    disabled={importState.isImporting || !canPerformOperation('import')}
                  >
                    <Import className="mr-2 h-4 w-4" />
                    {importState.isImporting ? "Importing..." : "Import Library"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Import new games from Steam (smart detection)</p>
                  {!canPerformOperation('import') && (
                    <p className="text-yellow-300">Cooldown: {getRemainingCooldown('import')}s</p>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={refreshDashboard}
                    variant="outline"
                    className="bg-unplayed-mint/20 text-unplayed-mint font-semibold hover:bg-unplayed-mint/30 border-unplayed-mint/30"
                    disabled={refreshStates.isRefreshingDashboard || !canPerformOperation('dashboard')}
                  >
                    <RefreshCw className={`mr-2 h-4 w-4 ${refreshStates.isRefreshingDashboard ? 'animate-spin' : ''}`} />
                    {refreshStates.isRefreshingDashboard ? "Refreshing..." : "Refresh Dashboard"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Recalculate your gaming metrics</p>
                  {!canPerformOperation('dashboard') && (
                    <p className="text-yellow-300">Cooldown: {getRemainingCooldown('dashboard')}s</p>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={refreshPrices}
                    variant="outline"
                    className="bg-green-500/20 text-green-400 font-semibold hover:bg-green-500/30 border-green-500/30"
                    disabled={refreshStates.isRefreshingPrices || !canPerformOperation('prices')}
                  >
                    <DollarSign className={`mr-2 h-4 w-4 ${refreshStates.isRefreshingPrices ? 'animate-spin' : ''}`} />
                    {refreshStates.isRefreshingPrices ? "Updating..." : "Refresh Prices"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Update game prices from Steam store</p>
                  {!canPerformOperation('prices') && (
                    <p className="text-yellow-300">Cooldown: {getRemainingCooldown('prices')}s</p>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {/* Updated timestamps - show each independently */}
          <div className="mt-4 text-xs text-gray-500 space-y-1">
            {timestamps.lastImport && (
              <p>Last import: {formatTimestamp(timestamps.lastImport)}</p>
            )}
            {timestamps.lastDashboardRefresh && (
              <p>Last dashboard refresh: {formatTimestamp(timestamps.lastDashboardRefresh)}</p>
            )}
            {timestamps.lastPriceRefresh && (
              <p>Last price refresh: {formatTimestamp(timestamps.lastPriceRefresh)}</p>
            )}
          </div>
          
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
  }, [user, profile, importState, timestamps, handleImportSteamLibrary, refreshDashboard, refreshPrices, refreshStates, canPerformOperation, getRemainingCooldown]);

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
