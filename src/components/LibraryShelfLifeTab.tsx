
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, TrendingDown, Archive } from 'lucide-react';
import { useLibraryData } from '@/hooks/use-library-data';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, LineChart, Line } from 'recharts';
import ShelfLife from '@/components/ShelfLife';

const LibraryShelfLifeTab = () => {
  const { games: libraryGames } = useLibraryData();

  // Calculate decade statistics
  const decadeStats = React.useMemo(() => {
    const decades: Record<string, { total: number; unplayed: number; played: number }> = {};
    
    libraryGames.forEach(game => {
      if (!game.release_date) return;
      
      const year = new Date(game.release_date).getFullYear();
      const decade = Math.floor(year / 10) * 10;
      const decadeLabel = `${decade}s`;
      
      const playtime = game.userGame?.playtime_minutes || 0;
      const isUnplayed = playtime === 0;
      
      if (!decades[decadeLabel]) {
        decades[decadeLabel] = { total: 0, unplayed: 0, played: 0 };
      }
      
      decades[decadeLabel].total++;
      if (isUnplayed) {
        decades[decadeLabel].unplayed++;
      } else {
        decades[decadeLabel].played++;
      }
    });

    return Object.entries(decades)
      .map(([decade, stats]) => ({
        decade,
        ...stats,
        unplayedPercentage: (stats.unplayed / stats.total) * 100
      }))
      .sort((a, b) => a.decade.localeCompare(b.decade));
  }, [libraryGames]);

  // Calculate acquisition timeline
  const acquisitionStats = React.useMemo(() => {
    const months: Record<string, { total: number; unplayed: number }> = {};
    
    libraryGames.forEach(game => {
      if (!game.userGame?.acquisition_date) return;
      
      const date = new Date(game.userGame.acquisition_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const playtime = game.userGame?.playtime_minutes || 0;
      const isUnplayed = playtime === 0;
      
      if (!months[monthKey]) {
        months[monthKey] = { total: 0, unplayed: 0 };
      }
      
      months[monthKey].total++;
      if (isUnplayed) {
        months[monthKey].unplayed++;
      }
    });

    return Object.entries(months)
      .map(([month, stats]) => ({
        month,
        ...stats,
        date: new Date(month + '-01')
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(-12); // Last 12 months
  }, [libraryGames]);

  // Calculate age distribution
  const ageDistribution = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    const ageGroups = {
      'Brand New (0-1 years)': 0,
      'Recent (1-3 years)': 0,
      'Modern (3-7 years)': 0,
      'Mature (7-15 years)': 0,
      'Retro (15+ years)': 0
    };

    libraryGames.forEach(game => {
      if (!game.release_date) return;
      
      const releaseYear = new Date(game.release_date).getFullYear();
      const age = currentYear - releaseYear;
      const playtime = game.userGame?.playtime_minutes || 0;
      
      if (playtime === 0) { // Only count unplayed games
        if (age <= 1) ageGroups['Brand New (0-1 years)']++;
        else if (age <= 3) ageGroups['Recent (1-3 years)']++;
        else if (age <= 7) ageGroups['Modern (3-7 years)']++;
        else if (age <= 15) ageGroups['Mature (7-15 years)']++;
        else ageGroups['Retro (15+ years)']++;
      }
    });

    return Object.entries(ageGroups).map(([group, count]) => ({
      group,
      count
    }));
  }, [libraryGames]);

  // Calculate shelf life insights
  const shelfLifeInsights = React.useMemo(() => {
    const unplayedGames = libraryGames.filter(game => 
      (game.userGame?.playtime_minutes || 0) === 0
    );
    
    const gamesWithAcquisitionDate = unplayedGames.filter(game => 
      game.userGame?.acquisition_date
    );
    
    if (gamesWithAcquisitionDate.length === 0) return null;
    
    const currentDate = new Date();
    const shelfDays = gamesWithAcquisitionDate.map(game => {
      const acquisitionDate = new Date(game.userGame!.acquisition_date!);
      return Math.floor((currentDate.getTime() - acquisitionDate.getTime()) / (1000 * 60 * 60 * 24));
    });
    
    const averageShelfLife = Math.round(shelfDays.reduce((sum, days) => sum + days, 0) / shelfDays.length);
    const oldestShelfLife = Math.max(...shelfDays);
    const newestShelfLife = Math.min(...shelfDays);
    
    return {
      averageShelfLife,
      oldestShelfLife,
      newestShelfLife,
      totalUnplayed: unplayedGames.length
    };
  }, [libraryGames]);

  const formatDays = (days: number) => {
    if (days < 30) return `${days} days`;
    if (days < 365) return `${Math.round(days / 30)} months`;
    return `${Math.round(days / 365)} years`;
  };

  return (
    <div className="space-y-6">
      {/* Shelf Life Insights Cards */}
      {shelfLifeInsights && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-black/20 border border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-unplayed-mint" />
                <div>
                  <p className="text-2xl font-bold text-white">
                    {formatDays(shelfLifeInsights.averageShelfLife)}
                  </p>
                  <p className="text-sm text-gray-400">Average Shelf Life</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Archive className="h-5 w-5 text-unplayed-red" />
                <div>
                  <p className="text-2xl font-bold text-white">
                    {formatDays(shelfLifeInsights.oldestShelfLife)}
                  </p>
                  <p className="text-sm text-gray-400">Oldest Unplayed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-green-400" />
                <div>
                  <p className="text-2xl font-bold text-white">
                    {formatDays(shelfLifeInsights.newestShelfLife)}
                  </p>
                  <p className="text-sm text-gray-400">Newest Addition</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingDown className="h-5 w-5 text-unplayed-amber" />
                <div>
                  <p className="text-2xl font-bold text-white">
                    {shelfLifeInsights.totalUnplayed}
                  </p>
                  <p className="text-sm text-gray-400">Total Unplayed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Games by Decade */}
        <Card className="bg-black/20 border border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-unplayed-mint" />
              <span>Games by Release Decade</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={decadeStats}>
                  <XAxis dataKey="decade" tick={{ fill: '#9ca3af' }} />
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

        {/* Acquisition Timeline */}
        <Card className="bg-black/20 border border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingDown className="h-5 w-5 text-blue-400" />
              <span>Recent Acquisition Timeline</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={acquisitionStats}>
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    tickFormatter={(value) => new Date(value + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                  />
                  <YAxis tick={{ fill: '#9ca3af' }} />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e1e1e', 
                      borderColor: '#374151',
                      borderRadius: '0.5rem' 
                    }}
                    labelFormatter={(value) => new Date(value + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#22c55e" 
                    strokeWidth={2}
                    name="Total Added"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="unplayed" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    name="Still Unplayed"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Age Distribution */}
      <Card className="bg-black/20 border border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Archive className="h-5 w-5 text-unplayed-amber" />
            <span>Unplayed Games by Age</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {ageDistribution.map((group) => (
              <div key={group.group} className="text-center p-4 bg-black/30 rounded-lg">
                <div className="text-2xl font-bold text-white mb-2">
                  {group.count}
                </div>
                <div className="text-sm text-gray-400">
                  {group.group}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Original Shelf Life Component */}
      <Card className="bg-black/20 border border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-unplayed-pink" />
            <span>Longest Shelf Life Games</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ShelfLife 
            onJumpToGame={(gameId) => console.log('Jump to game:', gameId)}
            onMarkAsPlayed={(gameId) => console.log('Mark as played:', gameId)}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default LibraryShelfLifeTab;
