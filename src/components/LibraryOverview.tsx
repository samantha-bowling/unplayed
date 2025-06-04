
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { GamepadIcon, Clock, Trophy, Star, DollarSign, Calendar, Archive, Gamepad2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLibraryData } from '@/hooks/use-library-data';
import { useUnifiedSpendingDataV2 } from '@/hooks/useUnifiedSpendingDataV2';
import { formatCurrency } from '@/lib/utils';

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

    // Calculate average playtime for played games
    const playedGamesWithTime = libraryGames.filter(game => (game.userGame?.playtime_minutes || 0) > 0);
    const avgPlaytimeHours = playedGamesWithTime.length > 0 
      ? Math.round(playedGamesWithTime.reduce((sum, game) => sum + (game.userGame?.playtime_minutes || 0), 0) / playedGamesWithTime.length / 60)
      : 0;

    // Calculate games by release decade
    const currentYear = new Date().getFullYear();
    const gamesByAge = {
      recent: 0, // 0-2 years
      modern: 0, // 3-5 years
      mature: 0, // 6-10 years
      vintage: 0, // 11+ years
      unknown: 0
    };

    libraryGames.forEach(game => {
      if (game.release_date) {
        const releaseYear = new Date(game.release_date).getFullYear();
        const age = currentYear - releaseYear;
        
        if (age <= 2) gamesByAge.recent++;
        else if (age <= 5) gamesByAge.modern++;
        else if (age <= 10) gamesByAge.mature++;
        else gamesByAge.vintage++;
      } else {
        gamesByAge.unknown++;
      }
    });

    // Most common genres
    const genreCount: Record<string, number> = {};
    libraryGames.forEach(game => {
      (game.genres || []).forEach(genre => {
        genreCount[genre] = (genreCount[genre] || 0) + 1;
      });
    });
    const topGenres = Object.entries(genreCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    return {
      totalGames,
      unplayedGames,
      playedGames,
      unplayedPercentage: totalGames > 0 ? Math.round((unplayedGames / totalGames) * 100) : 0,
      totalPlaytimeHours,
      avgPlaytimeHours,
      gamesByAge,
      topGenres
    };
  }, [libraryGames]);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Quick Stats Grid */}
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
                    <Archive className="h-5 w-5 text-unplayed-red" />
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.unplayedGames}</p>
                      <p className="text-sm text-gray-400">unplayed</p>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Games you haven't played yet</p>
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
                    <DollarSign className="h-5 w-5 text-green-400" />
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {formatCurrency(spendingData.unplayedSpent || 0, spendingData.currency)}
                      </p>
                      <p className="text-sm text-gray-400">unplayed Value</p>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Estimated value of your unplayed games</p>
                </TooltipContent>
              </Tooltip>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-black/20 border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)] hover:shadow-[0_0_25px_rgba(163,247,191,0.2)] transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-unplayed-mint" />
                <span>Play Progress</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-white font-medium">Played Games</span>
                  <span className="text-sm text-gray-400">
                    {stats.playedGames} / {stats.totalGames} ({100 - stats.unplayedPercentage}%)
                  </span>
                </div>
                <Progress value={100 - stats.unplayedPercentage} className="h-3" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-white font-medium">unplayed Games</span>
                  <span className="text-sm text-gray-400">
                    {stats.unplayedGames} / {stats.totalGames} ({stats.unplayedPercentage}%)
                  </span>
                </div>
                <Progress value={stats.unplayedPercentage} className="h-3" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)] hover:shadow-[0_0_25px_rgba(163,247,191,0.2)] transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-400" />
                <span>Games by Age</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-center">
                  <p className="text-white font-bold">{stats.gamesByAge.recent}</p>
                  <p className="text-gray-400">Recent (0-2y)</p>
                </div>
                <div className="text-center">
                  <p className="text-white font-bold">{stats.gamesByAge.modern}</p>
                  <p className="text-gray-400">Modern (3-5y)</p>
                </div>
                <div className="text-center">
                  <p className="text-white font-bold">{stats.gamesByAge.mature}</p>
                  <p className="text-gray-400">Mature (6-10y)</p>
                </div>
                <div className="text-center">
                  <p className="text-white font-bold">{stats.gamesByAge.vintage}</p>
                  <p className="text-gray-400">Vintage (11y+)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Genres */}
        <Card className="bg-black/20 border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)] hover:shadow-[0_0_25px_rgba(163,247,191,0.2)] transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-unplayed-amber" />
              <span>Top Genres in Your Library</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stats.topGenres.map(([genre, count], index) => (
                <Badge
                  key={genre}
                  variant="outline"
                  className={`text-sm ${
                    index === 0 ? 'border-unplayed-mint text-unplayed-mint' :
                    index === 1 ? 'border-unplayed-amber text-unplayed-amber' :
                    index === 2 ? 'border-orange-400 text-orange-400' :
                    'border-gray-500 text-gray-300'
                  }`}
                >
                  {genre} ({count})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};

export default LibraryOverview;
