
import { useState, useEffect } from 'react';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Wind, Medal } from "lucide-react";
import DustScoreBreakdown from "@/components/dust/DustScoreBreakdown";
import CleanScoreBreakdown from "@/components/dust/CleanScoreBreakdown";
import TopDustContributors from "@/components/dust/TopDustContributors";
import DustScorePerGame from "@/components/dust/DustScorePerGame";
import useDustScoreData from "@/hooks/use-dust-score-data";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const DustPage = () => {
  const [activeTab, setActiveTab] = useState("breakdown");
  const { user } = useAuth();
  const { data, isLoading } = useDustScoreData();
  const navigate = useNavigate();

  // Debug logging
  useEffect(() => {
    console.log("DustPage data:", data);
    console.log("DustPage dust score:", data.dustScore);
    console.log("DustPage dust score breakdown:", data.dustScoreBreakdown);
  }, [data]);

  const refreshData = () => {
    // Show loading toast
    toast.loading("Refreshing dust data...");
    
    // Force a hard refresh of the page after a short delay
    setTimeout(() => {
      window.location.reload();
    }, 500);
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
            
            <Button 
              variant="outline" 
              onClick={refreshData} 
              className="text-unplayed-mint border-unplayed-mint/30"
            >
              <Loader2 className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
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
                <TabsList className="grid w-full max-w-md mx-auto grid-cols-4">
                  <TabsTrigger value="breakdown">Dust Breakdown</TabsTrigger>
                  <TabsTrigger value="clean">Clean Score</TabsTrigger>
                  <TabsTrigger value="contributors">Top Dust</TabsTrigger>
                  <TabsTrigger value="pergame">Per Game</TabsTrigger>
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
                  />
                </TabsContent>
                
                <TabsContent value="contributors" className="space-y-4">
                  <TopDustContributors 
                    contributors={data.topDustContributors || []}
                  />
                </TabsContent>
                
                <TabsContent value="pergame" className="space-y-4">
                  <DustScorePerGame 
                    avgDustScore={data.avgDustScore || 0}
                    totalGames={data.totalGames}
                    unplayedGames={data.unplayedGames}
                  />
                </TabsContent>
              </Tabs>
              
              <div className="mt-12 text-center text-sm text-gray-500">
                <p>Note: Dust scores are calculated based on game age, ownership time, and playtime.</p>
                <p>The algorithm is completely arbitrary but feels right.</p>
              </div>
            </>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default DustPage;
