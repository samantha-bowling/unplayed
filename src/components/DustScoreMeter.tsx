
import { useState, useEffect } from 'react';
import { withDemoIndicator, WithDemoProps } from './withDemoIndicator';
import { useAuth } from '@/context/AuthContext';
import useUnplayedData from '@/hooks/use-unplayed-data';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InfoIcon } from 'lucide-react';

interface DustScoreMeterProps extends WithDemoProps {
  score?: number;
  compact?: boolean;
}

const DustScoreMeter = ({
  score,
  compact = false,
  isDemo = false
}: DustScoreMeterProps) => {
  const { data: unplayedData } = useUnplayedData();
  const { user } = useAuth();

  const actualScore = score ?? unplayedData.dustScore;
  const [animatedScore, setAnimatedScore] = useState(0);
  const [animatedPercentage, setAnimatedPercentage] = useState(0);

  // Calculate percentage based on dust score tiers (0-1000 scale)
  const maxScore = 1000;
  const targetPercentage = Math.min((actualScore / maxScore) * 100, 100);

  useEffect(() => {
    const duration = 1500;
    const frameDuration = 1000 / 60;
    const totalFrames = Math.round(duration / frameDuration);
    const scoreIncrement = actualScore / totalFrames;
    const percentageIncrement = targetPercentage / totalFrames;

    let currentFrame = 0;
    const timer = setInterval(() => {
      currentFrame++;
      const scoreValue = Math.min(Math.round(scoreIncrement * currentFrame), actualScore);
      const percentageValue = Math.min(percentageIncrement * currentFrame, targetPercentage);

      setAnimatedScore(scoreValue);
      setAnimatedPercentage(percentageValue);

      if (currentFrame === totalFrames) {
        clearInterval(timer);
      }
    }, frameDuration);

    return () => clearInterval(timer);
  }, [actualScore, targetPercentage]);

  if (compact) {
    return (
      <div className="flex items-center justify-between gap-4 px-4 py-2 rounded-md bg-black/40 border border-unplayed-red/30 min-w-[250px]">
        <div>
          <div className="text-2xl font-bold font-vt text-unplayed-red">
            {animatedScore}
          </div>
          <div className="text-sm text-gray-400">
            Dust Score
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="ml-1 text-gray-500 hover:text-gray-400">
                    <InfoIcon size={14} />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    Higher scores indicate more neglected games in your library
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-gray-700"></div>
          <div 
            className="absolute inset-0 rounded-full border-4 border-unplayed-red transition-all duration-1000 ease-out"
            style={{
              clipPath: `polygon(50% 50%, 50% 0%, ${
                animatedPercentage <= 25 
                  ? `${50 + animatedPercentage * 2}% 0%`
                  : animatedPercentage <= 50
                  ? `100% 0%, 100% ${(animatedPercentage - 25) * 4}%`
                  : animatedPercentage <= 75
                  ? `100% 0%, 100% 100%, ${100 - (animatedPercentage - 50) * 4}% 100%`
                  : `100% 0%, 100% 100%, 0% 100%, 0% ${100 - (animatedPercentage - 75) * 4}%`
              })`
            }}
          ></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`terminal-container ${isDemo ? 'relative' : ''} equal-height-container`}>
      <h3 className="terminal-header text-2xl mb-2">Dust Score</h3>

      <div className="terminal-content flex flex-col items-center py-6">
        <div className="relative w-32 h-32 mb-6">
          {/* Background circle */}
          <div className="absolute inset-0 rounded-full border-8 border-gray-700"></div>
          
          {/* Animated fill circle */}
          <div 
            className="absolute inset-0 rounded-full border-8 border-unplayed-red transition-all duration-1000 ease-out"
            style={{
              clipPath: `polygon(50% 50%, 50% 0%, ${
                animatedPercentage <= 25 
                  ? `${50 + animatedPercentage * 2}% 0%`
                  : animatedPercentage <= 50
                  ? `100% 0%, 100% ${(animatedPercentage - 25) * 4}%`
                  : animatedPercentage <= 75
                  ? `100% 0%, 100% 100%, ${100 - (animatedPercentage - 50) * 4}% 100%`
                  : `100% 0%, 100% 100%, 0% 100%, 0% ${100 - (animatedPercentage - 75) * 4}%`
              })`
            }}
          ></div>
          
          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold font-vt text-unplayed-red">
              {animatedScore}
            </span>
          </div>
        </div>

        <p className="text-gray-300 text-center text-lg mb-4">
          Your library's dust accumulation level
        </p>

        <div className="text-sm text-gray-400 text-center flex items-center justify-center">
          <span>
            Games gathering digital dust in your collection
          </span>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="ml-1 text-gray-500 hover:text-gray-400">
                  <InfoIcon size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>
                  Dust Score measures how neglected your game library is. Higher scores indicate more unplayed games that have been sitting unused for longer periods.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {isDemo && !document.cookie.includes("demo_note_dismissed") && (
          <div className="mt-4 text-center flex justify-center">
            <p className="text-sm text-unplayed-mint">
              You're in Demo Mode. Sign in to track your Dust Score.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default withDemoIndicator(DustScoreMeter);
