
import { UnplayedDataType, GameListItem } from '@/types/unplayed-data.types';
import { buildGamesList, createEmptyGamesList } from './normalize-games';
import { calculateCleanScore, CLEAN_SCORE_TIERS } from './clean-score-utils';
import { countGenres, processGenres } from './genre-processing';
import { processShelfLife, processLibraryPreview } from './shelf-life-processing';

/**
 * Optimized single-pass data aggregation
 */
const aggregateGameData = (data: any[], estimatesMap: Record<string, any> = {}) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const unplayedForShelfLife: any[] = [];
  
  let unplayedGames = 0;
  let totalPlaytime = 0;
  let totalSpent = 0;
  let dustScore = 0;
  let potentialGameplayHours = 0;
  let recentlyPlayedCount = 0;

  // Single pass through all data
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const playtimeMinutes = item.playtime_minutes || 0;
    const priceCents = item.games?.price_cents || 0;
    
    // Count unplayed games and potential hours
    if (playtimeMinutes === 0) {
      unplayedGames++;
      const estimate = estimatesMap[item.game_id];
      const gameHours = estimate?.main_hours || 12.5;
      potentialGameplayHours += gameHours;
      unplayedForShelfLife.push(item);
    }
    
    // Accumulate totals
    totalPlaytime += playtimeMinutes;
    totalSpent += (priceCents / 100);
    dustScore += (item.dust_score || 0);
    
    // Check recently played
    if (item.last_played_date && new Date(item.last_played_date) >= thirtyDaysAgo) {
      recentlyPlayedCount++;
    }
  }

  return {
    unplayedGames,
    totalPlaytime: totalPlaytime / 60, // Convert to hours
    totalSpent,
    dustScore,
    potentialGameplayHours,
    recentlyPlayedCount,
    playedGames: data.length - unplayedGames,
    unplayedForShelfLife
  };
};

/**
 * Optimized transformation with performance improvements
 * Works for both demo and live data while maintaining consistent output structure
 */
export const transformUserGameData = (data: any[], estimatesMap: Record<string, any> = {}): UnplayedDataType => {
  if (!data || data.length === 0) {
    return {
      unplayedGames: 0,
      totalGames: 0,
      dustScore: 0,
      totalPlaytime: 0,
      totalSpent: 0,
      potentialGameplayHours: 0,
      genres: [],
      shelfLife: [],
      library: [],
      gamesList: createEmptyGamesList(),
      cleanScore: 0,
      cleanScoreBreakdown: {
        completionRate: 0,
        engagementFactor: 0,
        recencyFactor: 0
      },
      cleanTier: CLEAN_SCORE_TIERS[CLEAN_SCORE_TIERS.length - 1],
      cleanStreak: 0,
      recentlyPlayedCount: 0
    };
  }

  // Step 1: Aggregate all numeric data in single pass
  const aggregated = aggregateGameData(data, estimatesMap);

  // Step 2: Calculate clean score using optimized helper
  const { cleanScore, breakdown: cleanScoreBreakdown, tier: cleanTier } = calculateCleanScore(
    aggregated.playedGames,
    data.length,
    aggregated.totalPlaytime,
    12.5,
    aggregated.recentlyPlayedCount
  );

  // Step 3: Process genres efficiently
  const genreCounts = countGenres(data);
  const genres = processGenres(genreCounts);

  // Step 4: Process shelf life and library preview
  const shelfLife = processShelfLife(aggregated.unplayedForShelfLife);
  const library = processLibraryPreview(data);

  // Step 5: Use existing buildGamesList for consistency
  const gamesList = buildGamesList(data);
  
  // Step 6: Generate clean streak (simulated value)
  const cleanStreak = Math.min(7, Math.max(1, Math.floor(Math.random() * 7) + 1));

  return {
    unplayedGames: aggregated.unplayedGames,
    totalGames: data.length,
    dustScore: aggregated.dustScore,
    totalPlaytime: aggregated.totalPlaytime,
    totalSpent: aggregated.totalSpent,
    potentialGameplayHours: aggregated.potentialGameplayHours,
    genres,
    shelfLife,
    library,
    gamesList,
    cleanScore,
    cleanScoreBreakdown,
    cleanTier,
    cleanStreak,
    recentlyPlayedCount: aggregated.recentlyPlayedCount
  };
};

// Export both names for backward compatibility during transition
export const transformUserGameDataOptimized = transformUserGameData;
export const transformUnplayedData = transformUserGameData;
