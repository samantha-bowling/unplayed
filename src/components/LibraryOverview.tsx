
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GamepadIcon, Clock, Trophy, Star, Target, Activity, Palette } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLibraryData } from '@/hooks/use-library-data';
import { useUnifiedSpendingDataV2 } from '@/hooks/useUnifiedSpendingDataV2';
import CurrencyAmount from '@/components/ui/currency-amount';

const LibraryOverview = () => {
  const { games: libraryGames } = useLibraryData();
  const { data: spendingData } = useUnifiedSpendingDataV2();

  // Calculate overview statistics
  const stats = React.useMemo(() => {
    const totalGames = libraryGames.length;
    const unplayedGames = libraryGames.filter(game => {
      const playtime = game.userGame?.playtime_minutes || 0;
      return playtime === 0;
    }).length;
    const playedGames = totalGames - unplayedGames;

    // Calculate total playtime
    const totalPlaytimeMinutes = libraryGames.reduce((sum, game) => {
      return sum + (game.userGame?.playtime_minutes || 0);
    }, 0);
    const totalPlaytimeHours = Math.round(totalPlaytimeMinutes / 60);

    // Calculate completion rate
    const completionRate = totalGames > 0 ? Math.round((playedGames / totalGames) * 100) : 0;

    // Get top 3 played games
    const topPlayedGames = libraryGames
      .filter(game => (game.userGame?.playtime_minutes || 0) > 0)
      .sort((a, b) => (b.userGame?.playtime_minutes || 0) - (a.userGame?.playtime_minutes || 0))
      .slice(0, 3);

    // Calculate playtime distribution
    const playtimeDistribution = {
      unplayed: 0,
      light: 0,    // < 2 hours
      moderate: 0, // 2-10 hours
      heavy: 0     // 10+ hours
    };

    libraryGames.forEach(game => {
      const playtimeHours = (game.userGame?.playtime_minutes || 0) / 60;
      if (playtimeHours === 0) {
        playtimeDistribution.unplayed++;
      } else if (playtimeHours < 2) {
        playtimeDistribution.light++;
      } else if (playtimeHours <= 10) {
        playtimeDistribution.moderate++;
      } else {
        playtimeDistribution.heavy++;
      }
    });

    return {
      totalGames,
      playedGames,
      totalPlaytimeHours,
      completionRate,
      topPlayedGames,
      playtimeDistribution
    };
  }, [libraryGames]);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Top Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-black/20 border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)] hover:shadow-[0_0_25px_rgba(163,247,191,0.2)] transition-all duration-300">
            <CardContent className="p-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-2 cursor-help">
                    <GamepadIcon className="h-5 w-5 text-unplayed-mint" />
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.totalGames}</p>
                      <p className="text-sm text-gray-400">Total Games</p>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Total games in your Steam library</p>
                </TooltipContent>
              </Tooltip>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)] hover:shadow-[0_0_25px_rgba(163,247,191,0.2)] transition-all duration-300">
            <CardContent className="p-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-2 cursor-help">
                    <Trophy className="h-5 w-5 text-green-400" />
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.playedGames}</p>
                      <p className="text-sm text-gray-400">Games Played</p>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Games you have played (with recorded playtime)</p>
                </TooltipContent>
              </Tooltip>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)] hover:shadow-[0_0_25px_rgba(163,247,191,0.2)] transition-all duration-300">
            <CardContent className="p-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-2 cursor-help">
                    <Clock className="h-5 w-5 text-blue-400" />
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.totalPlaytimeHours}h</p>
                      <p className="text-sm text-gray-400">Total Playtime</p>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Total hours played across all games</p>
                </TooltipContent>
              </Tooltip>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)] hover:shadow-[0_0_25px_rgba(163,247,191,0.2)] transition-all duration-300">
            <CardContent className="p-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-2 cursor-help">
                    <Target className="h-5 w-5 text-unplayed-amber" />
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.completionRate}%</p>
                      <p className="text-sm text-gray-400">Completion Rate</p>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Percentage of games you've actually played</p>
                </TooltipContent>
              </Tooltip>
            </CardContent>
          </Card>
        </div>

        {/* Second Row - Most Played Games and Playtime Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-black/20 border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)] hover:shadow-[0_0_25px_rgba(163,247,191,0.2)] transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-unplayed-amber" />
                <span>Most Played Games</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats.topPlayedGames.length > 0 ? (
                stats.topPlayedGames.map((game, index) => (
                  <div key={game.id} className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-unplayed-mint/20 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-unplayed-mint">#{index + 1}</span>
                    </div>
                    <div className="flex-shrink-0">
                      <img 
                        src={game.header_image || game.image_url || '/placeholder-game.jpg'} 
                        alt={game.name}
                        className="w-16 h-9 object-cover rounded"
                      />
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-white font-medium truncate">{game.name}</p>
                      <p className="text-sm text-gray-400">
                        {Math.round((game.userGame?.playtime_minutes || 0) / 60)}h played
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-400 py-4">
                  <p>No played games yet</p>
                  <p className="text-sm">Start playing to see your top games here!</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-black/20 border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)] hover:shadow-[0_0_25px_rgba(163,247,191,0.2)] transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-blue-400" />
                <span>Playtime Distribution</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-white">unplayed</span>
                  <span className="text-unplayed-red font-medium">{stats.playtimeDistribution.unplayed} games</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white">Light Play (&lt;2h)</span>
                  <span className="text-yellow-400 font-medium">{stats.playtimeDistribution.light} games</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white">Moderate Play (2-10h)</span>
                  <span className="text-blue-400 font-medium">{stats.playtimeDistribution.moderate} games</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white">Heavy Play (10h+)</span>
                  <span className="text-green-400 font-medium">{stats.playtimeDistribution.heavy} games</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Third Row - Activity Insights and Genre Galaxy */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-black/20 border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)] hover:shadow-[0_0_25px_rgba(163,247,191,0.2)] transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-unplayed-mint" />
                <span>Activity Insights</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Recently Active Games</h4>
                  <p className="text-gray-400 text-sm">Coming soon - track your recent gaming activity</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Value Champion</h4>
                  <p className="text-gray-400 text-sm">Coming soon - discover your best value games</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Gaming Style</h4>
                  <p className="text-gray-400 text-sm">Coming soon - analyze your gaming patterns</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)] hover:shadow-[0_0_25px_rgba(163,247,191,0.2)] transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="h-5 w-5 text-purple-400" />
                <span>Genre Galaxy</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-400 py-8">
                <p>Coming soon</p>
                <p className="text-sm">Explore your gaming universe in a beautiful constellation view</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default LibraryOverview;
