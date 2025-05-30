
import { UnifiedGameData, UnifiedLibraryStats } from '@/hooks/useUnifiedLibraryData';
import { UnplayedDataType, GameListItem } from '@/types/unplayed-data.types';
import { calculateCleanScore } from './clean-score-utils';
import { processGenres, countGenres } from './genre-processing';

/**
 * Transform unified library data to the legacy UnplayedDataType format
 * This maintains backward compatibility with existing components
 */
export const transformToUnplayedData = (
  unifiedData: UnifiedGameData[],
  stats: UnifiedLibraryStats
): UnplayedDataType => {
  // Convert unified data to GameListItem format
  const gamesList: GameListItem[] = unifiedData.map(game => ({
    id: game.game_id,
    name: game.games.name,
    image: game.games.image_url || game.games.header_image || '',
    playtimeMinutes: game.playtime_minutes || 0,
    lastPlayed: game.last_played_date,
    added: game.acquisition_date,
    price: game.games.price_cents ? (game.games.price_cents / 100) : 0,
    genres: game.games.genres || [],
    notes: game.notes,
    hidden: game.hidden || false,
    releaseDate: game.games.release_date,
    metacritic: game.games.metacritic_score,
    categories: game.games.categories || [],
    completionEstimate: null, // TODO: Add game estimates if needed
    mainStoryEstimate: null,
    averageEstimate: null,
    steamAppid: null,
    howLongToBeatId: null,
  }));

  // Process genres using existing logic
  const genreCounts = countGenres(unifiedData.map(game => ({ games: game.games })));
  const genresArray = processGenres(genreCounts);

  // Calculate shelf life - get oldest unplayed games by RELEASE DATE
  const unplayedGamesList = gamesList.filter(game => game.playtimeMinutes === 0);
  const shelfLife = unplayedGamesList
    .filter(game => game.releaseDate)
    .sort((a, b) => {
      const dateA = new Date(a.releaseDate!).getTime();
      const dateB = new Date(b.releaseDate!).getTime();
      return dateA - dateB;
    })
    .slice(0, 50)
    .map(game => ({
      id: game.id,
      name: game.name,
      image: game.image,
      addedDate: game.added,
      releaseDate: game.releaseDate,
      price: game.price,
      genres: game.genres
    }));

  // Convert to library preview format
  const libraryItems = gamesList.map(game => ({
    id: game.id,
    name: game.name,
    image: game.image,
    playtime: game.playtimeMinutes
  }));

  // Calculate clean score
  const totalPlaytimeHours = stats.totalPlaytime / 60;
  const { 
    cleanScore, 
    breakdown: cleanScoreBreakdown, 
    tier: cleanTier, 
    cleanStreak,
    recentlyPlayedUnplayed,
    streakMetadata
  } = calculateCleanScore(
    stats.playedGames,
    stats.totalGames,
    totalPlaytimeHours,
    gamesList,
    stats.recentlyPlayedCount
  );

  return {
    unplayedGames: stats.unplayedGames,
    totalGames: stats.totalGames,
    dustScore: stats.totalDustScore,
    totalPlaytime: totalPlaytimeHours,
    totalSpent: 0, // Will be populated by spending data
    unplayedSpent: 0, // Will be populated by spending data
    potentialGameplayHours: 0, // TODO: Calculate from estimates
    genres: genresArray,
    shelfLife: shelfLife,
    library: libraryItems,
    gamesList: gamesList,
    cleanScore,
    cleanScoreBreakdown,
    cleanTier,
    cleanStreak,
    recentlyPlayedCount: stats.recentlyPlayedCount,
    recentlyPlayedUnplayed,
    cleanStreakMetadata: streakMetadata
  };
};

/**
 * Transform unified library data to dashboard metrics
 * This provides a simple interface for dashboard components
 */
export const transformToDashboardMetrics = (stats: UnifiedLibraryStats) => {
  const totalPlaytimeHours = stats.totalPlaytime / 60;
  
  const { cleanScore } = calculateCleanScore(
    stats.playedGames,
    stats.totalGames,
    totalPlaytimeHours,
    [], // gamesList not needed for basic clean score
    stats.recentlyPlayedCount
  );

  return {
    unplayedGames: stats.unplayedGames,
    totalGames: stats.totalGames,
    dustScore: stats.totalDustScore,
    totalPlaytime: totalPlaytimeHours,
    cleanScore,
    recentlyPlayedCount: stats.recentlyPlayedCount,
    playedGames: stats.playedGames,
  };
};
