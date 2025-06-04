
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookMarked, TrendingUp, Award, SquarePlus, Pyramid, ChartColumnDecreasing, Pizza } from 'lucide-react';
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
  
  // Top unplayed genres - get up to 8 for pizza slices
  const topUnplayedGenres = genreStats
    .filter(g => g.unplayed > 0)
    .sort((a, b) => b.unplayed - a.unplayed)
    .slice(0, 8);
  
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

  // Enhanced pizza colors - more pizza-like with richer tones
  const pizzaColors = [
    '#dc2626', // Deep red (tomato sauce)
    '#f97316', // Bright orange (cheddar cheese)
    '#facc15', // Golden yellow (mozzarella)
    '#16a34a', // Fresh green (basil/peppers)
    '#8b5a2b', // Rich brown (pepperoni/sausage)
    '#eab308', // Golden amber (extra cheese)
    '#b91c1c', // Dark red (marinara)
    '#15803d'  // Deep green (herbs/olives)
  ];

  // Create exactly 8 pizza slices
  const pieData = [];
  
  // Add actual unplayed genres up to 7 slices
  const actualSlices = topUnplayedGenres.slice(0, 7);
  actualSlices.forEach((genre, index) => {
    pieData.push({
      name: genre.genre,
      value: genre.unplayed,
      color: pizzaColors[index % pizzaColors.length]
    });
  });

  // Calculate "Other" slice from remaining unplayed genres
  const otherUnplayedCount = topUnplayedGenres.slice(7).reduce((sum, genre) => sum + genre.unplayed, 0);
  
  // Add "Other" slice (even if 0 to maintain pizza appearance)
  pieData.push({
    name: 'Other',
    value: otherUnplayedCount,
    color: pizzaColors[7]
  });

  // If we have fewer than 8 slices, pad with small empty slices for visual appeal
  while (pieData.length < 8) {
    pieData.push({
      name: 'Crust',
      value: 1, // Small value to show slice
      color: '#d4a574' // Crust color
    });
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Info Banner */}
        <div className="bg-unplayed-mint/10 border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)] rounded-lg p-4">
          <p className="text-sm text-unplayed-mint">
            📊 Note: Games can belong to multiple genres, so totals may exceed your library size. Genre data comes from Steam's classification system.
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-black/20 border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)] hover:shadow-[0_0_25px_rgba(163,247,191,0.2)] transition-all duration-300">
            <CardContent className="p-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-2 cursor-help">
                    <BookMarked className="h-5 w-5 text-unplayed-mint" />
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

          <Card className="bg-black/20 border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)] hover:shadow-[0_0_25px_rgba(163,247,191,0.2)] transition-all duration-300">
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

          <Card className="bg-black/20 border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)] hover:shadow-[0_0_25px_rgba(163,247,191,0.2)] transition-all duration-300">
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

          <Card className="bg-black/20 border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)] hover:shadow-[0_0_25px_rgba(163,247,191,0.2)] transition-all duration-300">
            <CardContent className="p-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-2 cursor-help">
                    <SquarePlus className="h-5 w-5 text-unplayed-red" />
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
          {/* Genre Distribution Bar Chart - Updated icon and color */}
          <Card className="bg-black/20 border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)] hover:shadow-[0_0_25px_rgba(163,247,191,0.2)] transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ChartColumnDecreasing className="h-5 w-5 text-purple-500" />
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

          {/* unplayed Pizza - Updated with no inner radius and enhanced styling */}
          <Card className="bg-black/20 border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)] hover:shadow-[0_0_25px_rgba(163,247,191,0.2)] transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Pizza className="h-5 w-5 text-orange-500" />
                <span>unplayed Pizza</span>
                <Tooltip>
                  <TooltipTrigger>
                    <span className="text-xs text-gray-400 cursor-help">ⓘ</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Mmm, pizza...</p>
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
                      outerRadius={90}
                      innerRadius={0}
                      dataKey="value"
                      label={({ name, value }) => value > 1 ? `${name}: ${value}` : ''}
                      stroke="#1f2937"
                      strokeWidth={3}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`slice-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e1e1e', 
                        borderColor: '#374151',
                        borderRadius: '0.5rem' 
                      }}
                      formatter={(value, name) => [`${value} games`, `${name} slice`]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Genre Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Unplayed Genres */}
          <Card className="bg-black/20 border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)] hover:shadow-[0_0_25px_rgba(163,247,191,0.2)] transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Pyramid className="h-5 w-5 text-unplayed-red" />
                <span>Top Unplayed Genres</span>
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
                {topUnplayedGenres.slice(0, 3).map((genre, index) => (
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
          <Card className="bg-black/20 border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)] hover:shadow-[0_0_25px_rgba(163,247,191,0.2)] transition-all duration-300">
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

        {/* Genre Word Cloud - removed double container */}
        <GenreWordCloud />
      </div>
    </TooltipProvider>
  );
};

export default LibraryGenresTab;
