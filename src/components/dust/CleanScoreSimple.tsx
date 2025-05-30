
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
    <div className="flex flex-col items-center text-center w-full">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-lg font-medium" style={{ color: tierColor }}>Clean Score</h4>
              <InfoIcon size={16} className="text-gray-500" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-sm max-w-xs">
              Clean Score measures how actively you're engaging with your library. 
              Based on completion rate, play depth, and recent activity.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <div className="flex flex-col items-center">
        <span className="text-2xl font-bold mb-1" style={{ color: tierColor }}>{animatedScore}</span>
        <p className="text-sm text-gray-400">{tierName}</p>
      </div>
    </div>
  );
};

export default withDemoIndicator(CleanScoreSimple);
