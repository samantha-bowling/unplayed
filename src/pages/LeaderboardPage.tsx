
import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";

const LeaderboardPage = () => {
  const [activeTab, setActiveTab] = useState<"dust" | "clean">("dust");
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Hero section - Using our header spacing utility class */}
      <section className="navbar-offset flex-grow px-4 py-12 text-center relative overflow-hidden">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-unplayed-mint">
          Leaderboard
        </h1>
        
        <p className="text-lg md:text-xl max-w-2xl mx-auto mb-8 text-gray-300">
          See how your backlog compares to other unplayed.wtf users.
        </p>

        <div className="max-w-4xl mx-auto">
          <Tabs 
            defaultValue="dust" 
            className="w-full"
            onValueChange={(value) => setActiveTab(value as "dust" | "clean")}
          >
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
              <TabsTrigger value="dust">Dust Score</TabsTrigger>
              <TabsTrigger value="clean">Clean Score</TabsTrigger>
            </TabsList>
            
            <TabsContent value="dust" className="w-full">
              <div className="glass-panel p-6">
                <h2 className="text-2xl font-bold mb-4 text-unplayed-amber">Dust Leaderboard</h2>
                <p className="text-gray-400 mb-6">Highest dust scores represent users with the most unplayed games.</p>
                
                {/* Placeholder for the actual leaderboard - will be implemented later */}
                <div className="terminal-container bg-black/70 p-4">
                  <p className="text-unplayed-mint font-mono">Leaderboard coming soon!</p>
                  <p className="text-gray-400 mt-2">
                    We're gathering dust data from users who opt in to the leaderboard.
                  </p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="clean" className="w-full">
              <div className="glass-panel p-6">
                <h2 className="text-2xl font-bold mb-4 text-unplayed-mint">Clean Score Leaderboard</h2>
                <p className="text-gray-400 mb-6">Highest clean scores represent users who play most of their games.</p>
                
                {/* Placeholder for the actual leaderboard - will be implemented later */}
                <div className="terminal-container bg-black/70 p-4">
                  <p className="text-unplayed-mint font-mono">Leaderboard coming soon!</p>
                  <p className="text-gray-400 mt-2">
                    We're gathering clean score data from users who opt in to the leaderboard.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          {!user && (
            <div className="mt-8 p-4 border border-unplayed-pink/30 rounded-md bg-black/50">
              <p className="text-gray-300">
                <span className="text-unplayed-pink font-semibold">Connect your Steam account</span> to see your position on the leaderboard!
              </p>
            </div>
          )}
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default LeaderboardPage;
