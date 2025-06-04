
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useUserMetrics } from '@/hooks/use-user-metrics';
import { useDustBreakdowns } from '@/hooks/use-dust-breakdowns';

const DUST_TIERS = [
  { name: 'Freshly Polished', range: [0, 10], color: '#4ade80', bgColor: '#4ade80/20' },
  { name: 'Lightly Dusty', range: [11, 25], color: '#22d3ee', bgColor: '#22d3ee/20' },
  { name: 'Moderately Neglected', range: [26, 40], color: '#a3e635', bgColor: '#a3e635/20' },
  { name: 'Significantly Dusty', range: [41, 60], color: '#fbbf24', bgColor: '#fbbf24/20' },
  { name: 'Heavily Accumulated', range: [61, 80], color: '#fb923c', bgColor: '#fb923c/20' },
  { name: 'Ancient Artifact', range: [81, 100], color: '#f87171', bgColor: '#f87171/20' },
  { name: 'Legendary Relic', range: [101, 150], color: '#c084fc', bgColor: '#c084fc/20' },
  { name: 'Mythical Archive', range: [151, Infinity], color: '#e879f9', bgColor: '#e879f9/20' }
];

const DustTierDistribution: React.FC = () => {
  const { data: userMetrics } = useUserMetrics();
  const { data: dustBreakdowns } = useDustBreakdowns();

  // Calculate tier distribution
  const tierDistribution = React.useMemo(() => {
    if (!dustBreakdowns || dustBreakdowns.length === 0) {
      return DUST_TIERS.map(tier => ({ ...tier, count: 0, percentage: 0 }));
    }

    const distribution = DUST_TIERS.map(tier => {
      const count = dustBreakdowns.filter(game => {
        const dustScore = game.dustScore;
        return dustScore >= tier.range[0] && dustScore <= tier.range[1];
      }).length;
      
      const percentage = (count / dustBreakdowns.length) * 100;
      
      return {
        ...tier,
        count,
        percentage
      };
    });

    return distribution;
  }, [dustBreakdowns]);

  const maxCount = Math.max(...tierDistribution.map(tier => tier.count));
  const totalGames = userMetrics?.totalGames || 0;

  return (
    <Card className="terminal-container border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)] bg-black/40">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-unplayed-mint" />
          Dust Tier Distribution
        </CardTitle>
        <p className="text-gray-400 mt-2">
          How your {totalGames} games are distributed across dust accumulation tiers
        </p>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {tierDistribution.map((tier, index) => (
            <div key={tier.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full border border-gray-600"
                    style={{ backgroundColor: tier.color }}
                  ></div>
                  <span className="text-sm font-medium text-gray-300">
                    {tier.name}
                  </span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3 w-3 text-gray-500 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Dust Score: {tier.range[0]}-{tier.range[1] === Infinity ? '∞' : tier.range[1]}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-400">{tier.count} games</span>
                  <span className="text-gray-500">({tier.percentage.toFixed(1)}%)</span>
                </div>
              </div>
              
              <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-2 rounded-full transition-all duration-500 shadow-sm"
                  style={{ 
                    width: `${maxCount > 0 ? (tier.count / maxCount) * 100 : 0}%`,
                    backgroundColor: tier.color,
                    boxShadow: `0 0 8px ${tier.color}40`
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
        
        {dustBreakdowns && dustBreakdowns.length > 0 && (
          <div className="mt-6 p-4 bg-black/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-unplayed-amber" />
              <span className="text-sm font-medium">Distribution Insights</span>
            </div>
            <div className="space-y-1 text-xs text-gray-400">
              <p>• Most games are in the {tierDistribution.reduce((prev, current) => (prev.count > current.count) ? prev : current).name} tier</p>
              <p>• {tierDistribution.filter(tier => tier.count > 0).length} out of {DUST_TIERS.length} tiers have games</p>
              <p>• Higher tiers indicate more neglected games that could use attention</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DustTierDistribution;
