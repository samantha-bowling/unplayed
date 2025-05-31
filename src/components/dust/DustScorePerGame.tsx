
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingDown, TrendingUp, Target, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useGenreStats } from '@/hooks/use-genre-stats';
import { useDustBreakdowns } from '@/hooks/use-dust-breakdowns';

interface DustScorePerGameProps {
  avgDustScore: number;
  totalGames: number;
  unplayedGames: number;
}

const DustScorePerGame: React.FC<DustScorePerGameProps> = ({
  avgDustScore,
  totalGames,
  unplayedGames
}) => {
  const { data: genreStats } = useGenreStats();
  const { data: dustBreakdowns } = useDustBreakdowns();

  // Calculate library health metrics
  const completionRate = totalGames > 0 ? ((totalGames - unplayedGames) / totalGames) * 100 : 0;
  const unplayedPercentage = totalGames > 0 ? (unplayedGames / totalGames) * 100 : 0;
  
  // Enhanced library health determination with detailed criteria
  const getLibraryHealth = () => {
    const hasLowDustScore = avgDustScore <= 25;
    const hasModerateActivity = completionRate >= 30;
    
    if (completionRate >= 70 && hasLowDustScore) {
      return { 
        status: 'Excellent', 
        color: '#4ade80', 
        description: 'Your library is in excellent shape!',
        criteria: '70%+ completion rate with well-managed dust accumulation'
      };
    }
    if (completionRate >= 50 || (completionRate >= 30 && hasLowDustScore)) {
      return { 
        status: 'Good', 
        color: '#22d3ee', 
        description: 'Your library is well maintained.',
        criteria: '50-70% completion rate or good dust management practices'
      };
    }
    if (completionRate >= 30 && hasModerateActivity) {
      return { 
        status: 'Needs Work', 
        color: '#f59e0b', 
        description: 'Your library could use some attention.',
        criteria: '30-50% completion rate with moderate dust buildup'
      };
    }
    return { 
      status: 'Critical', 
      color: '#f87171', 
      description: 'Your library needs serious work!',
      criteria: 'Less than 30% completion rate with significant dust accumulation'
    };
  };
  
  const libraryHealth = getLibraryHealth();
  
  // Dust score quality assessment
  const getDustQuality = () => {
    if (avgDustScore <= 15) return { quality: 'Excellent', color: '#4ade80', trend: TrendingDown };
    if (avgDustScore <= 25) return { quality: 'Good', color: '#22d3ee', trend: TrendingDown };
    if (avgDustScore <= 40) return { quality: 'Moderate', color: '#f59e0b', trend: TrendingUp };
    return { quality: 'High', color: '#f87171', trend: TrendingUp };
  };
  
  const dustQuality = getDustQuality();
  const TrendIcon = dustQuality.trend;

  // Calculate dustiest genre
  const getDustiestGenre = () => {
    if (!genreStats || !dustBreakdowns || genreStats.length === 0 || dustBreakdowns.length === 0) {
      return null;
    }

    // Group dust breakdowns by genre and calculate average dust scores
    const genreDustMap = new Map<string, { totalDust: number; gameCount: number }>();
    
    dustBreakdowns.forEach(game => {
      // We'll need to get genres from the games table via the breakdown
      // For now, use the top genre from genre stats as a fallback
      const topGenre = genreStats[0]?.genreName || 'Unknown';
      
      if (!genreDustMap.has(topGenre)) {
        genreDustMap.set(topGenre, { totalDust: 0, gameCount: 0 });
      }
      
      const genreData = genreDustMap.get(topGenre)!;
      genreData.totalDust += game.dustScore;
      genreData.gameCount += 1;
    });

    // Find genre with highest average dust score
    let dustiestGenre = { name: 'Unknown', avgDust: 0, gameCount: 0 };
    
    for (const [genreName, data] of genreDustMap.entries()) {
      const avgDust = data.totalDust / data.gameCount;
      if (avgDust > dustiestGenre.avgDust) {
        dustiestGenre = { name: genreName, avgDust, gameCount: data.gameCount };
      }
    }

    // Fallback to most common genre if no dust data
    if (dustiestGenre.name === 'Unknown' && genreStats.length > 0) {
      const mostCommonGenre = genreStats.reduce((prev, current) => 
        prev.gameCount > current.gameCount ? prev : current
      );
      return {
        name: mostCommonGenre.genreName,
        avgDust: avgDustScore, // Use overall average as fallback
        gameCount: mostCommonGenre.gameCount
      };
    }

    return dustiestGenre.name !== 'Unknown' ? dustiestGenre : null;
  };

  const dustiestGenre = getDustiestGenre();

  return (
    <Card className="terminal-container border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)]">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-cyan-400" />
          Dust Score Analysis
        </CardTitle>
        <p className="text-gray-400 mt-2">
          Understanding your library's dust accumulation patterns
        </p>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column - Key Metrics */}
          <div className="space-y-6">
            {/* Average Dust Score */}
            <div className="bg-black/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium">Average Dust Score</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-gray-500 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>The average dust score across all games in your library</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold" style={{ color: dustQuality.color }}>
                  {avgDustScore.toFixed(1)}
                </span>
                <TrendIcon className="h-5 w-5" style={{ color: dustQuality.color }} />
              </div>
              <p className="text-sm text-gray-400 mt-1">
                Quality: <span style={{ color: dustQuality.color }}>{dustQuality.quality}</span>
              </p>
            </div>

            {/* Completion Rate */}
            <div className="bg-black/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium">Completion Rate</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-gray-500 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Percentage of games in your library that have been played</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-cyan-400">
                  {completionRate.toFixed(1)}%
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                {totalGames - unplayedGames} of {totalGames} games played
              </p>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <div 
                  className="bg-cyan-400 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min(completionRate, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Library Health */}
            <div className="bg-black/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium">Library Health</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-gray-500 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <div className="space-y-2">
                        <p><strong>Health Criteria:</strong></p>
                        <p><strong>Excellent:</strong> 70%+ completion + low dust</p>
                        <p><strong>Good:</strong> 50-70% completion OR good dust management</p>
                        <p><strong>Needs Work:</strong> 30-50% completion with dust buildup</p>
                        <p><strong>Critical:</strong> &lt;30% completion + high dust</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: libraryHealth.color }}></div>
                <span className="font-medium" style={{ color: libraryHealth.color }}>
                  {libraryHealth.status}
                </span>
              </div>
              <p className="text-sm text-gray-300 mb-2">
                {libraryHealth.description}
              </p>
              <p className="text-xs text-gray-400">
                {libraryHealth.criteria}
              </p>
            </div>
          </div>

          {/* Right Column - Insights and Recommendations */}
          <div className="space-y-6">
            {/* Dustiest Genre */}
            <div className="bg-black/30 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-4">Dustiest Genre</h3>
              {dustiestGenre ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-unplayed-pink mt-1.5 flex-shrink-0"></div>
                    <div>
                      <p className="text-sm font-medium text-unplayed-pink">
                        {dustiestGenre.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {dustiestGenre.gameCount} games • Avg dust: {dustiestGenre.avgDust.toFixed(1)}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-300">
                    This genre has the highest dust accumulation in your library
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-400">
                  No genre data available
                </p>
              )}
            </div>

            {/* Dust Distribution by Tier */}
            <div className="bg-black/30 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-4">Dust Insights</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-unplayed-mint mt-1.5 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-unplayed-mint">
                      {unplayedPercentage.toFixed(1)}% Unplayed Games
                    </p>
                    <p className="text-xs text-gray-400">
                      {unplayedGames} games have never been launched
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-amber-400">
                      Dust Accumulation Rate
                    </p>
                    <p className="text-xs text-gray-400">
                      {avgDustScore > 30 ? 'High' : avgDustScore > 20 ? 'Moderate' : 'Low'} - based on purchase vs play patterns
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-purple-400">
                      Library Efficiency
                    </p>
                    <p className="text-xs text-gray-400">
                      {completionRate > 50 ? 'High efficiency' : 'Room for improvement'} in game utilization
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-black/30 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-4">Recommendations</h3>
              <div className="space-y-3 text-sm">
                {avgDustScore > 30 && (
                  <div className="flex items-start gap-2">
                    <Target className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-300">
                      Focus on reducing your unplayed game count before purchasing new titles
                    </p>
                  </div>
                )}
                
                {completionRate < 50 && (
                  <div className="flex items-start gap-2">
                    <Target className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-300">
                      Try playing games you've owned longest but haven't touched
                    </p>
                  </div>
                )}
                
                {dustiestGenre && (
                  <div className="flex items-start gap-2">
                    <Target className="h-4 w-4 text-unplayed-pink mt-0.5 flex-shrink-0" />
                    <p className="text-gray-300">
                      Consider exploring your {dustiestGenre.name} games to reduce dust accumulation
                    </p>
                  </div>
                )}
                
                <div className="flex items-start gap-2">
                  <Target className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-300">
                    Use the Random Game Picker to discover hidden gems in your library
                  </p>
                </div>
                
                <div className="flex items-start gap-2">
                  <Target className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-300">
                    Set a goal to play at least one new game per week
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DustScorePerGame;
