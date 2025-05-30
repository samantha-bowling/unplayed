
import React from 'react';
import { useUnifiedLibraryData } from '@/hooks/useUnifiedLibraryData';
import { transformToDashboardMetrics } from '@/utils/data-transforms';

interface LibraryStatsSectionProps {
  // Add props as needed
}

const LibraryStatsSection: React.FC<LibraryStatsSectionProps> = () => {
  const { stats: unifiedStats } = useUnifiedLibraryData();
  
  const dashboardMetrics = unifiedStats ? transformToDashboardMetrics(unifiedStats) : {
    unplayedGames: 0,
    totalGames: 0,
    dustScore: 0,
    totalPlaytime: 0,
    cleanScore: 0,
    recentlyPlayedCount: 0,
    playedGames: 0,
    dataSource: 'raw_database' as const
  };

  console.log('LibraryStatsSection - Using consistent data source:', {
    totalGames: dashboardMetrics.totalGames,
    unplayedGames: dashboardMetrics.unplayedGames,
    dataSource: dashboardMetrics.dataSource
  });

  return (
    <div className="library-stats-section">
      <h3>Library Statistics</h3>
      <p>Total Games: {dashboardMetrics.totalGames}</p>
      <p>Unplayed Games: {dashboardMetrics.unplayedGames}</p>
      <p>Data Source: {dashboardMetrics.dataSource}</p>
    </div>
  );
};

export default LibraryStatsSection;
