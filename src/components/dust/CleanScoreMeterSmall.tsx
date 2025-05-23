
import { useState, useEffect } from 'react';
import { withDemoIndicator, WithDemoProps } from '../withDemoIndicator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { InfoIcon, Sparkle } from 'lucide-react';

interface CleanScoreMeterSmallProps extends WithDemoProps {
  score: number;
  tier: { name: string; color: string; range: [number, number]; } | undefined;
}

const CleanScoreMeterSmall = ({
  score,
  tier,
  isDemo = false
}: CleanScoreMeterSmallProps) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  
  useEffect(() => {
    const duration = 2000;
    const start = 0;
    const end = score;
    const frameDuration = 1000 / 60;
    const totalFrames = Math.round(duration / frameDuration);
    const increment = (end - start) / totalFrames;
    let currentFrame = 0;
    const timer = setInterval(() => {
      currentFrame++;
      const currentValue = Math.round(start + increment * currentFrame);
      setAnimatedScore(currentValue);
      if (currentFrame === totalFrames) {
        clearInterval(timer);
      }
    }, frameDuration);
    return () => clearInterval(timer);
  }, [score]);

  const tierColor = tier?.color || '#22d3ee';
  const tierName = tier?.name || 'Calculating...';

  // Show sparkles for high scores
  const showSparkles = score >= 90;

  return (
    <div className="flex items-center">
      <div className="relative w-14 h-14">
        {/* Progress circle */}
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#333" strokeWidth="10" />
          <circle 
            cx="50" 
            cy="50" 
            r="45" 
            fill="none" 
            stroke={tierColor}
            strokeWidth="10" 
            strokeDasharray={`${Math.min(score / 100, 1) * 283} 283`} 
          />
        </svg>
        
        {/* Center score - added flex centering */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold" style={{ color: tierColor }}>{animatedScore}</span>
        </div>

        {/* Sparkles for high scores */}
        {showSparkles && (
          <div className="absolute -top-1 -right-1 animate-pulse">
            <Sparkle size={16} className="text-yellow-300" />
          </div>
        )}
      </div>
      
      <div className="ml-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1">
                <h4 className="text-md font-medium" style={{ color: tierColor }}>Clean Score</h4>
                <InfoIcon size={14} className="text-gray-500" />
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
    </div>
  );
};

export default withDemoIndicator(CleanScoreMeterSmall);
