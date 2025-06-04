
import { useState, useEffect } from 'react';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Wind, RefreshCw } from "lucide-react";
import DustScoreBreakdown from "@/components/dust/DustScoreBreakdown";
import CleanScoreBreakdown from "@/components/dust/CleanScoreBreakdown";
import TopDustContributors from "@/components/dust/TopDustContributors";
import DustScorePerGame from "@/components/dust/DustScorePerGame";
import DustTierDistribution from "@/components/dust/DustTierDistribution";
import UnplayedPacMan from "@/components/dust/UnplayedPacMan";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/use-query-keys';
import { useUserMetrics } from '@/hooks/use-user-metrics';
import { useDustBreakdowns } from '@/hooks/use-dust-breakdowns';
import { useCleanScoreBreakdowns } from '@/hooks/use-clean-score-breakdowns';
import { useMetricsRefresh } from '@/hooks/useMetricsRefresh';

const DustPage = () => {
  const [activeTab, setActiveTab] = useState("dustScore");
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { refreshUserMetrics, isRefreshing } = useMetricsRefresh();
  
  // Use Phase 2 hooks for real calculated data
  const { data: userMetrics, isLoading: metricsLoading, refetch: refetchMetrics } = useUserMetrics();
  const { data: dustBreakdowns, isLoading: breakdownsLoading, refetch: refetchBreakdowns } = useDustBreakdowns();
  const { data: cleanScoreBreakdowns, isLoading: cleanBreakdownsLoading, refetch: refetchCleanBreakdowns } = useCleanScoreBreakdowns();
  
  const isLoading = metricsLoading || breakdownsLoading || cleanBreakdownsLoading;

  // Debug logging for Phase 2 data
  useEffect(() => {
    console.log("DustPage - User Metrics:", userMetrics);
    console.log("DustPage - Dust Breakdowns:", dustBreakdowns);
    console.log("DustPage - Clean Score Breakdowns:", cleanScoreBreakdowns);
    console.log("DustPage - Clean Streak Comparison:", {
      userMetricsCleanStreak: userMetrics?.cleanStreak,
      cleanBreakdownsCleanStreak: cleanScoreBreakdowns?.cleanStreakDays,
      userMetricsRecentlyPlayed: userMetrics?.recentlyPlayedCount,
      cleanBreakdownsRecentlyPlayed: cleanScoreBreakdowns?.recentlyPlayedCount
    });
  }, [userMetrics, dustBreakdowns, cleanScoreBreakdowns]);

  const refreshData = async () => {
    try {
      // Trigger backend recalculation using the proper metrics refresh
      await refreshUserMetrics();
      
      // Then invalidate and refetch the data to get the updated values
      await queryClient.invalidateQueries({ 
        queryKey: queryKeys.userMetrics(user?.id)
      });
      await queryClient.invalidateQueries({ 
        queryKey: queryKeys.dustBreakdowns(user?.id)
      });
      await queryClient.invalidateQueries({ 
        queryKey: queryKeys.cleanScoreBreakdowns(user?.id)
      });
      
      // Explicitly refetch the data
      if (refetchMetrics) {
        await refetchMetrics();
      }
      if (refetchBreakdowns) {
        await refetchBreakdowns();
      }
      if (refetchCleanBreakdowns) {
        await refetchCleanBreakdowns();
      }
    } catch (error) {
      console.error("Error refreshing dust data:", error);
      // Error handling is already done in useMetricsRefresh hook via toast
    }
  };

  // Process data for components - use correct data sources
  const processedData = {
    dustScore: userMetrics?.totalDustScore || 0,
    dustScoreBreakdown: userMetrics ? {
      // These will be real values when we have per-game breakdowns
      qualityScore: Math.round((dustBreakdowns?.reduce((sum, game) => sum + game.ageScore, 0) || 0) / Math.max(dustBreakdowns?.length || 1, 1)),
      priceScore: Math.round((dustBreakdowns?.reduce((sum, game) => sum + game.ownershipScore, 0) || 0) / Math.max(dustBreakdowns?.length || 1, 1)),
      ageScore: Math.round((dustBreakdowns?.reduce((sum, game) => sum + game.ageScore, 0) || 0) / Math.max(dustBreakdowns?.length || 1, 1)),
      genreScore: 7, // Default until we have genre scores in breakdowns
      playtimeFactor: Number(((dustBreakdowns?.reduce((sum, game) => sum + game.playtimeFactor, 0) || 0) / Math.max(dustBreakdowns?.length || 1, 1)).toFixed(2))
    } : undefined,
    topDustContributors: dustBreakdowns?.slice(0, 10).map(game => ({
      id: game.gameId,
      name: game.gameName,
      dustScore: game.dustScore,
      addedDate: '', // Will need to add this to breakdown table
      releaseDate: game.releaseDate,
      playtimeMinutes: game.playtimeMinutes,
      image: game.imageUrl,
      breakdown: {
        qualityScore: game.ageScore, // Mapping until we have real quality scores
        priceScore: game.ownershipScore, // Mapping until we have real price scores
        ageScore: game.ageScore,
        genreScore: 7, // Default
        playtimeFactor: game.playtimeFactor
      }
    })) || [],
    averageDustScore: userMetrics?.averageDustScore || 0,
    totalGames: userMetrics?.totalGames || 0,
    unplayedGames: userMetrics?.unplayedGames || 0,
    cleanScore: userMetrics?.cleanScore || 0,
    cleanScoreBreakdown: cleanScoreBreakdowns ? {
      diversityScore: cleanScoreBreakdowns.diversityScore,
      recencyScore: cleanScoreBreakdowns.recencyScore,
      backlogConversionScore: cleanScoreBreakdowns.backlogConversionScore,
      sessionDepthScore: cleanScoreBreakdowns.sessionDepthScore
    } : undefined,
    // Fix: Use correct data sources for clean streak and recently played
    cleanStreak: cleanScoreBreakdowns?.cleanStreakDays || 0,
    recentlyPlayedCount: cleanScoreBreakdowns?.recentlyPlayedCount || 0,
    cleanStreakMetadata: undefined // Will need real data
  };

  // Format the last updated date
  const formatLastUpdated = (dateString: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow w-full navbar-offset py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold font-space text-unplayed-mint mb-2">
                Your Dust Report™
              </h1>
              <p className="text-lg text-gray-300">
                A totally scientific breakdown of your glorious neglect.
              </p>
              {userMetrics?.lastCalculated && (
                <p className="text-sm text-gray-400 mt-1">
                  Last updated: {formatLastUpdated(userMetrics.lastCalculated)}
                </p>
              )}
            </div>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    onClick={refreshData} 
                    disabled={isRefreshing}
                    className="text-unplayed-mint border-unplayed-mint/30 bg-unplayed-mint/10 hover:bg-unplayed-mint/20"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    {isRefreshing ? "Recalculating..." : "Refresh Data"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Recalculate dust scores and metrics from your latest library data</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 text-unplayed-mint animate-spin" />
              <span className="ml-2 text-lg text-gray-300">Computing dust particles...</span>
            </div>
          ) : !user ? (
            <div className="terminal-container p-8 text-center">
              <Wind className="w-16 h-16 mx-auto text-unplayed-mint mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Connect Your Account</h2>
              <p className="text-gray-400 mb-6">
                Sign in with Steam to see your personalized dust report.
              </p>
              <Button onClick={() => navigate("/")}>
                Return to Home
              </Button>
            </div>
          ) : (
            <>
              <Tabs 
                defaultValue="dustScore" 
                value={activeTab} 
                onValueChange={setActiveTab}
                className="space-y-6"
              >
                <TabsList className="grid w-full max-w-md mx-auto grid-cols-4 bg-black/40 border border-unplayed-mint/20">
                  <TabsTrigger 
                    value="dustScore"
                    className="data-[state=active]:bg-unplayed-mint data-[state=active]:text-black"
                  >
                    Dust Score
                  </TabsTrigger>
                  <TabsTrigger 
                    value="clean"
                    className="data-[state=active]:bg-unplayed-mint data-[state=active]:text-black"
                  >
                    Clean Score
                  </TabsTrigger>
                  <TabsTrigger 
                    value="contributors"
                    className="data-[state=active]:bg-unplayed-mint data-[state=active]:text-black"
                  >
                    Top Dust
                  </TabsTrigger>
                  <TabsTrigger 
                    value="analysis"
                    className="data-[state=active]:bg-unplayed-mint data-[state=active]:text-black"
                  >
                    Analysis
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="dustScore" className="space-y-4">
                  <DustScoreBreakdown 
                    totalScore={processedData.dustScore}
                    breakdown={processedData.dustScoreBreakdown}
                  />
                </TabsContent>
                
                <TabsContent value="clean" className="space-y-4">
                  <CleanScoreBreakdown
                    cleanScore={processedData.cleanScore}
                    breakdown={processedData.cleanScoreBreakdown}
                    cleanStreak={processedData.cleanStreak}
                    recentlyPlayedCount={processedData.recentlyPlayedCount}
                    cleanStreakMetadata={processedData.cleanStreakMetadata}
                  />
                </TabsContent>
                
                <TabsContent value="contributors" className="space-y-4">
                  <TopDustContributors 
                    contributors={processedData.topDustContributors}
                  />
                </TabsContent>
                
                <TabsContent value="analysis" className="space-y-4">
                  {/* Single column layout for Analysis */}
                  <DustScorePerGame 
                    avgDustScore={processedData.averageDustScore}
                    totalGames={processedData.totalGames}
                    unplayedGames={processedData.unplayedGames}
                  />
                  
                  {/* Two column layout below for Distribution and Pac-Man */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <DustTierDistribution />
                    <UnplayedPacMan />
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default DustPage;
