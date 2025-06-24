
import { useState, useEffect } from "react";
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
import { Loader2, Settings, Crown, Trophy, Info, RotateCcw, Sparkles } from "lucide-react";
import RankChangeIndicator from "@/components/RankChangeIndicator";
import LeaderboardSettingsModal from "@/components/LeaderboardSettingsModal";
import LeaderboardWelcomeModal from "@/components/LeaderboardWelcomeModal";
import { useProfile } from "@/hooks/use-profile";
import SteamLoader from "@/components/SteamLoader";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const LeaderboardPage = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  
  const { 
    data: leaderboardData,
    isLoading,
    error,
    refetch,
    userRank,
    pagination
  } = useLeaderboardData('dust');

  const [loadingMore, setLoadingMore] = useState(false);

  // Show welcome modal for first-time visitors
  useEffect(() => {
    if (user && profile && !profile.leaderboard_prompt_shown) {
      setWelcomeOpen(true);
    }
  }, [user, profile]);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    await pagination.loadNextPage();
    setLoadingMore(false);
  };

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Refreshing leaderboard",
      description: "Getting the latest rankings..."
    });
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
        variant: "connect" as const,
        showCTA: true,
        ctaText: "Connect Steam",
        ctaAction: () => window.location.href = '/auth'
      };
    }

    if (!profile?.leaderboard_prompt_shown) {
      return {
        message: "Welcome! Ready to join the ultimate gaming backlog competition?",
        variant: "welcome" as const,
        showCTA: true,
        ctaText: "Learn More",
        ctaAction: () => setWelcomeOpen(true)
      };
    }

    const visibility = profile?.leaderboard_visibility || 'off';
    
    switch (visibility) {
      case 'off':
        if (profile?.leaderboard_opted_out_explicitly) {
          return {
            message: "You're browsing privately. Want to see how you'd rank?",
            variant: "private" as const,
            showCTA: true,
            ctaText: "Join Competition",
            ctaAction: () => setSettingsOpen(true)
          };
        } else {
          return {
            message: "Join the Dust Dynasty! Configure your settings to compete.",
            variant: "join" as const,
            showCTA: true,
            ctaText: "Join Now",
            ctaAction: () => setSettingsOpen(true)
          };
        }
      case 'anonymous':
        return {
          message: `You're competing anonymously in the Dust Dynasty${userRank ? ` at rank #${userRank}` : ''}!`,
          variant: "anonymous" as const,
          showCTA: false
        };
      case 'public':
        return {
          message: `Welcome to the Dust Dynasty${userRank ? `, you're ranked #${userRank}` : ''}!`,
          variant: "public" as const,
          showCTA: false
        };
      default:
        return {
          message: "Configure your leaderboard settings to join the Dust Dynasty.",
          variant: "join" as const,
          showCTA: true,
          ctaText: "Configure",
          ctaAction: () => setSettingsOpen(true)
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
          
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-unplayed-amber" />
            <p className="text-lg md:text-xl max-w-2xl mx-auto text-gray-300">
              The ultimate gaming backlog leaderboard - celebrating the art of digital game collecting!
            </p>
            <Sparkles className="h-5 w-5 text-unplayed-amber" />
          </div>
          
          <p className="text-sm text-gray-400 mb-8">
            All-time rankings based on historical dust scores and library growth
          </p>

          <div className="max-w-4xl mx-auto">
            {/* User Actions */}
            <div className="mb-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Refresh Rankings
              </Button>
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

            {/* Info Tooltip */}
            <div className="mb-6 flex justify-center items-center gap-4">
              <h2 className="text-2xl font-bold text-unplayed-amber">All-Time Dynasty Rankings</h2>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-5 w-5 text-gray-400 hover:text-unplayed-mint cursor-help flex-shrink-0" />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-sm p-4">
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold text-unplayed-mint">How the Dust Dynasty works:</p>
                    <ul className="space-y-1 text-left">
                      <li>• <strong>Dust Score:</strong> Higher scores = more neglected gaming libraries</li>
                      <li>• <strong>All-Time:</strong> Historical rankings based on snapshot data</li>
                      <li>• <strong>Rank Changes:</strong> Green ↑ means rank improved, red ↓ means rank dropped</li>
                      <li>• <strong>Privacy:</strong> Control your visibility in leaderboard settings</li>
                    </ul>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
            
            <div className="glass-panel p-6">
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
                        <TableHead>Player</TableHead>
                        <TableHead className="text-right">Dust Score</TableHead>
                        <TableHead className="text-right hidden md:table-cell">Games</TableHead>
                        <TableHead className="text-right hidden md:table-cell">Unplayed</TableHead>
                        <TableHead className="text-center hidden sm:table-cell">Change</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaderboardData.map((entry) => {
                        const isCurrentUser = user && entry.user_id === user.id;
                        
                        return (
                          <TableRow 
                            key={entry.user_id}
                            className={isCurrentUser ? "bg-unplayed-amber/10" : ""}
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {entry.ranking && entry.ranking <= 3 && (
                                  <Crown className={`h-4 w-4 ${
                                    entry.ranking === 1 ? 'text-yellow-400' : 
                                    entry.ranking === 2 ? 'text-gray-400' : 
                                    'text-amber-600'
                                  }`} />
                                )}
                                {entry.ranking}
                                {isCurrentUser && <span className="ml-1 text-unplayed-amber">•</span>}
                              </div>
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
                            <TableCell className="text-center hidden sm:table-cell">
                              <RankChangeIndicator rankChange={entry.rank_change} />
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
              statusInfo.variant === 'welcome' ? 'border border-unplayed-mint/30 bg-unplayed-mint/5' :
              statusInfo.variant === 'join' ? 'border border-unplayed-amber/30 bg-black/50' :
              statusInfo.variant === 'private' ? 'border border-gray-500/30 bg-black/50' :
              'glass-panel'
            }`}>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className={`${
                  statusInfo.variant === 'connect' ? 'text-unplayed-pink' :
                  statusInfo.variant === 'welcome' ? 'text-unplayed-mint' :
                  statusInfo.variant === 'join' ? 'text-unplayed-amber' :
                  statusInfo.variant === 'private' ? 'text-gray-300' :
                  'text-unplayed-amber'
                } font-semibold text-center sm:text-left`}>
                  {statusInfo.message}
                </p>
                {statusInfo.showCTA && statusInfo.ctaAction && (
                  <Button 
                    onClick={statusInfo.ctaAction}
                    size="sm"
                    className={`${
                      statusInfo.variant === 'connect' ? 'bg-unplayed-pink hover:bg-unplayed-pink/90' :
                      statusInfo.variant === 'welcome' ? 'bg-unplayed-mint hover:bg-unplayed-mint/90 text-black' :
                      'bg-unplayed-amber hover:bg-unplayed-amber/90 text-black'
                    } font-semibold`}
                  >
                    {statusInfo.ctaText}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>
        
        <Footer />
        
        <LeaderboardSettingsModal
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
        />
        
        <LeaderboardWelcomeModal
          open={welcomeOpen}
          onOpenChange={setWelcomeOpen}
        />
      </div>
    </TooltipProvider>
  );
};

export default LeaderboardPage;
