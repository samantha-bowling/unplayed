
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, Trophy, TrendingUp, Calendar, Users, Gamepad2, Star, Target } from 'lucide-react';
import { useLibraryData } from '@/hooks/use-library-data';
import { useDemoMode } from '@/context/DemoModeContext';
import { DEMO_DATA } from '@/lib/demo-data';
import { getBestGameImageFromDbData } from '@/utils/image-utils';

const LibraryOverview = () => {
  const { games: libraryGames, isLoading } = useLibraryData();
  const { isDemo } = useDemoMode();

  // Use demo data if in demo mode, otherwise use real library data
  const games = isDemo ? DEMO_DATA.gamesList || [] : libraryGames;

  if (isLoading && !isDemo) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="bg-black/20 border border-gray-700">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-700 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Calculate all statistics from real data
  const totalGames = games.length;
  const playedGames = games.filter(game => {
    const playtime = isDemo ? game.playtime : (game.userGame?.playtime_minutes || 0);
    return playtime > 0;
  });
  const unplayedGames = totalGames - playedGames.length;
  
  // Calculate completion rate
  const completionRate = totalGames > 0 ? Math.round((playedGames.length / totalGames) * 100) : 0;

  // Get top 3 most played games
  const topPlayedGames = [...playedGames]
    .sort((a, b) => {
      const playtimeA = isDemo ? (a.playtime || 0) : (a.userGame?.playtime_minutes || 0);
      const playtimeB = isDemo ? (b.playtime || 0) : (b.userGame?.playtime_minutes || 0);
      return playtimeB - playtimeA;
    })
    .slice(0, 3);

  // Calculate total playtime
  const totalPlaytimeMinutes = games.reduce((total, game) => {
    const playtime = isDemo ? (game.playtime || 0) : (game.userGame?.playtime_minutes || 0);
    return total + playtime;
  }, 0);
  const totalPlaytimeHours = Math.round(totalPlaytimeMinutes / 60);

  // Calculate games with recent activity (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentlyActiveGames = games.filter(game => {
    const lastPlayed = isDemo ? null : game.userGame?.last_played_date;
    if (!lastPlayed) return false;
    return new Date(lastPlayed) >= thirtyDaysAgo;
  }).length;

  // Calculate playtime distribution
  const playtimeDistribution = {
    unplayed: unplayedGames,
    light: playedGames.filter(game => {
      const playtime = isDemo ? (game.playtime || 0) : (game.userGame?.playtime_minutes || 0);
      return playtime > 0 && playtime < 120; // Less than 2 hours
    }).length,
    moderate: playedGames.filter(game => {
      const playtime = isDemo ? (game.playtime || 0) : (game.userGame?.playtime_minutes || 0);
      return playtime >= 120 && playtime < 600; // 2-10 hours
    }).length,
    heavy: playedGames.filter(game => {
      const playtime = isDemo ? (game.playtime || 0) : (game.userGame?.playtime_minutes || 0);
      return playtime >= 600; // 10+ hours
    }).length
  };

  // Get top genres
  const genreCount: Record<string, number> = {};
  games.forEach(game => {
    const genres = game.genres || [];
    genres.forEach(genre => {
      genreCount[genre] = (genreCount[genre] || 0) + 1;
    });
  });
  
  const topGenres = Object.entries(genreCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  // Calculate average session length for played games
  const averageSessionLength = playedGames.length > 0 
    ? Math.round(totalPlaytimeMinutes / playedGames.length) 
    : 0;

  // Helper function to format playtime
  const formatPlaytime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.round(minutes / 60);
    return `${hours}h`;
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-black/20 border border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Gamepad2 className="h-5 w-5 text-unplayed-mint" />
              <div>
                <p className="text-2xl font-bold text-white">{totalGames}</p>
                <p className="text-sm text-gray-400">Total Games</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/20 border border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-white">{playedGames.length}</p>
                <p className="text-sm text-gray-400">Games Played</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/20 border border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-white">{totalPlaytimeHours}h</p>
                <p className="text-sm text-gray-400">Total Playtime</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/20 border border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-unplayed-amber" />
              <div>
                <p className="text-2xl font-bold text-white">{completionRate}%</p>
                <p className="text-sm text-gray-400">Completion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Played Games */}
        <Card className="bg-black/20 border border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-unplayed-amber" />
              <span>Most Played Games</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topPlayedGames.length > 0 ? (
              topPlayedGames.map((game, index) => {
                const playtime = isDemo ? (game.playtime || 0) : (game.userGame?.playtime_minutes || 0);
                const gameName = game.name;
                const gameImage = isDemo ? game.image : getBestGameImageFromDbData(game, game.id);
                
                return (
                  <div key={game.id} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <img 
                        src={gameImage || '/placeholder.svg'} 
                        alt={gameName}
                        className="w-12 h-12 rounded object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-white font-medium truncate">{gameName}</p>
                      <p className="text-sm text-gray-400">{formatPlaytime(playtime)}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      #{index + 1}
                    </Badge>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-400 text-center py-4">No games played yet. Start playing to see your top games!</p>
            )}
          </CardContent>
        </Card>

        {/* Playtime Distribution */}
        <Card className="bg-black/20 border border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-400" />
              <span>Playtime Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Unplayed</span>
                <span className="text-sm font-medium text-white">{playtimeDistribution.unplayed}</span>
              </div>
              <Progress 
                value={(playtimeDistribution.unplayed / totalGames) * 100} 
                className="h-2"
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Light Play (&lt;2h)</span>
                <span className="text-sm font-medium text-white">{playtimeDistribution.light}</span>
              </div>
              <Progress 
                value={(playtimeDistribution.light / totalGames) * 100} 
                className="h-2"
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Moderate Play (2-10h)</span>
                <span className="text-sm font-medium text-white">{playtimeDistribution.moderate}</span>
              </div>
              <Progress 
                value={(playtimeDistribution.moderate / totalGames) * 100} 
                className="h-2"
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Heavy Play (10h+)</span>
                <span className="text-sm font-medium text-white">{playtimeDistribution.heavy}</span>
              </div>
              <Progress 
                value={(playtimeDistribution.heavy / totalGames) * 100} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Activity Insights */}
        <Card className="bg-black/20 border border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-green-400" />
              <span>Activity Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-black/30 rounded">
              <div>
                <p className="text-sm text-gray-400">Recently Active Games</p>
                <p className="text-lg font-semibold text-white">{recentlyActiveGames}</p>
              </div>
              <Users className="h-6 w-6 text-green-400" />
            </div>
            
            <div className="flex justify-between items-center p-3 bg-black/30 rounded">
              <div>
                <p className="text-sm text-gray-400">Average Session</p>
                <p className="text-lg font-semibold text-white">{formatPlaytime(averageSessionLength)}</p>
              </div>
              <Clock className="h-6 w-6 text-blue-400" />
            </div>
            
            {!isDemo && (
              <div className="mt-4 p-3 bg-unplayed-mint/10 border border-unplayed-mint/20 rounded">
                <p className="text-sm text-unplayed-mint">
                  {recentlyActiveGames > 0 
                    ? `You've been active with ${recentlyActiveGames} games in the last 30 days. Keep it up!`
                    : "No recent activity detected. Time to dive into your library!"
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Genres */}
        <Card className="bg-black/20 border border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Gamepad2 className="h-5 w-5 text-purple-400" />
              <span>Top Genres</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topGenres.length > 0 ? (
              <div className="space-y-3">
                {topGenres.map(([genre, count]) => (
                  <div key={genre} className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">{genre}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-white">{count}</span>
                      <div className="w-16 bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-purple-400 h-2 rounded-full" 
                          style={{ width: `${(count / totalGames) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-4">No genre data available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LibraryOverview;
