
import React, { useMemo } from 'react';
import { withDemoIndicator, WithDemoProps } from './withDemoIndicator';
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';
import { useUnplayedData } from '@/hooks/useUnplayedData';
import { useAnimatedCounter } from '@/hooks/use-animated-counter';
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

const UnplayedCounter = React.memo<UnplayedCounterProps>(({
  count,
  compact = false,
  isDemo = false
}: UnplayedCounterProps) => {
  const { data: unplayedData } = useUnplayedData();
  const { isDemo: contextIsDemo } = useDemoMode();
  const { user } = useAuth();

  // Memoized base calculations
  const calculatedData = useMemo(() => {
    const actualCount = count ?? unplayedData.unplayedGames;
    const totalGames = unplayedData.totalGames;
    const unplayedPercentage = totalGames > 0 ? Math.round((actualCount / totalGames) * 100) : 0;
    const potentialHours = unplayedData.potentialGameplayHours ?? actualCount * 12.5;
    const isDemoMode = isDemo || contextIsDemo;
    
    return {
      actualCount,
      totalGames,
      unplayedPercentage,
      potentialHours,
      isDemoMode
    };
  }, [count, unplayedData.unplayedGames, unplayedData.totalGames, unplayedData.potentialGameplayHours, isDemo, contextIsDemo]);

  // Animated counters with demo-aware speed
  const animatedCount = useAnimatedCounter({
    targetValue: calculatedData.actualCount,
    duration: 1500,
    isDemo: calculatedData.isDemoMode
  });

  const animatedHours = useAnimatedCounter({
    targetValue: Math.round(calculatedData.potentialHours),
    duration: 1500,
    isDemo: calculatedData.isDemoMode
  });

  // Memoized tooltip content to prevent recreation
  const tooltipContent = useMemo(() => ({
    unplayed: "Includes games with 0 recorded minutes of playtime",
    hours: calculatedData.isDemoMode
      ? "Based on an average of 12.5 hours per game in Demo Mode"
      : "Based on HowLongToBeat.com data where available, otherwise estimated at 12.5 hours per game"
  }), [calculatedData.isDemoMode]);

  // Memoized demo note content
  const demoNote = useMemo(() => {
    if (!calculatedData.isDemoMode || document.cookie.includes("demo_note_dismissed")) {
      return null;
    }
    return (
      <div className="mt-4 text-center flex justify-center">
        <p className="text-sm text-unplayed-mint">
          You're in Demo Mode. Sign in to track your unplayed Games.
        </p>
      </div>
    );
  }, [calculatedData.isDemoMode]);

  // Render compact version
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
                  <p>{tooltipContent.unplayed}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="text-right">
          <div className="text-lg font-medium text-unplayed-amber">
            {calculatedData.unplayedPercentage}%
          </div>
          <div className="text-xs text-gray-400">
            of library
          </div>
        </div>
      </div>
    );
  }

  // Render full version
  return (
    <div className={`terminal-container ${calculatedData.isDemoMode ? 'relative' : ''} equal-height-container`}>
      <h3 className="terminal-header text-2xl mb-2">unplayed Games</h3>

      <div className="terminal-content flex flex-col py-6">
        <div className="text-5xl md:text-6xl font-bold font-vt text-unplayed-mint mb-2 text-center">
          {animatedCount}
        </div>

        <p className="text-gray-300 text-center text-lg mb-4">
          You've got <span className="text-unplayed-amber">{animatedCount}</span> unplayed.wtf files
        </p>

        <div className="text-sm text-gray-400 text-center flex items-center justify-center mb-3">
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
                <p>{tooltipContent.hours}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-unplayed-amber mb-1">
            {calculatedData.unplayedPercentage}%
          </div>
          <p className="text-sm text-gray-400">
            of your {calculatedData.totalGames} game library is unplayed
          </p>
        </div>

        {demoNote}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for optimal re-rendering
  return (
    prevProps.count === nextProps.count &&
    prevProps.compact === nextProps.compact &&
    prevProps.isDemo === nextProps.isDemo
  );
});

UnplayedCounter.displayName = 'UnplayedCounter';

export default withDemoIndicator(UnplayedCounter);
