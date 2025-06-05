
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GamepadIcon, Clock, Trophy, Star, Activity, Calendar, Gamepad2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLibraryData } from '@/hooks/use-library-data';
import { useUserMetrics } from '@/hooks/use-user-metrics';
import GenreGalaxy from '@/components/GenreGalaxy';
import HiddenGems from '@/components/HiddenGems';

// Enhanced playtime tier definitions with heat map text colors
const PLAYTIME_TIERS = [
  {
    name: "Curiosity Killed",
    range: "0-5h",
    min: 0,
    max: 5,
    color: "bg-gray-500", // Keep for reference but won't use for progress bars
    textColor: "text-blue-300", // Cool blue for low playtime
    description: "Just a quick peek... or so you thought"
  },
  {
    name: "Weekend Warrior",
    range: "5-25h", 
    min: 5,
    max: 25,
    color: "bg-blue-500",
    textColor: "text-blue-400", // Slightly warmer blue
    description: "Casual gaming sessions when you have time"
  },
  {
    name: "Getting Serious",
    range: "25-100h",
    min: 25,
    max: 100,
    color: "bg-green-500",
    textColor: "text-green-400", // Medium intensity green
    description: "This game has caught your attention"
  },
  {
    name: "No Life Territory",
    range: "100-500h",
    min: 100,
    max: 500,
    color: "bg-yellow-500",
    textColor: "text-yellow-400", // Getting warmer with yellow
    description: "What's sunlight again?"
  },
  {
    name: "Send Help",
    range: "500-1000h",
    min: 500,
    max: 1000,
    color: "bg-orange-500",
    textColor: "text-orange-400", // Warm orange for high playtime
    description: "Friends and family are concerned"
  },
  {
    name: "Ascended",
    range: "1000-5000h",
    min: 1000,
    max: 5000,
    color: "bg-red-500",
    textColor: "text-red-400", // Hot red for very high playtime
    description: "You've transcended mere mortal gaming"
  },
  {
    name: "Legendary Status",
    range: "5000+ hours",
    min: 5000,
    max: Infinity,
    color: "bg-purple-500",
    textColor: "text-purple-400", // Extreme heat with purple
    description: "Gaming deity - others worship your Steam profile"
  }
];

const LibraryOverview = () => {
  const { games: libraryGames } = useLibraryData();
  const { data: userMetrics } = useUserMetrics();

  // Calculate overview statistics
  const stats = React.useMemo(() => {
    // Use userMetrics for top-level stats to ensure consistency with dashboard
    const totalGames = userMetrics?.totalGames || 0;
    const playedGames = userMetrics?.playedGames || 0;
    const unplayedGames = userMetrics?.unplayedGames || 0;
    const totalPlaytimeHours = userMetrics?.totalPlaytimeHours || 0;

    // Calculate completion rate
    const completionRate = totalGames > 0 ? Math.round((playedGames / totalGames) * 100) : 0;

    // Get most played games (top 3) - use libraryGames for detailed data
    const playedGamesList = libraryGames.filter(game => {
      const playtime = game.userGame?.playtime_minutes || 0;
      return playtime > 0;
    });
    
    const mostPlayedGames = playedGamesList
      .sort((a, b) => (b.userGame?.playtime_minutes || 0) - (a.userGame?.playtime_minutes || 0))
      .slice(0, 3)
      .map((game, index) => ({
        rank: index + 1,
        name: game.name,
        playtime: Math.round((game.userGame?.playtime_minutes || 0) / 60),
        image: game.header_image || game.image_url
      }));

    // Calculate enhanced playtime distribution using new 7-tier system
    const playtimeDistribution = PLAYTIME_TIERS.map(tier => ({
      ...tier,
      count: 0
    }));

    // Add unplayed games as a special case (they don't fit in the hour-based tiers)
    const unplayedTier = {
      name: "Unplayed",
      range: "0h",
      min: 0,
      max: 0,
      color: "bg-gray-600",
      textColor: "text-gray-400", // Cool gray for unplayed
      description: "Games sitting in your library, waiting patiently",
      count: unplayedGames
    };

    // Categorize played games into tiers
    playedGamesList.forEach(game => {
      const hours = (game.userGame?.playtime_minutes || 0) / 60;
      
      // Find the appropriate tier for this game
      for (const tier of playtimeDistribution) {
        if (hours >= tier.min && (tier.max === Infinity || hours < tier.max)) {
          tier.count++;
          break;
        }
      }
    });

    // Filter out tiers with 0 games and add unplayed if it has games
    const activeTiers = [];
    if (unplayedTier.count > 0) {
      activeTiers.push(unplayedTier);
    }
    activeTiers.push(...playtimeDistribution.filter(tier => tier.count > 0));

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

    return {
      totalGames,
      playedGames,
      unplayedGames,
      totalPlaytimeHours,
      completionRate,
      mostPlayedGames,
      playtimeDistribution: activeTiers,
      topGenres
    };
  }, [libraryGames, userMetrics]);

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
                      <div className="w-16 h-9 flex-shrink-0">
                        <img 
                          src={game.image} 
                          alt={game.name}
                          className="w-full h-full object-cover rounded aspect-video"
                        />
                      </div>
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

          {/* Enhanced Playtime Distribution with Heat Map Tier Titles */}
          <Card className="bg-black/20 border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)] hover:shadow-[0_0_25px_rgba(163,247,191,0.2)] transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-blue-400" />
                <span>Playtime Distribution</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-3 pr-4">
                  {stats.playtimeDistribution.map((tier, index) => (
                    <div key={tier.name} className="space-y-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex justify-between items-center cursor-help">
                            <div>
                              <span className={`font-medium ${tier.textColor}`}>{tier.name}</span>
                              <span className="text-sm text-gray-400 ml-2">({tier.range})</span>
                            </div>
                            <span className="text-sm text-gray-400">{tier.count} games</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-xs">
                          <p className="font-medium">{tier.name}</p>
                          <p className="text-xs text-gray-300">{tier.description}</p>
                        </TooltipContent>
                      </Tooltip>
                      <Progress 
                        value={(tier.count / stats.totalGames) * 100} 
                        className="h-2"
                      />
                    </div>
                  ))}
                  
                  {stats.playtimeDistribution.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <p>No playtime data available</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row - Hidden Gems & Genre Galaxy */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hidden Gems - replaces Activity Insights */}
          <HiddenGems />

          {/* Genre Galaxy with proper glow effects */}
          <div className="bg-black/20 border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)] hover:shadow-[0_0_25px_rgba(163,247,191,0.2)] transition-all duration-300 rounded-lg">
            <GenreGalaxy 
              genres={stats.topGenres}
              totalGames={stats.totalGames}
            />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default LibraryOverview;
