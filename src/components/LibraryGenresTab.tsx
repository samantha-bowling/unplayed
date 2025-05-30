import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PcCase, TrendingUp, Award, Zap } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLibraryData } from '@/hooks/use-library-data';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, PieChart, Pie, Cell } from 'recharts';
import GenreWordCloud from './GenreWordCloud';

const LibraryGenresTab = () => {
  const { games: libraryGames } = useLibraryData();

  // Calculate genre statistics
  const genreStats = React.useMemo(() => {
    const genreCount: Record<string, { total: number; unplayed: number; played: number }> = {};
    
    libraryGames.forEach(game => {
      const genres = game.genres || [];
      const playtime = game.userGame?.playtime_minutes || 0;
      const isUnplayed = playtime === 0;
      
      genres.forEach(genre => {
        if (!genreCount[genre]) {
          genreCount[genre] = { total: 0, unplayed: 0, played: 0 };
        }
        genreCount[genre].total++;
        if (isUnplayed) {
          genreCount[genre].unplayed++;
        } else {
          genreCount[genre].played++;
        }
      });
    });

    return Object.entries(genreCount)
      .map(([genre, stats]) => ({
        genre,
        ...stats,
        unplayedPercentage: (stats.unplayed / stats.total) * 100
      }))
      .sort((a, b) => b.total - a.total);
  }, [libraryGames]);

  // Top genres by total games
  const topGenres = genreStats.slice(0, 10);
  
  // Top unplayed genres - limited to 3
  const topUnplayedGenres = genreStats
    .filter(g => g.unplayed > 0)
    .sort((a, b) => b.unplayed - a.unplayed)
    .slice(0, 3);
  
  // Most niche genres - limited to 3
  const nicheGenres = genreStats
    .filter(g => g.total >= 2) // At least 2 games to be considered
    .sort((a, b) => a.total - b.total)
    .slice(0, 3);
  
  // Most owned genre (replaces highest unplayed percentage)
  const mostOwnedGenre = genreStats.length > 0 ? genreStats[0] : null;

  // Chart data
  const chartData = topGenres.map(genre => ({
    name: genre.genre.length > 12 ? genre.genre.substring(0, 12) + '...' : genre.genre,
    total: genre.total,
    unplayed: genre.unplayed,
    played: genre.played
  }));

  const pieData = topUnplayedGenres.slice(0, 6).map((genre, index) => ({
    name: genre.genre,
    value: genre.unplayed,
    color: [
      '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'
    ][index % 6]
  }));

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Info Banner */}
        <div className="bg-unplayed-mint/10 border border-unplayed-mint/20 rounded-lg p-4">
          <p className="text-sm text-unplayed-mint">
            📊 Note: Games can belong to multiple genres, so totals may exceed your library size. Genre data comes from Steam's classification system.
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-black/20 border border-gray-700">
            <CardContent className="p-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-2 cursor-help">
                    <PcCase className="h-5 w-5 text-unplayed-mint" />
                    <div>
                      <p className="text-2xl font-bold text-white">{genreStats.length}</p>
                      <p className="text-sm text-gray-400">Total Genres</p>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Number of different genres in your library</p>
                </TooltipContent>
              </Tooltip>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border border-gray-700">
            <CardContent className="p-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-2 cursor-help">
                    <TrendingUp className="h-5 w-5 text-blue-400" />
                    <div>
                      <p className="text-2xl font-bold text-white">{topGenres[0]?.genre || 'N/A'}</p>
                      <p className="text-sm text-gray-400">Most Popular</p>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Genre with the most games in your library</p>
                </TooltipContent>
              </Tooltip>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border border-gray-700">
            <CardContent className="p-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-2 cursor-help">
                    <Award className="h-5 w-5 text-unplayed-amber" />
                    <div>
                      <p className="text-2xl font-bold text-white">{nicheGenres[0]?.genre || 'N/A'}</p>
                      <p className="text-sm text-gray-400">Most Niche</p>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Genre with the fewest games (minimum 2 games)</p>
                </TooltipContent>
              </Tooltip>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border border-gray-700">
            <CardContent className="p-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-2 cursor-help">
                    <Zap className="h-5 w-5 text-unplayed-red" />
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {mostOwnedGenre?.total || 0}
                      </p>
                      <p className="text-sm text-gray-400">Most Owned Genre</p>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Number of games in your most collected genre: {mostOwnedGenre?.genre || 'N/A'}</p>
                </TooltipContent>
              </Tooltip>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Genre Distribution Bar Chart */}
          <Card className="bg-black/20 border border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PcCase className="h-5 w-5 text-unplayed-mint" />
                <span>Top Genres Distribution</span>
                <Tooltip>
                  <TooltipTrigger>
                    <span className="text-xs text-gray-400 cursor-help">ⓘ</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Shows played vs unplayed games for your top 10 genres</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fill: '#9ca3af' }} />
                    <RechartsTooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e1e1e', 
                        borderColor: '#374151',
                        borderRadius: '0.5rem' 
                      }}
                    />
                    <Bar dataKey="unplayed" stackId="a" fill="#ef4444" name="Unplayed" />
                    <Bar dataKey="played" stackId="a" fill="#22c55e" name="Played" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Unplayed Games by Genre Pie Chart - No hover */}
          <Card className="bg-black/20 border border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-unplayed-red" />
                <span>Unplayed Games by Genre</span>
                <Tooltip>
                  <TooltipTrigger>
                    <span className="text-xs text-gray-400 cursor-help">ⓘ</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Distribution of your unplayed games across top genres</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Genre Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top unplayed Genres */}
          <Card className="bg-black/20 border border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-unplayed-red" />
                <span>Top unplayed Genres</span>
                <Tooltip>
                  <TooltipTrigger>
                    <span className="text-xs text-gray-400 cursor-help">ⓘ</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Top 3 genres with the most unplayed games in your library</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topUnplayedGenres.map((genre, index) => (
                  <div key={genre.genre} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="text-xs">
                        #{index + 1}
                      </Badge>
                      <span className="text-white">{genre.genre}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-unplayed-red font-mono">{genre.unplayed}</span>
                      <span className="text-gray-400 text-sm">/{genre.total}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Most Niche Genres */}
          <Card className="bg-black/20 border border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-unplayed-amber" />
                <span>Most Niche Genres</span>
                <Tooltip>
                  <TooltipTrigger>
                    <span className="text-xs text-gray-400 cursor-help">ⓘ</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Top 3 genres with the smallest representation in your library</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {nicheGenres.map((genre, index) => (
                  <div key={genre.genre} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="text-xs">
                        #{index + 1}
                      </Badge>
                      <span className="text-white">{genre.genre}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-unplayed-amber font-mono">{genre.total}</span>
                      <span className="text-gray-400 text-sm"> games</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Genre Word Cloud */}
        <GenreWordCloud />
      </div>
    </TooltipProvider>
  );
};

export default LibraryGenresTab;
