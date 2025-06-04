
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldQuestion, TrendingUp, Clock, Activity, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserMetrics } from '@/hooks/use-user-metrics';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const LibraryStatsSection: React.FC = () => {
  const navigate = useNavigate();
  const { data: userMetrics, isLoading } = useUserMetrics();
  
  // Show loading state if metrics are not available
  if (isLoading || !userMetrics) {
    return (
      <div className="mb-6">
        <Card className="bg-black/30 border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)]">
          <CardContent className="p-6">
            <div className="text-center text-gray-400">Loading library stats...</div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const unplayedPercentage = userMetrics.totalGames > 0 
    ? Math.round((userMetrics.unplayedGames / userMetrics.totalGames) * 100) 
    : 0;
  
  // Format playtime display
  const formatPlaytime = (hours: number) => {
    if (hours < 1) return "< 1h";
    if (hours < 100) return `${Math.round(hours)}h`;
    if (hours < 1000) return `${Math.round(hours / 10) * 10}h`;
    return `${Math.round(hours / 100) * 100}h`;
  };

  const handleLibraryValueClick = () => {
    navigate('/spend');
  };

  return (
    <TooltipProvider>
      <div className="mb-6">
        <Card className="bg-black/30 border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)] hover:border-unplayed-mint/40 hover:shadow-[0_0_25px_rgba(163,247,191,0.2)] transition-all duration-300">
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-6">
              {/* Row 1 */}
              {/* Unplayed Games Count */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-4 cursor-help p-4 rounded-lg bg-black/20 border border-unplayed-mint/10 shadow-[0_0_15px_rgba(163,247,191,0.1)] hover:shadow-[0_0_20px_rgba(163,247,191,0.15)] transition-all duration-300">
                    <div className="flex-shrink-0 w-12 h-12 bg-unplayed-mint/20 rounded-lg flex items-center justify-center">
                      <ShieldQuestion className="h-6 w-6 text-unplayed-mint" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-unplayed-mint">
                        {userMetrics.unplayedGames}
                      </div>
                      <div className="text-sm text-gray-400">
                        unplayed Games
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Games in your library with 0 minutes of playtime</p>
                </TooltipContent>
              </Tooltip>

              {/* Percentage of Library */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-4 cursor-help p-4 rounded-lg bg-black/20 border border-unplayed-mint/10 shadow-[0_0_15px_rgba(163,247,191,0.1)] hover:shadow-[0_0_20px_rgba(163,247,191,0.15)] transition-all duration-300">
                    <div className="flex-shrink-0 w-12 h-12 bg-unplayed-amber/20 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-unplayed-amber" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-unplayed-amber">
                        {unplayedPercentage}%
                      </div>
                      <div className="text-sm text-gray-400">
                        of library unplayed
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Percentage of your library that has never been played</p>
                </TooltipContent>
              </Tooltip>

              {/* Total Playtime */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-4 cursor-help p-4 rounded-lg bg-black/20 border border-unplayed-mint/10 shadow-[0_0_15px_rgba(163,247,191,0.1)] hover:shadow-[0_0_20px_rgba(163,247,191,0.15)] transition-all duration-300">
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Clock className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-400">
                        {formatPlaytime(userMetrics.totalPlaytimeHours)}
                      </div>
                      <div className="text-sm text-gray-400">
                        total playtime
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Total hours spent playing games across your entire library</p>
                </TooltipContent>
              </Tooltip>

              {/* Row 2 */}
              {/* Recent Activity */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-4 cursor-help p-4 rounded-lg bg-black/20 border border-unplayed-mint/10 shadow-[0_0_15px_rgba(163,247,191,0.1)] hover:shadow-[0_0_20px_rgba(163,247,191,0.15)] transition-all duration-300">
                    <div className="flex-shrink-0 w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <Activity className="h-6 w-6 text-green-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-400">
                        {userMetrics.recentlyPlayedCount}
                      </div>
                      <div className="text-sm text-gray-400">
                        played recently
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Games played in the last 30 days (any amount of playtime)</p>
                </TooltipContent>
              </Tooltip>

              {/* Library Value - Spanning 2 columns */}
              <div className="col-span-2 flex items-center justify-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleLibraryValueClick}
                      variant="outline"
                      className="bg-emerald-500/20 text-emerald-400 font-semibold hover:bg-emerald-500/30 border-emerald-400/30 shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] h-16 px-8 w-full max-w-md transition-all duration-300"
                    >
                      <DollarSign className="mr-3 h-6 w-6" />
                      <div className="text-left">
                        <div className="text-lg font-bold">View Library Value</div>
                        <div className="text-xs opacity-75">Check your spending</div>
                      </div>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View detailed breakdown of your library's monetary value and spending analysis</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};

export default LibraryStatsSection;
