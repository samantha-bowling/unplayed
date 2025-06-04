
import React, { useMemo } from 'react';
import { withDemoIndicator, WithDemoProps } from './withDemoIndicator';
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';
import { useUserMetrics } from '@/hooks/use-user-metrics';
import { useAnimatedCounter } from '@/hooks/use-animated-counter';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InfoIcon, Laugh, Smile, Meh, Frown } from 'lucide-react';

interface UnplayedCounterProps extends WithDemoProps {
  count?: number;
  compact?: boolean;
}

const UnplayedCounter = React.memo<UnplayedCounterProps>(({
  count,
  compact = false,
  isDemo = false
}: UnplayedCounterProps) => {
  const { data: userMetrics } = useUserMetrics();
  const { isDemo: contextIsDemo, demoData } = useDemoMode();
  const { user } = useAuth();

  // Memoized base calculations
  const calculatedData = useMemo(() => {
    const isDemoMode = isDemo || contextIsDemo;
    
    console.log('UnplayedCounter calculatedData:', {
      isDemoMode,
      userMetrics,
      count,
      demoData: {
        unplayedGames: demoData.unplayedGames,
        totalGames: demoData.totalGames
      }
    });
    
    // Use demo data if in demo mode
    if (isDemoMode) {
      const actualCount = count ?? demoData.unplayedGames;
      const totalGames = demoData.totalGames;
      const unplayedPercentage = totalGames > 0 ? Math.round((actualCount / totalGames) * 100) : 0;
      
      return {
        actualCount,
        totalGames,
        unplayedPercentage,
        isDemoMode
      };
    }
    
    // Use user metrics data
    const actualCount = count ?? userMetrics?.unplayedGames ?? 0;
    const totalGames = userMetrics?.totalGames ?? 0;
    const unplayedPercentage = totalGames > 0 ? Math.round((actualCount / totalGames) * 100) : 0;
    
    console.log('UnplayedCounter calculated values:', {
      actualCount,
      totalGames,
      unplayedPercentage,
      source: 'userMetrics'
    });
    
    return {
      actualCount,
      totalGames,
      unplayedPercentage,
      isDemoMode
    };
  }, [count, userMetrics, isDemo, contextIsDemo, demoData]);

  // Animated counters with demo-aware speed
  const animatedCount = useAnimatedCounter({
    targetValue: calculatedData.actualCount,
    duration: 1500,
    isDemo: calculatedData.isDemoMode
  });

  // Memoized tooltip content to prevent recreation
  const tooltipContent = useMemo(() => ({
    unplayed: "Includes games with 0 recorded minutes of playtime"
  }), []);

  // Memoized mood icon and tooltip based on percentage
  const moodData = useMemo(() => {
    const percentage = calculatedData.unplayedPercentage;
    if (percentage <= 25) {
      return { icon: Laugh, tooltip: "Backlog? What backlog?" };
    } else if (percentage <= 50) {
      return { icon: Smile, tooltip: "Moderate backlog" };
    } else if (percentage <= 75) {
      return { icon: Meh, tooltip: "It's getting dusty…" };
    } else {
      return { icon: Frown, tooltip: "You have a problem." };
    }
  }, [calculatedData.unplayedPercentage]);

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

  // Check if animation is complete to trigger glow effect
  const isAnimationComplete = animatedCount === calculatedData.actualCount;

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

  const MoodIcon = moodData.icon;

  // Render full version
  return (
    <div className={`terminal-container ${calculatedData.isDemoMode ? 'relative' : ''} equal-height-container`}>
      <h3 className="terminal-header text-2xl mb-2">unplayed Games</h3>

      <div className="terminal-content flex flex-col justify-center items-center py-6 flex-grow">
        <div className={`text-6xl md:text-7xl font-bold font-vt text-unplayed-mint mb-4 text-center transition-all duration-1000 ${
          isAnimationComplete ? 'drop-shadow-[0_0_10px_rgba(163,247,191,0.8)]' : ''
        }`}>
          {animatedCount}
        </div>

        <p className="text-gray-300 text-center text-xl mb-6" style={{ color: '#D1D5DB' }}>
          You've got <span className="text-unplayed-amber">{animatedCount}</span> unplayed games
        </p>

        <div className="text-center">
          <div className="text-3xl md:text-4xl font-bold text-unplayed-amber mb-2">
            {calculatedData.unplayedPercentage}%
          </div>
          <p className="text-xl mb-4" style={{ color: '#D1D5DB' }}>
            of your {calculatedData.totalGames} game library is unplayed
          </p>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex justify-center">
                  <MoodIcon size={48} className="text-gray-400 hover:text-gray-300 transition-colors cursor-help" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{moodData.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
