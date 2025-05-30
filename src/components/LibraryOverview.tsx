
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, Trophy, TrendingUp, Calendar, Users, Gamepad2, Star, Target, DollarSign, Zap, HelpCircle } from 'lucide-react';
import { useLibraryData } from '@/hooks/use-library-data';
import { getBestGameImageFromDbData } from '@/utils/image-utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const LibraryOverview = () => {
  const { games: libraryGames, isLoading } = useLibraryData();

  if (isLoading) {
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

  // Calculate all statistics from real library data
  const totalGames = libraryGames.length;
  const playedGames = libraryGames.filter(game => {
    const playtime = game.userGame?.playtime_minutes || 0;
    return playtime > 0;
  });
  const unplayedGames = totalGames - playedGames.length;
  
  // Calculate completion rate
  const completionRate = totalGames > 0 ? Math.round((playedGames.length / totalGames) * 100) : 0;

  // Get top 3 most played games
  const topPlayedGames = [...playedGames]
    .sort((a, b) => {
      const playtimeA = a.userGame?.playtime_minutes || 0;
      const playtimeB = b.userGame?.playtime_minutes || 0;
      return playtimeB - playtimeA;
    })
    .slice(0, 3);

  // Calculate total playtime
  const totalPlaytimeMinutes = libraryGames.reduce((total, game) => {
    const playtime = game.userGame?.playtime_minutes || 0;
    return total + playtime;
  }, 0);
  const totalPlaytimeHours = Math.round(totalPlaytimeMinutes / 60);

  // Calculate games with recent activity (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentlyActiveGames = libraryGames.filter(game => {
    const lastPlayed = game.userGame?.last_played_date;
    if (!lastPlayed) return false;
    return new Date(lastPlayed) >= thirtyDaysAgo;
  }).length;

  // Calculate Value Champion (best playtime-to-price ratio)
  const calculateValueChampion = () => {
    const gamesWithPriceAndPlaytime = playedGames.filter(game => {
      const playtime = game.userGame?.playtime_minutes || 0;
      const price = game.price_cents || 0;
      return playtime > 0 && price > 0;
    });

    if (gamesWithPriceAndPlaytime.length === 0) return null;

    const valueChampion = gamesWithPriceAndPlaytime.reduce((best, game) => {
      const playtime = game.userGame?.playtime_minutes || 0;
      const price = game.price_cents || 0;
      const valueRatio = playtime / (price / 100); // minutes per dollar
      
      const bestPlaytime = best.userGame?.playtime_minutes || 0;
      const bestPrice = best.price_cents || 0;
      const bestRatio = bestPlaytime / (bestPrice / 100);
      
      return valueRatio > bestRatio ? game : best;
    });

    const championPlaytime = valueChampion.userGame?.playtime_minutes || 0;
    const championPrice = valueChampion.price_cents || 0;
    const ratio = championPlaytime / (championPrice / 100);
    
    return {
      game: valueChampion,
      ratio: Math.round(ratio * 10) / 10 // Round to 1 decimal
    };
  };

  // Calculate Quick vs Deep gaming style
  const calculateGamingStyle = () => {
    if (playedGames.length === 0) return { style: 'No Data', percentage: 0 };

    const shortSessions = playedGames.filter(game => {
      const playtime = game.userGame?.playtime_minutes || 0;
      return playtime > 0 && playtime < 120; // Less than 2 hours
    }).length;

    const longSessions = playedGames.filter(game => {
      const playtime = game.userGame?.playtime_minutes || 0;
      return playtime >= 300; // 5+ hours
    }).length;

    if (longSessions > shortSessions) {
      return { 
        style: 'Deep Diver', 
        percentage: Math.round((longSessions / playedGames.length) * 100)
      };
    } else if (shortSessions > longSessions) {
      return { 
        style: 'Quick Explorer', 
        percentage: Math.round((shortSessions / playedGames.length) * 100)
      };
    } else {
      return { 
        style: 'Balanced', 
        percentage: 50
      };
    }
  };

  const valueChampion = calculateValueChampion();
  const gamingStyle = calculateGamingStyle();

  // Calculate playtime distribution
  const playtimeDistribution = {
    unplayed: unplayedGames,
    light: playedGames.filter(game => {
      const playtime = game.userGame?.playtime_minutes || 0;
      return playtime > 0 && playtime < 120; // Less than 2 hours
    }).length,
    moderate: playedGames.filter(game => {
      const playtime = game.userGame?.playtime_minutes || 0;
      return playtime >= 120 && playtime < 600; // 2-10 hours
    }).length,
    heavy: playedGames.filter(game => {
      const playtime = game.userGame?.playtime_minutes || 0;
      return playtime >= 600; // 10+ hours
    }).length
  };

  // Get top genres
  const genreCount: Record<string, number> = {};
  libraryGames.forEach(game => {
    const genres = game.genres || [];
    genres.forEach(genre => {
      genreCount[genre] = (genreCount[genre] || 0) + 1;
    });
  });
  
  const topGenres = Object.entries(genreCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  // Helper function to format playtime
  const formatPlaytime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.round(minutes / 60);
    return `${hours}h`;
  };

  return (
    <TooltipProvider>
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
          <Card className="bg-black/20 border border-gray-700 flex flex-col h-full">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-unplayed-amber" />
                <span>Most Played Games</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center space-y-4">
              {topPlayedGames.length > 0 ? (
                topPlayedGames.map((game, index) => {
                  const playtime = game.userGame?.playtime_minutes || 0;
                  const gameImage = getBestGameImageFromDbData(game, game.id);
                  
                  return (
                    <div key={game.id} className="flex items-center space-x-3">
                      {/* Placement Badge */}
                      <div className="flex-shrink-0">
                        <Badge variant="outline" className="text-xs font-bold min-w-[32px] justify-center">
                          #{index + 1}
                        </Badge>
                      </div>
                      
                      {/* Game Image - 16:9 aspect ratio */}
                      <div className="flex-shrink-0">
                        <img 
                          src={gameImage || '/placeholder.svg'} 
                          alt={game.name}
                          className="w-16 h-9 rounded object-cover"
                          style={{ aspectRatio: '16/9' }}
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                        />
                      </div>
                      
                      {/* Game Name */}
                      <div className="flex-grow min-w-0">
                        <p className="text-white font-medium truncate">{game.name}</p>
                      </div>
                      
                      {/* Playtime */}
                      <div className="flex-shrink-0">
                        <p className="text-sm text-gray-400 font-medium">{formatPlaytime(playtime)}</p>
                      </div>
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

          {/* Activity Insights - Updated with new metrics */}
          <Card className="bg-black/20 border border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-green-400" />
                <span>Activity Insights</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-black/30 rounded">
                <div className="flex items-center space-x-2">
                  <div>
                    <p className="text-sm text-gray-400">Recently Active Games</p>
                    <p className="text-lg font-semibold text-white">{recentlyActiveGames}</p>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-gray-500 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Games you've played in the last 30 days</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Users className="h-6 w-6 text-green-400" />
              </div>
              
              <div className="flex justify-between items-center p-3 bg-black/30 rounded">
                <div className="flex items-center space-x-2">
                  <div>
                    <p className="text-sm text-gray-400">Value Champion</p>
                    <p className="text-lg font-semibold text-white">
                      {valueChampion ? `${valueChampion.ratio} min/$` : 'No Data'}
                    </p>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-gray-500 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Your best value game based on playtime per dollar spent. Shows which game gave you the most entertainment value for money.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <DollarSign className="h-6 w-6 text-blue-400" />
              </div>
              
              <div className="flex justify-between items-center p-3 bg-black/30 rounded">
                <div className="flex items-center space-x-2">
                  <div>
                    <p className="text-sm text-gray-400">Gaming Style</p>
                    <p className="text-lg font-semibold text-white">{gamingStyle.style}</p>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-gray-500 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Your gaming style based on session lengths. Quick Explorer: prefers shorter sessions (&lt;2h). Deep Diver: prefers longer sessions (5h+). Balanced: mix of both.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Zap className="h-6 w-6 text-purple-400" />
              </div>
              
              <div className="mt-4 p-3 bg-unplayed-mint/10 border border-unplayed-mint/20 rounded">
                <p className="text-sm text-unplayed-mint">
                  {recentlyActiveGames > 0 
                    ? `You've been active with ${recentlyActiveGames} games in the last 30 days. Keep it up!`
                    : "No recent activity detected. Time to dive into your library!"
                  }
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Top Genres */}
          <Card className="bg-black/20 border border-gray-700 flex flex-col h-full">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Gamepad2 className="h-5 w-5 text-purple-400" />
                <span>Top Genres</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center">
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
    </TooltipProvider>
  );
};

export default LibraryOverview;
