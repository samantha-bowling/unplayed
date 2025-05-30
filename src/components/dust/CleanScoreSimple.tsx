
import React from 'react';
import { withDemoIndicator, WithDemoProps } from '../withDemoIndicator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { InfoIcon } from 'lucide-react';
import { useAnimatedCounter } from '@/hooks/use-animated-counter';

interface CleanScoreSimpleProps extends WithDemoProps {
  score: number;
  tier: { name: string; color: string; range: [number, number]; } | undefined;
}

const CleanScoreSimple = ({
  score,
  tier,
  isDemo = false
}: CleanScoreSimpleProps) => {
  // Use the shared animated counter hook with demo awareness
  const animatedScore = useAnimatedCounter({
    targetValue: score,
    duration: 2000,
    isDemo
  });

  const tierColor = tier?.color || '#22d3ee';
  const tierName = tier?.name || 'Calculating...';

  return (
    <div className="flex items-center justify-between w-full">
      <div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-medium" style={{ color: tierColor }}>Clean Score</h4>
                <InfoIcon size={16} className="text-gray-500" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="text-sm max-w-xs">
                Clean Score measures how actively you're engaging with your library. 
                Based on completion rate, play depth, and recent activity.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <p className="text-sm text-gray-400">{tierName}</p>
      </div>
      
      <div className="text-right">
        <span className="text-2xl font-bold" style={{ color: tierColor }}>{animatedScore}</span>
      </div>
    </div>
  );
};

export default withDemoIndicator(CleanScoreSimple);
