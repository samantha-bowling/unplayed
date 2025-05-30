
import React, { useMemo } from 'react';
import { withDemoIndicator, WithDemoProps } from './withDemoIndicator';
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';
import { useUnplayedData } from '@/hooks/useUnplayedData';
import { useAnimatedCounter } from '@/hooks/use-animated-counter';
import { calculateDustScoreDisplay, formatDustScore } from '@/utils/dust-score-display';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InfoIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import CleanScoreMeterSmall from './dust/CleanScoreMeterSmall';

interface DustScoreProps extends WithDemoProps {
  score?: number;
}

const DustScoreMeter = React.memo<DustScoreProps>(({
  score,
  isDemo = false
}: DustScoreProps) => {
  const { data: unplayedData, isLoading } = useUnplayedData();
  const { user } = useAuth();
  const { isDemo: contextIsDemo } = useDemoMode();
  
  const actualScore = score ?? unplayedData?.dustScore;
  const isDemoMode = isDemo || contextIsDemo;
  
  // Memoized display calculations
  const displayData = useMemo(() => 
    actualScore !== undefined ? calculateDustScoreDisplay(actualScore) : null,
    [actualScore]
  );
  
  // Animated counter with demo-aware speed
  const animatedScore = useAnimatedCounter({
    targetValue: actualScore || 0,
    duration: 2000,
    isDemo: isDemoMode
  });

  // Memoized SVG calculations
  const svgData = useMemo(() => {
    if (!displayData || !actualScore) return null;
    
    const scaledScore = actualScore / displayData.scaleFactor;
    const strokeDashArray = `${Math.min(scaledScore / displayData.maxDisplayScore, 1) * 283} 283`;
    const strokeColor = actualScore < 1000 ? '#A3F7BF' 
      : actualScore < 5000 ? '#FF9F39' 
      : actualScore < 10000 ? '#F6AD55' 
      : '#FF3C38';
    
    return { strokeDashArray, strokeColor };
  }, [displayData, actualScore]);

  // Memoized clean score display
  const showCleanScore = useMemo(() => 
    unplayedData?.cleanScore !== undefined && user,
    [unplayedData?.cleanScore, user]
  );

  if (isLoading) {
    return (
      <div className="terminal-container equal-height-container">
        <h3 className="terminal-header text-2xl mb-0">Dust Score™</h3>
        <div className="terminal-content flex flex-col items-center justify-center p-8">
          <div className="animate-pulse">
            <div className="w-32 h-32 rounded-full bg-gray-700"></div>
          </div>
          <p className="text-gray-400 mt-4">Calculating dust...</p>
        </div>
      </div>
    );
  }

  if (!displayData || actualScore === undefined) {
    return null;
  }

  return (
    <div className={`terminal-container ${isDemoMode ? 'relative' : ''} equal-height-container`}>
      <div className="mb-4 flex items-center">
        <h3 className="terminal-header text-2xl mb-0">Dust Score™</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="ml-2 text-gray-500 hover:text-gray-400">
                <InfoIcon size={16} />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>
                Dust Score shows your total accumulated dust across all games.
                Higher scores indicate more neglected games in your library.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="terminal-content flex flex-col items-center">
        <div className="relative w-48 h-48 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-gray-700"></div>
          {svgData && (
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#333" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={svgData.strokeColor}
                strokeWidth="8"
                strokeDasharray={svgData.strokeDashArray}
                className="transition-all duration-300"
              />
            </svg>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="absolute inset-0 flex flex-col items-center justify-center cursor-help">
                  <span className={`${displayData.severityColor} text-4xl font-bold font-vt ${actualScore >= 10000 ? 'text-3xl' : ''}`}>
                    {formatDustScore(animatedScore)}
                  </span>
                  <span className="text-gray-400 text-xs mt-1">DUST UNITS</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-center">
                <p className="text-sm">Total dust accumulated across all your games</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="text-center mt-2">
          <p className={`${displayData.severityColor} text-xl font-medium`}>
            {displayData.severityText}
          </p>
          <p className="text-sm text-gray-400 mt-2">
            {displayData.description}
          </p>
        </div>

        {showCleanScore && (
          <div className="mt-6 pt-3 border-t border-gray-700 w-full flex justify-center">
            <CleanScoreMeterSmall 
              score={unplayedData.cleanScore || 0} 
              tier={unplayedData.cleanTier}
            />
          </div>
        )}

        {user && !isDemoMode && (
          <div className="mt-4 pt-2">
            <Link
              to="/dust"
              className="px-4 py-2 bg-unplayed-mint/20 hover:bg-unplayed-mint/30 text-unplayed-mint text-sm rounded-md transition-colors"
            >
              View Detailed Report
            </Link>
          </div>
        )}

        {isDemoMode && !document.cookie.includes("demo_note_dismissed") && (
          <div className="mt-auto pt-4 text-center flex justify-center">
            <p className="text-sm text-unplayed-mint">
              You're in Demo Mode. Sign in to track your Dust Score.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for optimal re-rendering
  return (
    prevProps.score === nextProps.score &&
    prevProps.isDemo === nextProps.isDemo
  );
});

DustScoreMeter.displayName = 'DustScoreMeter';

export default withDemoIndicator(DustScoreMeter);
