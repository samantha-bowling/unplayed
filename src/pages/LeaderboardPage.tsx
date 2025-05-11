
import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import useLeaderboardData from "@/hooks/use-leaderboard-data";

const LeaderboardPage = () => {
  const [activeTab, setActiveTab] = useState<"dust" | "clean">("dust");
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { 
    data: leaderboardData,
    isLoading,
    error,
    timeframe,
    setTimeframe,
    userRank
  } = useLeaderboardData(activeTab);

  if (error) {
    toast({
      variant: "destructive",
      title: "Error loading leaderboard",
      description: "There was a problem loading the leaderboard data.",
    });
  }

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
            
            <div className="mb-6 flex justify-center">
              <div className="bg-black/30 inline-flex rounded-lg p-1">
                <button
                  onClick={() => setTimeframe('all')}
                  className={`px-4 py-2 rounded-md ${timeframe === 'all' ? 
                    'bg-unplayed-mint/20 text-unplayed-mint' : 
                    'text-gray-400 hover:text-gray-300'}`}
                >
                  All Time
                </button>
                <button
                  onClick={() => setTimeframe('month')}
                  className={`px-4 py-2 rounded-md ${timeframe === 'month' ? 
                    'bg-unplayed-mint/20 text-unplayed-mint' : 
                    'text-gray-400 hover:text-gray-300'}`}
                >
                  This Month
                </button>
                <button
                  onClick={() => setTimeframe('week')}
                  className={`px-4 py-2 rounded-md ${timeframe === 'week' ? 
                    'bg-unplayed-mint/20 text-unplayed-mint' : 
                    'text-gray-400 hover:text-gray-300'}`}
                >
                  This Week
                </button>
              </div>
            </div>
            
            <TabsContent value="dust" className="w-full">
              <div className="glass-panel p-6">
                <h2 className="text-2xl font-bold mb-4 text-unplayed-amber">Dust Leaderboard</h2>
                <p className="text-gray-400 mb-6">Highest dust scores represent users with the most unplayed games.</p>
                
                {isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="w-full h-12" />
                    ))}
                  </div>
                ) : leaderboardData && leaderboardData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">Rank</TableHead>
                          <TableHead>Player</TableHead>
                          <TableHead className="text-right">Dust Score</TableHead>
                          <TableHead className="text-right hidden md:table-cell">Games</TableHead>
                          <TableHead className="text-right hidden md:table-cell">Unplayed</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {leaderboardData.map((entry, index) => {
                          const isCurrentUser = user && entry.user_id === user.id;
                          
                          return (
                            <TableRow 
                              key={entry.id}
                              className={isCurrentUser ? "bg-unplayed-mint/10" : ""}
                            >
                              <TableCell className="font-medium">
                                {index + 1}
                                {isCurrentUser && <span className="ml-1 text-unplayed-mint">•</span>}
                              </TableCell>
                              <TableCell>
                                {entry.is_anonymous ? 
                                  "Anonymous Player" : 
                                  entry.username || "Unknown Player"}
                              </TableCell>
                              <TableCell className="text-right font-mono font-bold">
                                {entry.dust_score.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right hidden md:table-cell">
                                {entry.total_games.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right hidden md:table-cell">
                                {entry.unplayed_games.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="terminal-container bg-black/70 p-4">
                    <p className="text-unplayed-mint font-mono">No leaderboard data available!</p>
                    <p className="text-gray-400 mt-2">
                      Be the first to opt in to the leaderboard in your profile settings.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="clean" className="w-full">
              <div className="glass-panel p-6">
                <h2 className="text-2xl font-bold mb-4 text-unplayed-mint">Clean Score Leaderboard</h2>
                <p className="text-gray-400 mb-6">Highest clean scores represent users who play most of their games.</p>
                
                {isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="w-full h-12" />
                    ))}
                  </div>
                ) : leaderboardData && leaderboardData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">Rank</TableHead>
                          <TableHead>Player</TableHead>
                          <TableHead className="text-right">Clean Score</TableHead>
                          <TableHead className="text-right hidden md:table-cell">Games</TableHead>
                          <TableHead className="text-right hidden md:table-cell">Played</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {leaderboardData.map((entry, index) => {
                          const isCurrentUser = user && entry.user_id === user.id;
                          
                          return (
                            <TableRow 
                              key={entry.id}
                              className={isCurrentUser ? "bg-unplayed-mint/10" : ""}
                            >
                              <TableCell className="font-medium">
                                {index + 1}
                                {isCurrentUser && <span className="ml-1 text-unplayed-mint">•</span>}
                              </TableCell>
                              <TableCell>
                                {entry.is_anonymous ? 
                                  "Anonymous Player" : 
                                  entry.username || "Unknown Player"}
                              </TableCell>
                              <TableCell className="text-right font-mono font-bold">
                                {entry.clean_score.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right hidden md:table-cell">
                                {entry.total_games.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right hidden md:table-cell">
                                {entry.played_games.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="terminal-container bg-black/70 p-4">
                    <p className="text-unplayed-mint font-mono">No leaderboard data available!</p>
                    <p className="text-gray-400 mt-2">
                      Be the first to opt in to the leaderboard in your profile settings.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
          
          {!user ? (
            <div className="mt-8 p-4 border border-unplayed-pink/30 rounded-md bg-black/50">
              <p className="text-gray-300">
                <span className="text-unplayed-pink font-semibold">Connect your Steam account</span> to see your position on the leaderboard!
              </p>
            </div>
          ) : userRank ? (
            <div className="mt-8 p-4 glass-panel">
              <p className="text-gray-300">
                Your current rank: <span className="text-unplayed-mint font-bold">#{userRank}</span>
              </p>
            </div>
          ) : (
            <div className="mt-8 p-4 border border-unplayed-amber/30 rounded-md bg-black/50">
              <p className="text-gray-300">
                <span className="text-unplayed-amber font-semibold">Opt in to the leaderboard</span> in your profile settings to appear in rankings!
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
