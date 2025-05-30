
import { useState, useEffect } from 'react';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Wind, Medal, RefreshCw } from "lucide-react";
import DustScoreBreakdown from "@/components/dust/DustScoreBreakdown";
import CleanScoreBreakdown from "@/components/dust/CleanScoreBreakdown";
import TopDustContributors from "@/components/dust/TopDustContributors";
import DustScorePerGame from "@/components/dust/DustScorePerGame";
import useDustScoreData from "@/hooks/use-dust-score-data";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/use-query-keys';

const DustPage = () => {
  const [activeTab, setActiveTab] = useState("breakdown");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user } = useAuth();
  const { data, isLoading, refetch } = useDustScoreData();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Debug logging
  useEffect(() => {
    console.log("DustPage data:", data);
    console.log("DustPage dust score:", data.dustScore);
    console.log("DustPage dust score breakdown:", data.dustScoreBreakdown);
  }, [data]);

  const refreshData = async () => {
    // Show refreshing state
    setIsRefreshing(true);
    toast.loading("Refreshing dust data...");
    
    try {
      // Perform targeted cache invalidation for dust-related queries
      await queryClient.invalidateQueries({ 
        queryKey: queryKeys.detailedDustData(user?.id)
      });
      
      // Explicitly refetch the dust score data if available
      if (refetch) {
        await refetch();
        console.log("Dust data refetched successfully");
      } else {
        console.warn("Refetch function not available in useDustScoreData hook");
      }
      
      // Show success message
      toast.success("Dust data refreshed successfully");
    } catch (error) {
      console.error("Error refreshing dust data:", error);
      toast.error("Failed to refresh dust data");
    } finally {
      setIsRefreshing(false);
    }
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
                    {isRefreshing ? "Refreshing..." : "Refresh Data"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Update the dust report with latest data</p>
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
                defaultValue="breakdown" 
                value={activeTab} 
                onValueChange={setActiveTab}
                className="space-y-6"
              >
                <TabsList className="grid w-full max-w-md mx-auto grid-cols-4 bg-black/40 border border-unplayed-mint/20">
                  <TabsTrigger 
                    value="breakdown"
                    className="data-[state=active]:bg-unplayed-mint data-[state=active]:text-black"
                  >
                    Breakdown
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
                
                <TabsContent value="breakdown" className="space-y-4">
                  <DustScoreBreakdown 
                    totalScore={data.dustScore}
                    breakdown={data.dustScoreBreakdown}
                  />
                </TabsContent>
                
                <TabsContent value="clean" className="space-y-4">
                  <CleanScoreBreakdown
                    cleanScore={data.cleanScore || 0}
                    breakdown={data.cleanScoreBreakdown}
                    cleanStreak={data.cleanStreak}
                    recentlyPlayedCount={data.recentlyPlayedCount}
                    recentlyPlayedUnplayed={data.recentlyPlayedUnplayed}
                    cleanStreakMetadata={data.cleanStreakMetadata}
                  />
                </TabsContent>
                
                <TabsContent value="contributors" className="space-y-4">
                  <TopDustContributors 
                    contributors={data.topDustContributors || []}
                  />
                </TabsContent>
                
                <TabsContent value="analysis" className="space-y-4">
                  <DustScorePerGame 
                    avgDustScore={data.avgDustScore || 0}
                    totalGames={data.totalGames}
                    unplayedGames={data.unplayedGames}
                  />
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
