
import { useState } from 'react';
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

const DustPage = () => {
  const [activeTab, setActiveTab] = useState("breakdown");
  const { user } = useAuth();
  const { data, isLoading } = useDustScoreData();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow w-full navbar-offset py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold font-space text-unplayed-mint mb-2">
              Your Dust Report™
            </h1>
            <p className="text-lg text-gray-300">
              A totally scientific breakdown of your glorious neglect.
            </p>
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
            </>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default DustPage;
