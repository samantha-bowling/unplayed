import { UnplayedDataType, GameListItem } from '@/types/unplayed-data.types';
import { buildGamesList, createEmptyGamesList } from './normalize-games';
import { calculateCleanScore, CLEAN_SCORE_TIERS } from './clean-score-utils';
import { countGenres, processGenres } from './genre-processing';
import { processShelfLife, processLibraryPreview } from './shelf-life-processing';
import { getBestGameImageFromDbData } from './image-utils';

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
    
    // Handle both nested and direct price access
    const priceCents = item.games?.price_cents || item.price_cents || 0;
    
    // Count unplayed games and potential hours
    if (playtimeMinutes === 0) {
      unplayedGames++;
      const estimate = estimatesMap[item.game_id];
      const gameHours = estimate?.main_hours || 12.5;
      potentialGameplayHours += gameHours;
      
      // Add to shelf life array with proper structure
      unplayedForShelfLife.push({
        id: item.id,
        game_id: item.game_id,
        name: item.games?.name || item.name || 'Unknown Game',
        addedDate: item.acquisition_date || new Date().toISOString(),
        // Use getBestGameImage logic here
        image: item.games?.header_image || item.games?.image_url || item.header_image || item.image_url,
        header_image: item.games?.header_image || item.header_image,
      });
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
 * Enhanced buildGamesList function that handles both demo and database data structures
 */
const buildGamesListFromDatabase = (data: any[]): GameListItem[] => {
  if (!data || data.length === 0) {
    return [];
  }

  console.log('Building games list from database data, sample item:', data[0]);

  return data.map((item: any) => {
    // Handle both nested and direct game data access
    const gameData = item.games || item;
    const gameId = item.game_id || item.id;
    
    return {
      id: gameId,
      name: gameData.name || 'Unknown Game',
      image: gameData.image_url || gameData.img_icon_url || null,
      header_image: gameData.header_image || gameData.img_logo_url || null,
      playtimeMinutes: item.playtime_minutes || 0,
      releaseDate: gameData.release_date || null,
      price: gameData.price_cents ? gameData.price_cents / 100 : undefined,
      genres: gameData.genres || [],
      categories: gameData.categories || [],
      addedDate: item.acquisition_date || undefined,
      dustScore: item.dust_score || 0,
    };
  });
};

/**
 * Enhanced processShelfLife function for database data with proper image handling
 */
const processShelfLifeFromDatabase = (unplayedForShelfLife: any[]) => {
  if (!unplayedForShelfLife || unplayedForShelfLife.length === 0) {
    return [];
  }

  // Sort by acquisition date (oldest first) and take top items
  const sortedGames = [...unplayedForShelfLife]
    .sort((a, b) => {
      const dateA = new Date(a.addedDate || '2000-01-01');
      const dateB = new Date(b.addedDate || '2000-01-01');
      return dateA.getTime() - dateB.getTime();
    })
    .slice(0, 50); // Limit to top 50 for performance

  return sortedGames.map((game: any) => ({
    id: game.game_id,
    name: game.name,
    addedDate: game.addedDate,
    // Use getBestGameImage to get the proper image URL with game ID for Steam CDN construction
    image: getBestGameImageFromDbData(game, game.game_id),
    header_image: game.header_image,
  }));
};

/**
 * Enhanced processLibraryPreview function for database data with proper image handling
 * This creates a small preview for dashboard display, not for pagination
 */
const processLibraryPreviewFromDatabase = (data: any[]) => {
  if (!data || data.length === 0) {
    return [];
  }

  console.log('Processing library preview from database data, sample item:', data[0]);

  // Take a small sample of games for the dashboard library preview only
  return data.slice(0, 12).map((item: any) => {
    const gameData = item.games || item;
    const gameId = item.game_id || item.id;
    
    // Use the enhanced image utility for proper image handling
    const image = getBestGameImageFromDbData(item, gameId);
    
    console.log('Library preview item image processing:', {
      gameId,
      gameName: gameData.name,
      originalHeaderImage: gameData.header_image,
      originalImageUrl: gameData.image_url,
      finalImage: image
    });
    
    return {
      id: gameId,
      name: gameData.name || 'Unknown Game',
      image: image,
      playtime: item.playtime_minutes || 0,
    };
  });
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

  console.log('Transforming user game data, sample item:', data[0]);

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

  // Step 3: Process genres efficiently - handle nested structure
  const genreCounts = countGenres(data.map(item => ({
    ...item,
    genres: item.games?.genres || item.genres || []
  })));
  const genres = processGenres(genreCounts);

  // Step 4: Process shelf life and library preview using enhanced functions
  const shelfLife = processShelfLifeFromDatabase(aggregated.unplayedForShelfLife);
  const library = processLibraryPreviewFromDatabase(data);

  // Step 5: Use enhanced buildGamesList for database data - this includes ALL games
  const gamesList = buildGamesListFromDatabase(data);
  
  // Step 6: Generate clean streak (simulated value)
  const cleanStreak = Math.min(7, Math.max(1, Math.floor(Math.random() * 7) + 1));

  console.log('Transformation complete:', {
    totalGames: data.length,
    unplayedGames: aggregated.unplayedGames,
    shelfLifeCount: shelfLife.length,
    libraryCount: library.length,
    gamesListCount: gamesList.length
  });

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
    gamesList, // This now contains ALL games, not just a preview
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
