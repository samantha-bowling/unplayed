
import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import useLeaderboardData from "@/hooks/use-leaderboard-data";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem 
} from "@/components/ui/pagination";
import { Clock, Loader2, Settings, Crown, Trophy, Info } from "lucide-react";
import { format, parseISO } from "date-fns";
import RankChangeIndicator from "@/components/RankChangeIndicator";
import LeaderboardSettingsModal from "@/components/LeaderboardSettingsModal";
import { useProfile } from "@/hooks/use-profile";
import SteamLoader from "@/components/SteamLoader";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const LeaderboardPage = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  const { 
    data: leaderboardData,
    isLoading,
    error,
    timeframe,
    setTimeframe,
    userRank,
    pagination,
    lastUpdated
  } = useLeaderboardData("dust");

  const [loadingMore, setLoadingMore] = useState(false);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    await pagination.loadNextPage();
    setLoadingMore(false);
  };

  if (error) {
    toast({
      variant: "destructive",
      title: "Error loading leaderboard",
      description: "There was a problem loading the leaderboard data.",
    });
  }

  const getUserStatusMessage = () => {
    if (!user) {
      return {
        message: "Connect your Steam account to see your position in the Dust Dynasty!",
        variant: "connect" as const
      };
    }

    const visibility = profile?.leaderboard_visibility || 'off';
    
    switch (visibility) {
      case 'off':
        return {
          message: "Join the Dust Dynasty! Configure your leaderboard settings to compete.",
          variant: "join" as const
        };
      case 'anonymous':
        return {
          message: `You're competing anonymously in the Dust Dynasty${userRank ? ` at rank #${userRank}` : ''}!`,
          variant: "anonymous" as const
        };
      case 'public':
        return {
          message: `Welcome to the Dust Dynasty${userRank ? `, you're ranked #${userRank}` : ''}!`,
          variant: "public" as const
        };
      default:
        return {
          message: "Configure your leaderboard settings to join the Dust Dynasty.",
          variant: "join" as const
        };
    }
  };

  const statusInfo = getUserStatusMessage();

  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <section className="navbar-offset flex-grow px-4 py-12 text-center relative overflow-hidden">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Crown className="h-8 w-8 text-unplayed-mint" />
            <h1 className="text-4xl md:text-5xl font-bold text-unplayed-mint">
              Dust Dynasty
            </h1>
            <Trophy className="h-8 w-8 text-unplayed-mint" />
          </div>
          
          <div className="flex items-center justify-center gap-2 mb-8">
            <p className="text-lg md:text-xl max-w-2xl mx-auto text-gray-300">
              The proverbial 'Wall of Shame' highlighting players with the biggest and most neglected Steam libraries.
            </p>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-5 w-5 text-gray-400 hover:text-unplayed-mint cursor-help flex-shrink-0" />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-sm p-4">
                <div className="space-y-2 text-sm">
                  <p className="font-semibold text-unplayed-mint">How the Dust Dynasty works:</p>
                  <ul className="space-y-1 text-left">
                    <li>• <strong>Dust Score:</strong> Higher scores = more neglected gaming libraries</li>
                    <li>• <strong>Daily Updates:</strong> Rankings refresh once per day with the latest data</li>
                    <li>• <strong>Single Entry:</strong> Each user appears only once per timeframe</li>
                    <li>• <strong>Rank Changes:</strong> Track your movement compared to the previous day</li>
                    <li>• <strong>Privacy:</strong> Control your visibility in leaderboard settings</li>
                  </ul>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="max-w-4xl mx-auto">
            {/* Last Updated Timestamp */}
            {lastUpdated.date && !lastUpdated.isLoading && (
              <div className="flex justify-center items-center mb-6 text-sm text-gray-400">
                <Clock className="h-4 w-4 mr-1" />
                <span>
                  Last updated: {format(parseISO(lastUpdated.date), "MMMM d, yyyy 'at' h:mm a")}
                </span>
              </div>
            )}
            {lastUpdated.isLoading && (
              <div className="flex justify-center items-center mb-6">
                <SteamLoader size="sm" message="Loading..." />
              </div>
            )}

            {/* User Actions */}
            <div className="mb-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
              {user && (
                <Button
                  onClick={() => setSettingsOpen(true)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Leaderboard Settings
                </Button>
              )}
            </div>

            {/* Timeframe Selector */}
            <div className="mb-6 flex justify-center">
              <div className="bg-black/30 inline-flex rounded-lg p-1">
                <button
                  onClick={() => setTimeframe('week')}
                  className={`px-4 py-2 rounded-md ${timeframe === 'week' ? 
                    'bg-unplayed-amber/20 text-unplayed-amber' : 
                    'text-gray-400 hover:text-gray-300'}`}
                >
                  This Week
                </button>
                <button
                  onClick={() => setTimeframe('month')}
                  className={`px-4 py-2 rounded-md ${timeframe === 'month' ? 
                    'bg-unplayed-amber/20 text-unplayed-amber' : 
                    'text-gray-400 hover:text-gray-300'}`}
                >
                  This Month
                </button>
                <button
                  onClick={() => setTimeframe('all')}
                  className={`px-4 py-2 rounded-md ${timeframe === 'all' ? 
                    'bg-unplayed-amber/20 text-unplayed-amber' : 
                    'text-gray-400 hover:text-gray-300'}`}
                >
                  All Time
                </button>
              </div>
            </div>
            
            <div className="glass-panel p-6">
              <h2 className="text-2xl font-bold mb-4 text-unplayed-amber">Dynasty Rankings</h2>
              <p className="text-gray-400 mb-6">The highest dust scores represent the most neglected gaming libraries.</p>
              
              {isLoading && pagination.page === 1 ? (
                <div className="flex flex-col items-center space-y-4">
                  <SteamLoader message="Loading dynasty members..." />
                  <div className="space-y-2 w-full">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="w-full h-12" />
                    ))}
                  </div>
                </div>
              ) : leaderboardData && leaderboardData.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Rank</TableHead>
                        <TableHead className="w-12">Change</TableHead>
                        <TableHead>Player</TableHead>
                        <TableHead className="text-right">Dust Score</TableHead>
                        <TableHead className="text-right hidden md:table-cell">Games</TableHead>
                        <TableHead className="text-right hidden md:table-cell">Unplayed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaderboardData.map((entry, index) => {
                        const isCurrentUser = user && entry.user_id === user.id;
                        const globalRank = ((pagination.page - 1) * 20) + index + 1;
                        
                        return (
                          <TableRow 
                            key={entry.id}
                            className={isCurrentUser ? "bg-unplayed-amber/10" : ""}
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {globalRank <= 3 && (
                                  <Crown className={`h-4 w-4 ${
                                    globalRank === 1 ? 'text-yellow-400' : 
                                    globalRank === 2 ? 'text-gray-400' : 
                                    'text-amber-600'
                                  }`} />
                                )}
                                {globalRank}
                                {isCurrentUser && <span className="ml-1 text-unplayed-amber">•</span>}
                              </div>
                            </TableCell>
                            <TableCell>
                              <RankChangeIndicator change={entry.rank_change} />
                            </TableCell>
                            <TableCell>
                              {entry.is_anonymous ? 
                                "Anonymous Player" : 
                                entry.username || "Unknown Player"}
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold text-unplayed-amber">
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

                  {/* Load More Button */}
                  {pagination.hasMore && (
                    <div className="mt-6">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <button
                              onClick={handleLoadMore}
                              disabled={loadingMore || !pagination.hasMore}
                              className="flex items-center px-4 py-2 text-sm font-medium bg-unplayed-amber/20 hover:bg-unplayed-amber/30 text-unplayed-amber rounded-md disabled:opacity-50 disabled:pointer-events-none"
                            >
                              {loadingMore ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Loading more...
                                </>
                              ) : (
                                "Load More Players"
                              )}
                            </button>
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </div>
              ) : (
                <div className="terminal-container bg-black/70 p-4">
                  <p className="text-unplayed-amber font-mono">No dynasty members yet!</p>
                  <p className="text-gray-400 mt-2">
                    Be the first to join the Dust Dynasty by configuring your leaderboard settings.
                  </p>
                </div>
              )}
            </div>
            
            {/* User Status Message */}
            <div className={`mt-8 p-4 rounded-md ${
              statusInfo.variant === 'connect' ? 'border border-unplayed-pink/30 bg-black/50' :
              statusInfo.variant === 'join' ? 'border border-unplayed-amber/30 bg-black/50' :
              'glass-panel'
            }`}>
              <p className={`${
                statusInfo.variant === 'connect' ? 'text-unplayed-pink' :
                statusInfo.variant === 'join' ? 'text-unplayed-amber' :
                'text-unplayed-amber'
              } font-semibold`}>
                {statusInfo.message}
              </p>
            </div>
          </div>
        </section>
        
        <Footer />
        
        <LeaderboardSettingsModal
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
        />
      </div>
    </TooltipProvider>
  );
};

export default LeaderboardPage;
