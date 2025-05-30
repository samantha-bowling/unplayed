
import React from 'react';
import { useUnifiedLibraryData } from '@/hooks/useUnifiedLibraryData';
import { transformToDashboardMetrics } from '@/utils/data-transforms';

const IndexOptimized: React.FC = () => {
  const { data: unifiedData, stats: unifiedStats, isLoading } = useUnifiedLibraryData();
  
  const dashboardMetrics = unifiedStats ? transformToDashboardMetrics(unifiedStats) : {
    unplayedGames: 0,
    totalGames: 0,
    dustScore: 0,
    totalPlaytime: 0,
    cleanScore: 0,
    recentlyPlayedCount: 0,
    playedGames: 0,
  };

  if (isLoading) {
    return <div>Loading optimized dashboard...</div>;
  }

  return (
    <div className="optimized-index">
      <h1>Optimized Dashboard</h1>
      <p>This is a placeholder for the optimized index page.</p>
    </div>
  );
};

export default IndexOptimized;
