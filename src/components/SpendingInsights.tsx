
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { useUnifiedSpendingDataV2 } from '@/hooks/useUnifiedSpendingDataV2';
import { useGenreStats } from '@/hooks/use-genre-stats';
import TopExpensiveUnplayedGames from '@/components/TopExpensiveUnplayedGames';
import CurrencyAmount from '@/components/ui/currency-amount';
import { TrendingUp, Gamepad2, Gift } from 'lucide-react';

const SpendingInsights = () => {
  const { data: spendingData } = useUnifiedSpendingDataV2();
  const { data: genreStats } = useGenreStats();

  // Prepare data for Free vs Paid breakdown with Pac-Man styling
  const libraryCompositionData = [
    { 
      name: 'Paid Games', 
      value: spendingData.paidGames, 
      color: '#FACC15', // Yellow for Pac-Man
      percentage: ((spendingData.paidGames / spendingData.totalGames) * 100).toFixed(1)
    },
    { 
      name: 'Free Games', 
      value: spendingData.freeGames, 
      color: '#1F2937', // Dark gray to blend with background (Pac-Man mouth)
      percentage: ((spendingData.freeGames / spendingData.totalGames) * 100).toFixed(1)
    }
  ];

  // Prepare top genre spending data with dynamic colors
  const topGenreSpending = genreStats
    ?.slice(0, 6)
    .map(genre => ({
      name: genre.genre_name,
      games: genre.game_count,
      percentage: genre.percentage,
      color: genre.color_hex
    })) || [];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/90 border border-unplayed-mint/30 p-3 rounded-lg">
          <p className="text-white font-medium">{label}</p>
          <p className="text-unplayed-mint">
            {payload[0].value} games ({payload[0].payload.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Top Row - Library Composition and Savings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Library Composition - Pac-Man Style */}
        <Card className="bg-black/20 border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)]">
          <CardHeader>
            <CardTitle className="flex items-center text-[#FAFAFA]">
              <Gamepad2 className="w-5 h-5 mr-2 text-blue-500" />
              Library Composition
            </CardTitle>
            <p className="text-sm text-gray-400">
              Breakdown of your {spendingData.totalGames} games
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={libraryCompositionData}
                    cx="50%"
                    cy="50%"
                    startAngle={45}
                    endAngle={405}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    labelLine={false}
                  >
                    {libraryCompositionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.9)',
                      border: '1px solid rgba(163, 247, 191, 0.3)',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Savings Summary */}
        <Card className="bg-black/20 border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)]">
          <CardHeader>
            <CardTitle className="flex items-center text-[#FAFAFA]">
              <Gift className="w-5 h-5 mr-2 text-green-500" />
              Your Savings
            </CardTitle>
            <p className="text-sm text-gray-400">
              Money saved from sales and discounts
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {spendingData.totalLibrarySaved ? (
              <>
                <div className="text-center py-4 border-2 border-green-500/30 rounded-lg bg-green-500/10">
                  <div className="text-3xl font-bold text-green-400 mb-2">
                    <CurrencyAmount amount={spendingData.totalLibrarySaved} currency={spendingData.currency} />
                  </div>
                  <p className="text-white">Total Savings</p>
                  <p className="text-sm text-gray-300 mt-1">
                    Across your entire library
                  </p>
                </div>
                
                {spendingData.unplayedSaved && (
                  <div className="text-center py-3 border border-gray-600 rounded-lg bg-black/30">
                    <div className="text-xl font-bold text-unplayed-mint mb-1">
                      <CurrencyAmount amount={spendingData.unplayedSaved} currency={spendingData.currency} />
                    </div>
                    <p className="text-gray-300 text-sm">Saved on unplayed games</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Gift className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No savings data available</p>
                <p className="text-sm mt-1">
                  This happens when original prices aren't tracked
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Genre Distribution Chart */}
      {topGenreSpending.length > 0 && (
        <Card className="bg-black/20 border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)]">
          <CardHeader>
            <CardTitle className="flex items-center text-[#FAFAFA]">
              <TrendingUp className="w-5 h-5 mr-2 text-purple-500" />
              Top Genres in Your Library
            </CardTitle>
            <p className="text-sm text-gray-400">
              Distribution of games across your most collected genres
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topGenreSpending}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    label={{ value: 'Games', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="games" 
                    radius={[4, 4, 0, 0]}
                  >
                    {topGenreSpending.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Expensive Unplayed Games */}
      <TopExpensiveUnplayedGames />
    </div>
  );
};

export default SpendingInsights;
