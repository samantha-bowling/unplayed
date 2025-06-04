
import React, { useMemo } from 'react';
import { withDemoIndicator, WithDemoProps } from './withDemoIndicator';
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';
import { useUserMetrics } from '@/hooks/use-user-metrics';

interface UnplayedCounterProps extends WithDemoProps {
  count?: number;
}

const UnplayedCounter = React.memo<UnplayedCounterProps>(({
  count,
  isDemo = false
}: UnplayedCounterProps) => {
  const { data: userMetrics, isLoading } = useUserMetrics();
  const { user } = useAuth();
  const { isDemo: contextIsDemo, demoData } = useDemoMode();
  
  const isDemoMode = isDemo || contextIsDemo;
  
  // Use consistent data sources - prioritize userMetrics for authenticated users
  const { unplayedCount, totalGames, unplayedPercentage } = useMemo(() => {
    if (isDemoMode) {
      const unplayed = demoData.unplayedGames || 847;
      const total = demoData.totalGames || 1200;
      return {
        unplayedCount: unplayed,
        totalGames: total,
        unplayedPercentage: Math.round((unplayed / total) * 100)
      };
    }
    
    // For authenticated users, use userMetrics as primary source
    if (count !== undefined) {
      // If count is passed as prop, use it but calculate percentage from userMetrics
      const total = userMetrics?.totalGames || 0;
      return {
        unplayedCount: count,
        totalGames: total,
        unplayedPercentage: total > 0 ? Math.round((count / total) * 100) : 0
      };
    }
    
    const unplayed = userMetrics?.unplayedGames || 0;
    const total = userMetrics?.totalGames || 0;
    
    return {
      unplayedCount: unplayed,
      totalGames: total,
      unplayedPercentage: total > 0 ? Math.round((unplayed / total) * 100) : 0
    };
  }, [count, userMetrics, isDemoMode, demoData]);

  console.log('UnplayedCounter Debug:', {
    propsCount: count,
    userMetricsUnplayed: userMetrics?.unplayedGames,
    userMetricsTotal: userMetrics?.totalGames,
    calculatedUnplayed: unplayedCount,
    calculatedTotal: totalGames,
    calculatedPercentage: unplayedPercentage,
    isDemoMode,
    isLoading
  });

  if (isLoading && !isDemoMode) {
    return (
      <div className="terminal-container equal-height-container">
        <h3 className="terminal-header text-2xl mb-0">Unplayed Games</h3>
        <div className="terminal-content flex flex-col items-center justify-center p-8">
          <div className="animate-pulse">
            <div className="w-24 h-24 rounded-full bg-gray-700 mb-4 mx-auto"></div>
            <div className="w-32 h-8 bg-gray-700 rounded mx-auto"></div>
          </div>
          <p className="text-gray-400 mt-4">Counting unplayed games...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`terminal-container ${isDemoMode ? 'relative' : ''} equal-height-container`}>
      <h3 className="terminal-header text-2xl mb-0">Unplayed Games</h3>
      
      <div className="terminal-content flex flex-col items-center justify-center py-8">
        <div className="relative mb-6">
          <div className="w-32 h-32 rounded-full border-4 border-gray-700 flex items-center justify-center bg-gray-800">
            <div className="text-center">
              <div className="text-4xl font-bold text-unplayed-mint mb-1">
                {unplayedCount.toLocaleString()}
              </div>
              <div className="text-sm text-gray-400">
                {unplayedPercentage}% of {totalGames.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <p className="text-gray-300 text-lg mb-2">
            Games gathering dust
          </p>
          <p className="text-gray-500 text-sm">
            Time to start playing!
          </p>
        </div>
      </div>

      {isDemoMode && !document.cookie.includes("demo_note_dismissed") && (
        <div className="mt-auto pt-4 text-center">
          <p className="text-sm text-unplayed-mint">
            You're in Demo Mode. Sign in to track your Unplayed Games.
          </p>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.count === nextProps.count &&
    prevProps.isDemo === nextProps.isDemo
  );
});

UnplayedCounter.displayName = 'UnplayedCounter';

export default withDemoIndicator(UnplayedCounter);
