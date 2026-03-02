
import React, { useMemo } from 'react';
import { withDemoIndicator, WithDemoProps } from './withDemoIndicator';
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';
import { useUserMetrics } from '@/hooks/use-user-metrics';
import DustScoreIcon from './dust/DustScoreIcon';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InfoIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DustScoreProps extends WithDemoProps {
  score?: number;
}

const DustScoreMeter = React.memo<DustScoreProps>(({
  score,
  isDemo = false
}: DustScoreProps) => {
  const { data: userMetrics, isLoading } = useUserMetrics();
  const { user } = useAuth();
  const { isDemo: contextIsDemo, demoData } = useDemoMode();
  
  const isDemoMode = isDemo || contextIsDemo;
  
  // Determine the actual score to display - ensuring consistency with leaderboard
  const actualScore = useMemo(() => {
    if (isDemoMode) {
      // In demo mode, use demo data dust score
      return demoData.dustScore || 15420; // Fallback demo score
    }
    
    // For authenticated users, use user_metrics.totalDustScore for consistency
    // This is the SAME source the leaderboard uses
    const consistentScore = userMetrics?.totalDustScore || 0;
    
    
    return consistentScore;
  }, [userMetrics?.totalDustScore, isDemoMode, demoData.dustScore, score]);

  if (isLoading && !isDemoMode) {
    return (
      <div className="terminal-container equal-height-container">
        <h3 className="terminal-header text-2xl mb-0">Dust Score™</h3>
        <div className="terminal-content flex flex-col items-center justify-center p-8">
          <div className="animate-pulse">
            <div className="w-16 h-16 rounded-full bg-gray-700 mb-4 mx-auto"></div>
            <div className="w-32 h-8 bg-gray-700 rounded mx-auto"></div>
          </div>
          <p className="text-gray-400 mt-4">Calculating dust...</p>
        </div>
      </div>
    );
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

      <div className="terminal-content flex flex-col py-4">
        {/* Icon-Based Visualization */}
        <DustScoreIcon score={actualScore} isDemo={isDemoMode} />

        {user && !isDemoMode && (
          <div className="mt-6 flex justify-center">
            <Link
              to="/dust"
              className="px-4 py-2 bg-unplayed-pink hover:bg-unplayed-pink/90 text-white text-sm rounded-md transition-colors font-medium"
            >
              View Detailed Report
            </Link>
          </div>
        )}

        {isDemoMode && (
          <div className="mt-6 text-center">
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
