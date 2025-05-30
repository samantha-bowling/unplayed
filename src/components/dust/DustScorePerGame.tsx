
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3, TrendingUp, Target, AlertTriangle, CircleDot } from 'lucide-react';

interface DustScorePerGameProps {
  avgDustScore: number;
  totalGames: number;
  unplayedGames: number;
}

const DustScorePerGame = ({ avgDustScore, totalGames, unplayedGames }: DustScorePerGameProps) => {
  // Calculate completion rate
  const completionRate = totalGames > 0 ? ((totalGames - unplayedGames) / totalGames) * 100 : 0;
  
  // Create dust tier breakdown data
  const dustTiers = [
    { name: 'Low Dust (0-25)', range: [0, 25], color: '#4ade80', games: Math.floor(totalGames * 0.3) },
    { name: 'Medium Dust (26-50)', range: [26, 50], color: '#60a5fa', games: Math.floor(totalGames * 0.4) },
    { name: 'High Dust (51-75)', range: [51, 75], color: '#f59e0b', games: Math.floor(totalGames * 0.2) },
    { name: 'Critical Dust (76-100)', range: [76, 100], color: '#f87171', games: Math.floor(totalGames * 0.1) }
  ];

  // Dust distribution chart data
  const dustDistributionData = [
    { tier: 'Low', games: dustTiers[0].games, fill: dustTiers[0].color },
    { tier: 'Medium', games: dustTiers[1].games, fill: dustTiers[1].color },
    { tier: 'High', games: dustTiers[2].games, fill: dustTiers[2].color },
    { tier: 'Critical', games: dustTiers[3].games, fill: dustTiers[3].color }
  ];

  // Generate insights based on data
  const generateInsights = () => {
    const insights = [];
    
    if (avgDustScore > 75) {
      insights.push({
        type: 'warning',
        icon: AlertTriangle,
        title: 'High Dust Accumulation',
        message: 'Your average dust score is quite high. Consider playing some of your older games.',
        color: 'text-orange-400'
      });
    } else if (avgDustScore < 25) {
      insights.push({
        type: 'success',
        icon: Target,
        title: 'Excellent Library Management',
        message: 'Your dust score is impressively low! You\'re doing great at playing your games.',
        color: 'text-green-400'
      });
    }

    if (completionRate < 30) {
      insights.push({
        type: 'tip',
        icon: TrendingUp,
        title: 'Backlog Opportunity',
        message: 'You have many unplayed games. Try setting a goal to play 2-3 new games each month.',
        color: 'text-blue-400'
      });
    } else if (completionRate > 70) {
      insights.push({
        type: 'success',
        icon: Target,
        title: 'Great Completion Rate',
        message: 'You\'ve played most of your library! Consider being more selective with new purchases.',
        color: 'text-green-400'
      });
    }

    return insights;
  };

  const insights = generateInsights();

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="terminal-container">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Average Dust Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-unplayed-mint mb-2">
              {avgDustScore.toFixed(1)}
            </div>
            <Progress value={avgDustScore} className="h-2" />
            <p className="text-xs text-gray-400 mt-1">
              {avgDustScore < 25 ? 'Excellent' : avgDustScore < 50 ? 'Good' : avgDustScore < 75 ? 'Needs attention' : 'Critical'}
            </p>
          </CardContent>
        </Card>

        <Card className="terminal-container">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-cyan-400 mb-2">
              {completionRate.toFixed(1)}%
            </div>
            <Progress value={completionRate} className="h-2" />
            <p className="text-xs text-gray-400 mt-1">
              {totalGames - unplayedGames} of {totalGames} games played
            </p>
          </CardContent>
        </Card>

        <Card className="terminal-container">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Library Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-400 mb-2">
              {completionRate > 70 ? 'Healthy' : completionRate > 40 ? 'Fair' : 'Needs Work'}
            </div>
            <div className="text-xs text-gray-400">
              Based on completion rate and dust accumulation
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="terminal-container">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-unplayed-mint" />
              Dust Distribution by Tier
            </CardTitle>
            <CardDescription>
              How your games are distributed across dust score ranges
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dustDistributionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="tier" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="games" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="terminal-container">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CircleDot className="h-5 w-5 text-yellow-400" />
              Pac-Man's Gaming Appetite
            </CardTitle>
            <CardDescription>
              Pac-Man devours your game library!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] flex items-center justify-center relative">
              {/* Pac-Man Game Visualization */}
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Trail dots */}
                <div className="absolute left-8 top-1/2 transform -translate-y-1/2 flex space-x-4">
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                  <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                  <div className="w-2 h-2 bg-white/20 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }}></div>
                </div>

                {/* Pac-Man */}
                <div className="relative">
                  <div 
                    className="w-24 h-24 bg-yellow-400 rounded-full relative animate-pulse"
                    style={{
                      background: `conic-gradient(from 45deg, transparent 0deg 90deg, #FBBF24 90deg 360deg)`,
                      animationDuration: '1s'
                    }}
                  >
                    {/* Eye */}
                    <div className="absolute w-2 h-2 bg-black rounded-full top-4 left-8"></div>
                    
                    {/* Mouth animation effect */}
                    <div className="absolute inset-0 rounded-full border-4 border-yellow-400"></div>
                  </div>
                  
                  {/* Pac-Man glow */}
                  <div className="absolute inset-0 w-24 h-24 bg-yellow-400/30 rounded-full blur-sm"></div>
                </div>

                {/* Dot to be eaten */}
                <div className="absolute right-16 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 bg-red-400 rounded-full animate-bounce shadow-lg shadow-red-400/50"></div>
                  <div className="absolute inset-0 w-4 h-4 bg-red-400/30 rounded-full blur-sm"></div>
                </div>

                {/* Game statistics overlay */}
                <div className="absolute bottom-4 left-0 right-0 text-center space-y-2">
                  <div className="flex justify-around text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">{totalGames - unplayedGames}</div>
                      <div className="text-xs text-gray-400">Games Devoured</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-400">{unplayedGames}</div>
                      <div className="text-xs text-gray-400">Dots Remaining</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    Pac-Man has eaten {completionRate.toFixed(1)}% of your library!
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights and Recommendations */}
      <Card className="terminal-container">
        <CardHeader>
          <CardTitle>Insights & Recommendations</CardTitle>
          <CardDescription>
            Personalized suggestions based on your library analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-black/20 rounded-lg">
                <insight.icon className={`h-5 w-5 mt-0.5 ${insight.color}`} />
                <div>
                  <h4 className={`font-medium ${insight.color}`}>{insight.title}</h4>
                  <p className="text-gray-300 text-sm mt-1">{insight.message}</p>
                </div>
              </div>
            ))}
            
            {insights.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Your library looks well-maintained! Keep up the good work.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dust Tier Breakdown Table */}
      <Card className="terminal-container">
        <CardHeader>
          <CardTitle>Dust Tier Breakdown</CardTitle>
          <CardDescription>
            Understanding what each dust tier means for your games
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dustTiers.map((tier, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tier.color }}></div>
                  <div>
                    <div className="font-medium">{tier.name}</div>
                    <div className="text-sm text-gray-400">
                      {tier.range[0] === 0 ? 'Recently acquired or played' : 
                       tier.range[0] < 50 ? 'Moderate dust accumulation' :
                       tier.range[0] < 75 ? 'Significant neglect' : 'Critical attention needed'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">{tier.games}</div>
                  <div className="text-sm text-gray-400">games</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DustScorePerGame;
