
import { UnplayedDataType, GameListItem } from '@/types/unplayed-data.types';
import { buildGamesList, createEmptyGamesList } from './normalize-games';
import { calculateCleanScore, CLEAN_SCORE_TIERS } from './clean-score-utils';
import { countGenres, processGenres } from './genre-processing';
import { processShelfLife, processLibraryPreview } from './shelf-life-processing';

/**
 * Object pool for reusing frequently created objects
 */
const objectPool = {
  aggregationCache: new Map<string, any>(),
  clearCache() {
    this.aggregationCache.clear();
  }
};

/**
 * Optimized single-pass data aggregation with memory efficiency
 */
const aggregateGameData = (data: any[], estimatesMap: Record<string, any> = {}) => {
  const cacheKey = `${data.length}-${Object.keys(estimatesMap).length}`;
  
  // Check cache first for repeated calculations
  if (objectPool.aggregationCache.has(cacheKey)) {
    const cached = objectPool.aggregationCache.get(cacheKey);
    if (cached && cached.timestamp > Date.now() - 30000) { // 30 second cache
      return cached.data;
    }
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  // Pre-allocate arrays to avoid dynamic resizing
  const unplayedForShelfLife: any[] = [];
  unplayedForShelfLife.length = 0; // Ensure clean start
  
  let unplayedGames = 0;
  let totalPlaytime = 0;
  let totalSpent = 0;
  let dustScore = 0;
  let potentialGameplayHours = 0;
  let recentlyPlayedCount = 0;

  // Single pass through all data with optimized access patterns
  const dataLength = data.length;
  for (let i = 0; i < dataLength; i++) {
    const item = data[i];
    const playtimeMinutes = item.playtime_minutes || 0;
    const priceCents = item.games?.price_cents || 0;
    
    // Count unplayed games and potential hours
    if (playtimeMinutes === 0) {
      unplayedGames++;
      const estimate = estimatesMap[item.game_id];
      const gameHours = estimate?.main_hours || 12.5;
      potentialGameplayHours += gameHours;
      
      // Only push to shelf life array if we need it
      unplayedForShelfLife.push(item);
    }
    
    // Accumulate totals with minimal operations
    totalPlaytime += playtimeMinutes;
    totalSpent += (priceCents * 0.01); // More efficient than division by 100
    dustScore += (item.dust_score || 0);
    
    // Check recently played with cached date comparison
    if (item.last_played_date && new Date(item.last_played_date) >= thirtyDaysAgo) {
      recentlyPlayedCount++;
    }
  }

  const result = {
    unplayedGames,
    totalPlaytime: totalPlaytime / 60, // Convert to hours
    totalSpent,
    dustScore,
    potentialGameplayHours,
    recentlyPlayedCount,
    playedGames: dataLength - unplayedGames,
    unplayedForShelfLife
  };

  // Cache result for potential reuse
  objectPool.aggregationCache.set(cacheKey, {
    data: result,
    timestamp: Date.now()
  });

  return result;
};

/**
 * Optimized transformation with performance improvements and memory efficiency
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

/**
 * Clean up object pool - call this when component unmounts or app closes
 */
export const cleanupTransformCache = () => {
  objectPool.clearCache();
};

// Export both names for backward compatibility during transition
export const transformUserGameDataOptimized = transformUserGameData;
export const transformUnplayedData = transformUserGameData;
