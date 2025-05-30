
import { UnifiedLibraryStats } from '@/hooks/useUnifiedLibraryData';
import { countGenres, processGenres } from '@/utils/genre-processing';
import { processShelfLife } from '@/utils/shelf-life-processing';

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
  shelfLife?: any[];
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
    dataSource: 'raw_database',
    shelfLife: stats.shelfLife || []
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
    dataSource: 'filtered_display',
    shelfLife: stats.shelfLife || []
  };
}

/**
 * Transform unified data with genre processing for pie charts
 */
export function transformWithGenres(unifiedData: any[]) {
  if (!unifiedData || !Array.isArray(unifiedData)) {
    return { genres: [] };
  }

  // Count genres from the unified data
  const genreCounts = countGenres(unifiedData);
  
  // Process genres with consolidation
  const genres = processGenres(genreCounts);
  
  console.log('transformWithGenres - Processed genres:', {
    totalGames: unifiedData.length,
    genreCount: genres.length,
    topGenre: genres[0]?.name || 'None'
  });

  return { genres };
}

/**
 * Transform unified data to unplayed data format for components that need it
 */
export function transformToUnplayedData(unifiedData: any[], stats: UnifiedLibraryStats) {
  if (!unifiedData || !stats) {
    return {
      library: [],
      unplayedGames: [],
      totalGames: 0,
      unplayedCount: 0,
      totalPlaytime: 0,
      dustScore: 0,
      avgDustScore: 0,
      shelfLife: []
    };
  }

  // Filter unplayed games
  const unplayedItems = unifiedData.filter(item => 
    !item.playtime_minutes || item.playtime_minutes === 0
  );

  // Process shelf life data
  const shelfLife = processShelfLife(unplayedItems);

  console.log('transformToUnplayedData - Processed unplayed data:', {
    totalLibrary: unifiedData.length,
    unplayedCount: unplayedItems.length,
    shelfLifeCount: shelfLife.length,
    dataSource: 'unified_transform'
  });

  return {
    library: unifiedData.map(item => ({
      id: item.game_id,
      name: item.games?.name || 'Unknown Game',
      image: item.games?.header_image || item.games?.image_url,
      playtime: item.playtime_minutes || 0,
      dustScore: item.dust_score || 0,
      addedDate: item.acquisition_date,
      genres: item.games?.genres || []
    })),
    unplayedGames: unplayedItems.map(item => ({
      id: item.game_id,
      name: item.games?.name || 'Unknown Game',
      image: item.games?.header_image || item.games?.image_url,
      playtime: 0,
      dustScore: item.dust_score || 0,
      addedDate: item.acquisition_date,
      releaseDate: item.games?.release_date
    })),
    totalGames: stats.totalGamesInDB, // Use raw DB count
    unplayedCount: stats.unplayedGamesInDB, // Use raw DB count
    totalPlaytime: stats.totalPlaytimeInDB, // Use raw DB count
    dustScore: stats.totalDustScoreInDB, // Use raw DB count
    avgDustScore: stats.totalGamesInDB > 0 ? stats.totalDustScoreInDB / stats.totalGamesInDB : 0,
    shelfLife
  };
}
