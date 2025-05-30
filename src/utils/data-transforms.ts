
import { UnifiedLibraryStats } from '@/hooks/useUnifiedLibraryData';

export interface DashboardMetrics {
  unplayedGames: number;
  totalGames: number;
  dustScore: number;
  totalPlaytime: number;
  cleanScore: number;
  recentlyPlayedCount: number;
  playedGames: number;
  metadataCompletionPercentage?: number;
  dataSource: 'raw_database' | 'filtered_display';
}

/**
 * Transform unified library stats to dashboard metrics
 * NOW PRIORITIZES RAW DATABASE STATISTICS for accuracy
 */
export function transformToDashboardMetrics(stats: UnifiedLibraryStats): DashboardMetrics {
  // Use raw database statistics as the authoritative source
  const totalGames = stats.totalGamesInDB;
  const unplayedGames = stats.unplayedGamesInDB;
  const playedGames = stats.playedGamesInDB;
  const dustScore = stats.totalDustScoreInDB;
  const totalPlaytime = stats.totalPlaytimeInDB;
  
  // Calculate clean score (inverse of dust score, normalized)
  const cleanScore = totalGames > 0 ? Math.max(0, 100 - Math.round(dustScore / totalGames)) : 0;
  
  console.log('transformToDashboardMetrics - Using RAW database statistics:', {
    totalGames,
    unplayedGames,
    playedGames,
    dustScore,
    totalPlaytime,
    cleanScore,
    dataSource: 'raw_database',
    metadataCompletion: stats.metadataCompletionPercentage
  });

  return {
    unplayedGames,
    totalGames,
    dustScore,
    totalPlaytime,
    cleanScore,
    recentlyPlayedCount: stats.recentlyPlayedCount,
    playedGames,
    metadataCompletionPercentage: stats.metadataCompletionPercentage,
    dataSource: 'raw_database'
  };
}

/**
 * Legacy transform function for backward compatibility
 * Will be deprecated once all components use the new approach
 */
export function transformToDisplayMetrics(stats: UnifiedLibraryStats): DashboardMetrics {
  // Use filtered display statistics (games with valid metadata only)
  const totalGames = stats.totalGames;
  const unplayedGames = stats.unplayedGames;
  const playedGames = stats.playedGames;
  const dustScore = stats.totalDustScore;
  const totalPlaytime = stats.totalPlaytime;
  
  const cleanScore = totalGames > 0 ? Math.max(0, 100 - Math.round(dustScore / totalGames)) : 0;
  
  console.log('transformToDisplayMetrics - Using FILTERED display statistics:', {
    totalGames,
    unplayedGames,
    playedGames,
    dustScore,
    totalPlaytime,
    cleanScore,
    dataSource: 'filtered_display'
  });

  return {
    unplayedGames,
    totalGames,
    dustScore,
    totalPlaytime,
    cleanScore,
    recentlyPlayedCount: stats.recentlyPlayedCount,
    playedGames,
    metadataCompletionPercentage: stats.metadataCompletionPercentage,
    dataSource: 'filtered_display'
  };
}
