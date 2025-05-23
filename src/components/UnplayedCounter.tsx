
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

interface UnplayedCounterProps extends WithDemoProps {
  count?: number;
  compact?: boolean;
}

const UnplayedCounter = ({
  count,
  compact = false,
  isDemo = false
}: UnplayedCounterProps) => {
  const {
    data: unplayedData
  } = useUnplayedData();

  const actualCount = count ?? unplayedData.unplayedGames;
  const totalGames = unplayedData.totalGames;
  const unplayedPercentage = totalGames > 0 ? Math.round((actualCount / totalGames) * 100) : 0;
  const [animatedCount, setAnimatedCount] = useState(0);

  const potentialHours = unplayedData.potentialGameplayHours ?? actualCount * 12.5;
  const [animatedHours, setAnimatedHours] = useState(0);

  const { user } = useAuth();

  useEffect(() => {
    const duration = 1500;
    const frameDuration = 1000 / 60;
    const totalFrames = Math.round(duration / frameDuration);
    const countIncrement = actualCount / totalFrames;
    const hoursIncrement = potentialHours / totalFrames;

    let currentFrame = 0;
    const timer = setInterval(() => {
      currentFrame++;
      const countValue = Math.min(Math.round(countIncrement * currentFrame), actualCount);
      const hoursValue = Math.min(Math.round(hoursIncrement * currentFrame), Math.round(potentialHours));

      setAnimatedCount(countValue);
      setAnimatedHours(hoursValue);

      if (currentFrame === totalFrames) {
        clearInterval(timer);
      }
    }, frameDuration);

    return () => clearInterval(timer);
  }, [actualCount, potentialHours]);

  if (compact) {
    return (
      <div className="flex items-center justify-between gap-4 px-4 py-2 rounded-md bg-black/40 border border-unplayed-mint/30 min-w-[250px]">
        <div>
          <div className="text-2xl font-bold font-vt text-unplayed-mint">
            {animatedCount}
          </div>
          <div className="text-sm text-gray-400">
            unplayed Games
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="ml-1 text-gray-500 hover:text-gray-400">
                    <InfoIcon size={14} />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>
                    Includes games with 0 recorded minutes of playtime
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="text-right">
          <div className="text-lg font-medium text-unplayed-amber">
            {unplayedPercentage}%
          </div>
          <div className="text-xs text-gray-400">
            of library
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`terminal-container ${isDemo ? 'relative' : ''} equal-height-container`}>
      <h3 className="terminal-header text-2xl mb-2">unplayed Games</h3>

      <div className="terminal-content flex flex-col items-center py-6">
        <div className="text-5xl md:text-6xl font-bold font-vt text-unplayed-mint mb-2">
          {animatedCount}
        </div>

        <p className="text-gray-300 text-center text-lg">
          You've got <span className="text-unplayed-amber">{animatedCount}</span> unplayed.wtf files
        </p>

        <div className="mt-4 text-sm text-gray-400 text-center flex items-center justify-center">
          <span>
            That's approximately{' '}
            <span className="text-unplayed-pink">
              {animatedHours} hours
            </span>{' '}
            of potential gameplay
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
                  {isDemo
                    ? "Based on an average of 12.5 hours per game in Demo Mode"
                    : "Based on HowLongToBeat.com data where available, otherwise estimated at 12.5 hours per game"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Add percentage display in the white space */}
        <div className="mt-auto pt-6 text-center">
          <div className="text-2xl font-bold text-unplayed-amber mb-1">
            {unplayedPercentage}%
          </div>
          <p className="text-sm text-gray-400">
            of your {totalGames} game library is unplayed
          </p>
        </div>

        {isDemo && !document.cookie.includes("demo_note_dismissed") && (
          <div className="mt-4 text-center flex justify-center">
            <p className="text-sm text-unplayed-mint">
              You're in Demo Mode. Sign in to track your unplayed Games.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default withDemoIndicator(UnplayedCounter);
