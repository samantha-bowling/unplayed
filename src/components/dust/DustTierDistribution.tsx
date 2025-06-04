
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Cell } from 'recharts';
import { useDustBreakdowns } from '@/hooks/use-dust-breakdowns';

const DustTierDistribution = () => {
  const { data: dustBreakdowns, isLoading } = useDustBreakdowns();

  // Calculate tier distributions
  const tierData = React.useMemo(() => {
    if (!dustBreakdowns || dustBreakdowns.length === 0) {
      return [
        { tier: 'Low', count: 0, range: '0-25', color: '#22c55e' },
        { tier: 'Medium', count: 0, range: '26-50', color: '#3b82f6' },
        { tier: 'High', count: 0, range: '51-75', color: '#f97316' },
        { tier: 'Critical', count: 0, range: '76-100', color: '#ef4444' }
      ];
    }

    const tiers = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };

    dustBreakdowns.forEach(game => {
      const score = game.dustScore;
      if (score <= 25) tiers.low++;
      else if (score <= 50) tiers.medium++;
      else if (score <= 75) tiers.high++;
      else tiers.critical++;
    });

    return [
      { tier: 'Low', count: tiers.low, range: '0-25', color: '#22c55e' },
      { tier: 'Medium', count: tiers.medium, range: '26-50', color: '#3b82f6' },
      { tier: 'High', count: tiers.high, range: '51-75', color: '#f97316' },
      { tier: 'Critical', count: tiers.critical, range: '76-100', color: '#ef4444' }
    ];
  }, [dustBreakdowns]);

  const totalGames = tierData.reduce((sum, tier) => sum + tier.count, 0);

  if (isLoading) {
    return (
      <Card className="terminal-container">
        <CardContent className="p-6">
          <div className="text-center text-gray-400">Loading tier distribution...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="terminal-container">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-unplayed-mint" />
          Dust Tier Distribution
        </CardTitle>
        <p className="text-sm text-gray-400">
          How your games are distributed across dust severity levels
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={tierData}>
              <XAxis 
                dataKey="tier" 
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <YAxis tick={{ fill: '#9ca3af' }} />
              <RechartsTooltip 
                contentStyle={{ 
                  backgroundColor: '#1e1e1e', 
                  borderColor: '#374151',
                  borderRadius: '0.5rem' 
                }}
                formatter={(value, name) => [`${value} games`, `${name} Dust Tier`]}
                labelFormatter={(label) => {
                  const tier = tierData.find(t => t.tier === label);
                  return `${label} Dust (${tier?.range})`;
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {tierData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {tierData.map((tier) => (
            <div key={tier.tier} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-sm"
                  style={{ backgroundColor: tier.color }}
                />
                <div>
                  <span className="text-white font-medium">{tier.tier}</span>
                  <span className="text-xs text-gray-400 ml-2">({tier.range})</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-white font-mono">{tier.count}</span>
                <span className="text-gray-400 text-sm ml-1">
                  ({totalGames > 0 ? Math.round((tier.count / totalGames) * 100) : 0}%)
                </span>
              </div>
            </div>
          ))}
        </div>

        {totalGames > 0 && (
          <div className="text-center text-sm text-gray-400">
            Total analyzed games: {totalGames}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DustTierDistribution;
