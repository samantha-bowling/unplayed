
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import useLeaderboardData from "@/hooks/use-leaderboard-data";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis
} from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Settings, Crown, Trophy, Info, RotateCcw } from "lucide-react";
import RankChangeIndicator from "@/components/RankChangeIndicator";
import LeaderboardSettingsModal from "@/components/LeaderboardSettingsModal";
import LeaderboardWelcomeModal from "@/components/LeaderboardWelcomeModal";
import { useProfile } from "@/hooks/use-profile";
import SteamLoader from "@/components/SteamLoader";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const LeaderboardPage = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  
  const navigate = useNavigate();
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

  // Show welcome modal for first-time visitors
  useEffect(() => {
    if (user && profile && !profile.leaderboard_prompt_shown) {
      setWelcomeOpen(true);
    }
  }, [user, profile]);

  const handleRefresh = () => {
    refetch();
    toast("Refreshing leaderboard", {
      description: "Getting the latest rankings..."
    });
  };

  useEffect(() => {
    if (error) {
      toast.error("Error loading leaderboard", {
        description: "There was a problem loading the leaderboard data.",
      });
    }
  }, [error]);

  // Calculate correct rankings based on dust score (memoized)
  const leaderboardWithCorrectRanks = useMemo(() => 
    leaderboardData?.map((entry, index) => ({
      ...entry,
      calculatedRank: (pagination.page - 1) * pagination.pageSize + index + 1
    })) || []
  , [leaderboardData, pagination.page, pagination.pageSize]);

  // Generate page numbers for pagination
  const generatePageNumbers = () => {
    const currentPage = pagination.page;
    const totalPages = pagination.totalPages;
    const pages = [];
    
    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show smart pagination with ellipsis
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    
    return pages;
  };

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
        <Helmet>
          <title>Dust Dynasty Leaderboard – unplayed</title>
          <meta name="description" content="Who has the dustiest Steam library? See the ultimate gaming backlog leaderboard on unplayed." />
        </Helmet>
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
            <p className="text-lg md:text-xl max-w-2xl mx-auto text-gray-300">
              The ultimate gaming backlog leaderboard - celebrating the art of digital game collecting!
            </p>
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
                      <li>• <strong>Privacy:</strong> Control your visibility in leaderboard settings</li>
                    </ul>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
            
            <div className="glass-panel p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <p className="text-gray-400">The highest dust scores represent the most neglected gaming libraries.</p>
                
                {/* Page Size Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">Show:</span>
                  <Select
                    value={pagination.pageSize.toString()}
                    onValueChange={(value) => pagination.setPageSize(Number(value))}
                  >
                    <SelectTrigger className="w-20 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-gray-400">per page</span>
                </div>
              </div>
              
              {isLoading && pagination.page === 1 ? (
                <div className="flex flex-col items-center space-y-4">
                  <SteamLoader message="Loading dynasty members..." />
                  <div className="space-y-2 w-full">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="w-full h-12" />
                    ))}
                  </div>
                </div>
              ) : leaderboardWithCorrectRanks && leaderboardWithCorrectRanks.length > 0 ? (
                <div className="overflow-x-auto">
                <Table className="table-fixed w-full">
                  <TableHeader>
                    <TableRow>
                        <TableHead className="w-24 text-center text-unplayed-mint font-bold text-base py-3 px-2">Rank</TableHead>
                        <TableHead className="text-center text-unplayed-mint font-bold text-base py-3 px-2">Player</TableHead>
                        <TableHead className="text-center text-unplayed-mint font-bold text-base py-3 px-2 w-28">Dust Score</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaderboardWithCorrectRanks.map((entry) => {
                        const isCurrentUser = user && entry.user_id === user.id;
                        const displayName = entry.is_anonymous ? 'Anonymous Player' : entry.username || 'Unknown Player';
                        
                        return (
                          <TableRow 
                            key={entry.user_id}
                            className={isCurrentUser ? "bg-unplayed-amber/10" : ""}
                          >
                            <TableCell className="font-medium py-3 px-2 w-24 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {entry.calculatedRank === 1 && <Crown className="h-4 w-4 text-yellow-400" />}
                                {entry.calculatedRank === 2 && <Crown className="h-4 w-4 text-gray-400" />}
                                {entry.calculatedRank === 3 && <Crown className="h-4 w-4 text-amber-600" />}
                                {entry.calculatedRank}
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-2 text-center">
                              {entry.is_anonymous || !entry.user_id ? (
                                <span className={`
                                  ${entry.calculatedRank === 1 ? "text-yellow-400 font-bold" : ""}
                                  ${entry.calculatedRank === 2 ? "text-gray-300 font-semibold" : ""}
                                  ${entry.calculatedRank === 3 ? "text-amber-500 font-semibold" : ""}
                                `}>
                                  {displayName}
                                </span>
                              ) : (
                                <button
                                  onClick={() => navigate(`/profile/${entry.user_id}`)}
                                  className={`
                                    hover:underline cursor-pointer transition-colors
                                    ${entry.calculatedRank === 1 ? "text-yellow-400 font-bold hover:text-yellow-300" : ""}
                                    ${entry.calculatedRank === 2 ? "text-gray-300 font-semibold hover:text-gray-200" : ""}
                                    ${entry.calculatedRank === 3 ? "text-amber-500 font-semibold hover:text-amber-400" : ""}
                                    ${entry.calculatedRank > 3 ? "hover:text-unplayed-mint" : ""}
                                  `}
                                  aria-label={`View ${displayName}'s profile`}
                                >
                                  {displayName}
                                </button>
                              )}
                              {isCurrentUser && (
                                <span className="ml-2 text-xs text-unplayed-amber">(You)</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center font-mono font-bold text-unplayed-amber py-3 px-2 w-28">
                              {entry.dust_score.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>

                  {/* Enhanced Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="mt-6 flex flex-col items-center gap-4">
                      <Pagination>
                        <PaginationContent>
                          {/* Previous Button */}
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={() => pagination.goToPage(pagination.page - 1)}
                              className={pagination.page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                          
                          {/* Page Numbers */}
                          {generatePageNumbers().map((pageNum, index) => (
                            <PaginationItem key={index}>
                              {pageNum === '...' ? (
                                <PaginationEllipsis />
                              ) : (
                                <PaginationLink
                                  onClick={() => pagination.goToPage(pageNum as number)}
                                  isActive={pagination.page === pageNum}
                                  className="cursor-pointer"
                                >
                                  {pageNum}
                                </PaginationLink>
                              )}
                            </PaginationItem>
                          ))}
                          
                          {/* Next Button */}
                          <PaginationItem>
                            <PaginationNext 
                              onClick={() => pagination.goToPage(pagination.page + 1)}
                              className={pagination.page === pagination.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                      
                      {/* Pagination Info */}
                      <div className="text-sm text-gray-400 text-center">
                        Showing {((pagination.page - 1) * pagination.pageSize) + 1} to {Math.min(pagination.page * pagination.pageSize, pagination.totalItems)} of {pagination.totalItems} players
                      </div>
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
            
            {/* User Status Message - Only show for non-participating users */}
            {(statusInfo.variant === 'connect' || statusInfo.variant === 'welcome' || 
              statusInfo.variant === 'join' || statusInfo.variant === 'private') && (
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
            )}
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
