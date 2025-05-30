
import React from 'react';
import { useUnifiedLibraryData } from '@/hooks/useUnifiedLibraryData';

interface LibraryStatsSectionProps {
  // Add props as needed
}

const LibraryStatsSection: React.FC<LibraryStatsSectionProps> = () => {
  const { stats: unifiedStats, isLoading } = useUnifiedLibraryData();
  
  if (isLoading) {
    return (
      <div className="library-stats-section">
        <h3>Library Statistics</h3>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="library-stats-section">
      <h3>Library Statistics</h3>
      <p>Total Games: {unifiedStats?.totalGames || 0}</p>
      <p>Unplayed Games: {unifiedStats?.unplayedGames || 0}</p>
      <p>Total Dust Score: {unifiedStats?.totalDustScore || 0}</p>
      <p>Total Playtime: {Math.round((unifiedStats?.totalPlaytime || 0) / 60)} hours</p>
    </div>
  );
};

export default LibraryStatsSection;
