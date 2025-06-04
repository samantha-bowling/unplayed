
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { GamepadIcon, Clock, Trophy, Star, Activity, Calendar, Gamepad2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLibraryData } from '@/hooks/use-library-data';
import GenreGalaxy from '@/components/GenreGalaxy';
import { calculateActivityInsights } from '@/utils/activity-insights';

const LibraryOverview = () => {
  const { games: libraryGames } = useLibraryData();

  // Calculate overview statistics
  const stats = React.useMemo(() => {
    const totalGames = libraryGames.length;
    const playedGames = libraryGames.filter(game => {
      const playtime = game.userGame?.playtime_minutes || 0;
      return playtime > 0;
    });
    const unplayedGames = totalGames - playedGames.length;

    // Calculate total playtime
    const totalPlaytimeMinutes = libraryGames.reduce((sum, game) => {
      return sum + (game.userGame?.playtime_minutes || 0);
    }, 0);
    const totalPlaytimeHours = Math.round(totalPlaytimeMinutes / 60);

    // Calculate completion rate
    const completionRate = totalGames > 0 ? Math.round((playedGames.length / totalGames) * 100) : 0;

    // Get most played games (top 3)
    const mostPlayedGames = playedGames
      .sort((a, b) => (b.userGame?.playtime_minutes || 0) - (a.userGame?.playtime_minutes || 0))
      .slice(0, 3)
      .map((game, index) => ({
        rank: index + 1,
        name: game.name,
        playtime: Math.round((game.userGame?.playtime_minutes || 0) / 60),
        image: game.header_image || game.image_url
      }));

    // Calculate playtime distribution
    const playtimeDistribution = {
      unplayed: unplayedGames,
      light: 0, // <2h
      moderate: 0, // 2-10h
      heavy: 0 // 10h+
    };

    playedGames.forEach(game => {
      const hours = (game.userGame?.playtime_minutes || 0) / 60;
      if (hours < 2) playtimeDistribution.light++;
      else if (hours < 10) playtimeDistribution.moderate++;
      else playtimeDistribution.heavy++;
    });

    // Most common genres for GenreGalaxy
    const genreCount: Record<string, number> = {};
    libraryGames.forEach(game => {
      (game.genres || []).forEach(genre => {
        genreCount[genre] = (genreCount[genre] || 0) + 1;
      });
    });
    const topGenres = Object.entries(genreCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([genre, count]) => ({ genre, count }));

    // Activity insights - calculate and convert to display messages
    const activityData = calculateActivityInsights(libraryGames);
    const insights = [
      `You've played ${activityData.recentlyPlayedGames} games in the last 30 days`,
      `${activityData.recentlyPlayedUnplayed} previously unplayed games were started recently`,
      `Your clean streak is ${activityData.cleanStreak} days`,
      `Total playtime: ${Math.round(activityData.totalPlaytimeHours)} hours across all games`,
      `Average session length: ${Math.round(activityData.averageSessionLength)} hours per game`
    ];

    return {
      totalGames,
      playedGames: playedGames.length,
      unplayedGames,
      totalPlaytimeHours,
      completionRate,
      mostPlayedGames,
      playtimeDistribution,
      topGenres,
      insights
    };
  }, [libraryGames]);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Top Row - Main Stats */}
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
                    <Gamepad2 className="h-5 w-5 text-unplayed-amber" />
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.completionRate}%</p>
                      <p className="text-sm text-gray-400">Completion Rate</p>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Percentage of games you've started playing</p>
                </TooltipContent>
              </Tooltip>
            </CardContent>
          </Card>
        </div>

        {/* Middle Row - Most Played & Playtime Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Most Played Games */}
          <Card className="bg-black/20 border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)] hover:shadow-[0_0_25px_rgba(163,247,191,0.2)] transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-unplayed-amber" />
                <span>Most Played Games</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.mostPlayedGames.length > 0 ? (
                stats.mostPlayedGames.map((game) => (
                  <div key={game.rank} className="flex items-center space-x-3 p-2 rounded-lg bg-black/30">
                    <div className="flex-shrink-0 w-8 h-8 bg-unplayed-amber rounded-full flex items-center justify-center">
                      <span className="text-black font-bold text-sm">#{game.rank}</span>
                    </div>
                    {game.image && (
                      <img 
                        src={game.image} 
                        alt={game.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{game.name}</p>
                      <p className="text-sm text-gray-400">{game.playtime}h played</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-4">No played games yet</p>
              )}
            </CardContent>
          </Card>

          {/* Playtime Distribution */}
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
                  <span className="text-white font-medium">Unplayed</span>
                  <span className="text-sm text-gray-400">{stats.playtimeDistribution.unplayed} games</span>
                </div>
                <Progress 
                  value={(stats.playtimeDistribution.unplayed / stats.totalGames) * 100} 
                  className="h-2"
                />
                
                <div className="flex justify-between items-center">
                  <span className="text-white font-medium">Light Play (&lt;2h)</span>
                  <span className="text-sm text-gray-400">{stats.playtimeDistribution.light} games</span>
                </div>
                <Progress 
                  value={(stats.playtimeDistribution.light / stats.totalGames) * 100} 
                  className="h-2"
                />
                
                <div className="flex justify-between items-center">
                  <span className="text-white font-medium">Moderate Play (2-10h)</span>
                  <span className="text-sm text-gray-400">{stats.playtimeDistribution.moderate} games</span>
                </div>
                <Progress 
                  value={(stats.playtimeDistribution.moderate / stats.totalGames) * 100} 
                  className="h-2"
                />
                
                <div className="flex justify-between items-center">
                  <span className="text-white font-medium">Heavy Play (10h+)</span>
                  <span className="text-sm text-gray-400">{stats.playtimeDistribution.heavy} games</span>
                </div>
                <Progress 
                  value={(stats.playtimeDistribution.heavy / stats.totalGames) * 100} 
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row - Activity Insights & Genre Galaxy */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Activity Insights */}
          <Card className="bg-black/20 border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)] hover:shadow-[0_0_25px_rgba(163,247,191,0.2)] transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-purple-400" />
                <span>Activity Insights</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.insights.map((insight, index) => (
                <div key={index} className="p-3 rounded-lg bg-black/30 border border-gray-700">
                  <p className="text-white text-sm">{insight}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Genre Galaxy */}
          <GenreGalaxy 
            genres={stats.topGenres}
            totalGames={stats.totalGames}
          />
        </div>
      </div>
    </TooltipProvider>
  );
};

export default LibraryOverview;
