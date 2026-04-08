
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Calendar, Clock, TrendingDown, Archive } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLibraryData } from '@/hooks/use-library-data';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';
import ShelfLife from '@/components/ShelfLife';

const LibraryShelfLifeTab = () => {
  const { games: libraryGames } = useLibraryData();

  // Calculate shelf life statistics
  const shelfLifeStats = React.useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // Games by decade
    const gamesByDecade: Record<string, { total: number; unplayed: number; played: number }> = {};
    
    // Age distribution
    const ageDistribution = {
      brand_new: 0, // Current year
      recent: 0, // 1-2 years old
      aging: 0, // 3-5 years old
      old: 0, // 6-10 years old
      vintage: 0, // 11+ years old
      unknown: 0 // No release date
    };

    // Aging unplayed games (3+ years old and unplayed)
    const agingUnplayedGames: Array<{
      game: any;
      age: number;
      releaseYear: number;
    }> = [];

    libraryGames.forEach(game => {
      const playtime = game.userGame?.playtime_minutes || 0;
      const isUnplayed = playtime === 0;
      
      if (game.release_date) {
        const releaseYear = new Date(game.release_date).getFullYear();
        const age = currentYear - releaseYear;
        const decade = `${Math.floor(releaseYear / 10) * 10}s`;
        
        // Track by decade
        if (!gamesByDecade[decade]) {
          gamesByDecade[decade] = { total: 0, unplayed: 0, played: 0 };
        }
        gamesByDecade[decade].total++;
        if (isUnplayed) {
          gamesByDecade[decade].unplayed++;
        } else {
          gamesByDecade[decade].played++;
        }
        
        // Track age distribution
        if (age === 0) {
          ageDistribution.brand_new++;
        } else if (age <= 2) {
          ageDistribution.recent++;
        } else if (age <= 5) {
          ageDistribution.aging++;
        } else if (age <= 10) {
          ageDistribution.old++;
        } else {
          ageDistribution.vintage++;
        }
        
        // Track aging unplayed games (3+ years old and unplayed)
        if (isUnplayed && age >= 3) {
          agingUnplayedGames.push({ game, age, releaseYear });
        }
      } else {
        ageDistribution.unknown++;
      }
    });

    // Sort aging unplayed games by age (oldest first)
    agingUnplayedGames.sort((a, b) => b.age - a.age);

    return {
      gamesByDecade,
      ageDistribution,
      agingUnplayedGames: agingUnplayedGames.slice(0, 10) // Top 10 aging unplayed
    };
  }, [libraryGames]);

  // Prepare chart data
  const decadeData = Object.entries(shelfLifeStats.gamesByDecade)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([decade, stats]) => ({
      decade,
      ...stats
    }));

  const ageData = [
    { age: 'Brand New', count: shelfLifeStats.ageDistribution.brand_new, color: '#22c55e' },
    { age: 'Recent (1-2y)', count: shelfLifeStats.ageDistribution.recent, color: '#3b82f6' },
    { age: 'Aging (3-5y)', count: shelfLifeStats.ageDistribution.aging, color: '#f59e0b' },
    { age: 'Old (6-10y)', count: shelfLifeStats.ageDistribution.old, color: '#ef4444' },
    { age: 'Vintage (11y+)', count: shelfLifeStats.ageDistribution.vintage, color: '#8b5cf6' },
    { age: 'Unknown', count: shelfLifeStats.ageDistribution.unknown, color: '#6b7280' }
  ];

  const totalGames = libraryGames.length;
  const averageAge = React.useMemo(() => {
    const gamesWithDates = libraryGames.filter(game => game.release_date);
    if (gamesWithDates.length === 0) return 0;
    
    const currentYear = new Date().getFullYear();
    const totalAge = gamesWithDates.reduce((sum, game) => {
      const releaseYear = new Date(game.release_date!).getFullYear();
      return sum + (currentYear - releaseYear);
    }, 0);
    
    return Math.round(totalAge / gamesWithDates.length);
  }, [libraryGames]);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-black/20 border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)] hover:shadow-[0_0_25px_rgba(163,247,191,0.2)] transition-all duration-300">
            <CardContent className="p-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-2 cursor-help">
                    <Clock className="h-5 w-5 text-blue-400" />
                    <div>
                      <p className="text-2xl font-bold text-white">{averageAge}</p>
                      <p className="text-sm text-gray-400">Avg Game Age</p>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Average age of games in your library (years since release)</p>
                </TooltipContent>
              </Tooltip>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)] hover:shadow-[0_0_25px_rgba(163,247,191,0.2)] transition-all duration-300">
            <CardContent className="p-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-2 cursor-help">
                    <Archive className="h-5 w-5 text-unplayed-amber" />
                    <div>
                      <p className="text-2xl font-bold text-white">{shelfLifeStats.ageDistribution.vintage}</p>
                      <p className="text-sm text-gray-400">Vintage Games</p>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Games that are 11+ years old</p>
                </TooltipContent>
              </Tooltip>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)] hover:shadow-[0_0_25px_rgba(163,247,191,0.2)] transition-all duration-300">
            <CardContent className="p-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-2 cursor-help">
                    <TrendingDown className="h-5 w-5 text-unplayed-red" />
                    <div>
                      <p className="text-2xl font-bold text-white">{shelfLifeStats.agingUnplayedGames.length}</p>
                      <p className="text-sm text-gray-400">Aging unplayed</p>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>unplayed games that are 3+ years old since release</p>
                </TooltipContent>
              </Tooltip>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)] hover:shadow-[0_0_25px_rgba(163,247,191,0.2)] transition-all duration-300">
            <CardContent className="p-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-2 cursor-help">
                    <Calendar className="h-5 w-5 text-green-400" />
                    <div>
                      <p className="text-2xl font-bold text-white">{Object.keys(shelfLifeStats.gamesByDecade).length}</p>
                      <p className="text-sm text-gray-400">Decades</p>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Your library spans {Object.keys(shelfLifeStats.gamesByDecade).sort().length > 0 
                    ? `from the ${Object.keys(shelfLifeStats.gamesByDecade).sort()[0]} to the ${Object.keys(shelfLifeStats.gamesByDecade).sort().slice(-1)[0]}`
                    : 'no decades yet'}</p>
                </TooltipContent>
              </Tooltip>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Games by Decade */}
          <Card className="bg-black/20 border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)] hover:shadow-[0_0_25px_rgba(163,247,191,0.2)] transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-green-400" />
                <span>Games by Decade</span>
                <Tooltip>
                  <TooltipTrigger>
                    <span className="text-xs text-gray-400 cursor-help">ⓘ</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Distribution of your games across different decades</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={decadeData}>
                    <XAxis 
                      dataKey="decade" 
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
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

          {/* Age Distribution */}
          <Card className="bg-black/20 border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)] hover:shadow-[0_0_25px_rgba(163,247,191,0.2)] transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-400" />
                <span>Age Distribution</span>
                <Tooltip>
                  <TooltipTrigger>
                    <span className="text-xs text-gray-400 cursor-help">ⓘ</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>How your games are distributed by age</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ageData.map((item) => (
                <div key={item.age} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-medium">{item.age}</span>
                    <span className="text-sm text-gray-400">
                      {item.count} games ({Math.round((item.count / totalGames) * 100)}%)
                    </span>
                  </div>
                  <Progress 
                    value={(item.count / totalGames) * 100} 
                    className="h-2"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Shelf Life Component - Remove redundant wrapper */}
        <div className="h-[650px]">
          <ShelfLife />
        </div>
      </div>
    </TooltipProvider>
  );
};

export default LibraryShelfLifeTab;
