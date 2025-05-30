
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Gamepad2, TrendingUp, Award, Zap } from 'lucide-react';
import { useLibraryData } from '@/hooks/use-library-data';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, PieChart, Pie, Cell } from 'recharts';

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
  
  // Top unplayed genres
  const topUnplayedGenres = genreStats
    .filter(g => g.unplayed > 0)
    .sort((a, b) => b.unplayed - a.unplayed)
    .slice(0, 8);
  
  // Most niche genres (genres with least games)
  const nicheGenres = genreStats
    .filter(g => g.total >= 2) // At least 2 games to be considered
    .sort((a, b) => a.total - b.total)
    .slice(0, 6);
  
  // Genres with highest unplayed percentage
  const highestUnplayedRate = genreStats
    .filter(g => g.total >= 3) // At least 3 games for meaningful percentage
    .sort((a, b) => b.unplayedPercentage - a.unplayedPercentage)
    .slice(0, 6);

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

  const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-black/20 border border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Gamepad2 className="h-5 w-5 text-unplayed-mint" />
              <div>
                <p className="text-2xl font-bold text-white">{genreStats.length}</p>
                <p className="text-sm text-gray-400">Total Genres</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/20 border border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-white">{topGenres[0]?.genre || 'N/A'}</p>
                <p className="text-sm text-gray-400">Most Popular</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/20 border border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-unplayed-amber" />
              <div>
                <p className="text-2xl font-bold text-white">{nicheGenres[0]?.genre || 'N/A'}</p>
                <p className="text-sm text-gray-400">Most Niche</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/20 border border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-unplayed-red" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {Math.round(highestUnplayedRate[0]?.unplayedPercentage || 0)}%
                </p>
                <p className="text-sm text-gray-400">Highest Unplayed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Genre Distribution Bar Chart */}
        <Card className="bg-black/20 border border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Gamepad2 className="h-5 w-5 text-unplayed-mint" />
              <span>Top Genres Distribution</span>
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

        {/* Unplayed Games by Genre Pie Chart */}
        <Card className="bg-black/20 border border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-unplayed-red" />
              <span>Unplayed Games by Genre</span>
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
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e1e1e', 
                      borderColor: '#374151',
                      borderRadius: '0.5rem' 
                    }}
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
        <Card className="bg-black/20 border border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-unplayed-red" />
              <span>Top Unplayed Genres</span>
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

      {/* Genres with Highest Unplayed Rate */}
      <Card className="bg-black/20 border border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-blue-400" />
            <span>Genres with Highest Unplayed Rate</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {highestUnplayedRate.map((genre) => (
              <div key={genre.genre} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-white font-medium">{genre.genre}</span>
                  <span className="text-sm text-gray-400">
                    {Math.round(genre.unplayedPercentage)}% unplayed
                  </span>
                </div>
                <Progress 
                  value={genre.unplayedPercentage} 
                  className="h-2"
                />
                <div className="text-xs text-gray-500">
                  {genre.unplayed} unplayed of {genre.total} total games
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LibraryGenresTab;
