
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingDown, TrendingUp, Target, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  // Calculate library health metrics
  const completionRate = totalGames > 0 ? ((totalGames - unplayedGames) / totalGames) * 100 : 0;
  const unplayedPercentage = totalGames > 0 ? (unplayedGames / totalGames) * 100 : 0;
  
  // Determine library health status
  const getLibraryHealth = () => {
    if (completionRate >= 70) return { status: 'Excellent', color: '#4ade80', description: 'Your library is in excellent shape!' };
    if (completionRate >= 50) return { status: 'Good', color: '#22d3ee', description: 'Your library is well maintained.' };
    if (completionRate >= 30) return { status: 'Needs Work', color: '#f59e0b', description: 'Your library could use some attention.' };
    return { status: 'Critical', color: '#f87171', description: 'Your library needs serious work!' };
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
            </div>

            {/* Library Health */}
            <div className="bg-black/30 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-2">Library Health</h3>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: libraryHealth.color }}></div>
                <span className="font-medium" style={{ color: libraryHealth.color }}>
                  {libraryHealth.status}
                </span>
              </div>
              <p className="text-sm text-gray-300">
                {libraryHealth.description}
              </p>
            </div>
          </div>

          {/* Right Column - Insights and Recommendations */}
          <div className="space-y-6">
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

            {/* Progress Tracking */}
            <div className="bg-black/30 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-3">Progress Tracking</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Library Completion</span>
                    <span>{completionRate.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-cyan-400 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min(completionRate, 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="text-xs text-gray-400 mt-2">
                  <p>Keep playing to improve your library health score!</p>
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
