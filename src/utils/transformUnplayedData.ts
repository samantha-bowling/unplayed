
import { UnplayedDataType, GameListItem } from '@/types/unplayed-data.types';
import { calculateCleanScore } from './clean-score-utils';
import { processGenres, countGenres } from './genre-processing';
import { calculateRecentlyPlayedGames as calculateRecentlyPlayed } from './activity-insights';

/**
 * Transforms user game data into a structured format for the dashboard.
 * Uses enhanced dust score and clean score calculations.
 */
export const transformUserGameData = (
  userGamesData: any[]
): UnplayedDataType => {
  console.log('transformUserGameData called with:', {
    userGamesDataLength: userGamesData.length
  });

  // Initialize accumulators
  let totalPlaytime = 0;
  let totalSpent = 0;
  let totalDustScore = 0; // Sum of all dust scores
  const gamesList: GameListItem[] = [];

  // Process each game
  userGamesData.forEach(game => {
    const gameData = game.games;

    // Ensure gameData is valid before proceeding
    if (!gameData) return;

    const price = gameData.price_cents ? (gameData.price_cents / 100) : 0;
    const playtimeMinutes = game.playtime_minutes || 0;
    const dustScore = game.dust_score || 0; // Use the dust score from database (enhanced calculation)

    console.log('Processing game:', {
      gameId: game.game_id,
      gameName: gameData.name,
      dustScore: dustScore,
      playtimeMinutes: playtimeMinutes
    });

    // Accumulate total playtime
    totalPlaytime += playtimeMinutes;

    // Accumulate total spent
    totalSpent += price;

    // Accumulate total dust score (sum, not average)
    totalDustScore += dustScore;

    // Populate games list with proper image field mapping
    gamesList.push({
      id: game.game_id,
      name: gameData.name,
      image: gameData.image_url || gameData.header_image || '',
      image_url: gameData.image_url || null, // Add image_url field for picker compatibility
      header_image: gameData.header_image || null, // Add header_image field for picker compatibility
      playtimeMinutes: playtimeMinutes,
      lastPlayed: game.last_played_date || null,
      added: null, // No longer using acquisition_date
      price: price,
      price_cents: gameData.price_cents || null, // Add price_cents for compatibility
      genres: gameData.genres || [],
      notes: game.notes || null,
      hidden: game.hidden || false,
      releaseDate: gameData.release_date || null,
      release_date: gameData.release_date || null, // Add release_date for compatibility
      metacritic: gameData.metacritic_score || null,
      metacritic_score: gameData.metacritic_score || null, // Add metacritic_score for compatibility
      categories: gameData.categories || [],
    });
  });

  console.log('Transform results:', {
    totalGames: userGamesData.length,
    totalDustScore: totalDustScore,
    gamesList: gamesList.length
  });

  // Calculate unplayed games count
  const unplayedGames = gamesList.filter(game => game.playtimeMinutes === 0).length;

  // Process genres using consolidated logic
  const genreCounts = countGenres(userGamesData);
  const genresArray = processGenres(genreCounts);

  // Calculate shelf life - get oldest unplayed games by RELEASE DATE only
  const unplayedGamesList = gamesList.filter(game => game.playtimeMinutes === 0);
  const shelfLife = unplayedGamesList
    .filter(game => game.releaseDate) // Only games with release dates
    .sort((a, b) => {
      const dateA = new Date(a.releaseDate!).getTime();
      const dateB = new Date(b.releaseDate!).getTime();
      return dateA - dateB; // Oldest release date first
    })
    .slice(0, 50) // Get top 50 oldest by release date
    .map(game => ({
      id: game.id,
      name: game.name,
      image: game.image || '',
      addedDate: null, // No longer using acquisition_date
      releaseDate: game.releaseDate,
      price: game.price,
      genres: game.genres
    }));

  // Convert gamesList to LibraryItem format for library preview
  const libraryItems = gamesList.map(game => ({
    id: game.id,
    name: game.name,
    image: game.image || '',
    playtime: game.playtimeMinutes
  }));

  // Calculate recently played games count using standardized method from activity-insights
  const recentlyPlayedCount = calculateRecentlyPlayed(gamesList);

  const playedGames = gamesList.filter(game => game.playtimeMinutes > 0).length;
  const totalPlaytimeHours = totalPlaytime / 60;

  // Calculate enhanced clean score using the simplified algorithm
  const { 
    cleanScore, 
    breakdown: legacyCleanScoreBreakdown, 
    tier: cleanTier, 
    cleanStreak,
    recentlyPlayedUnplayed,
    streakMetadata
  } = calculateCleanScore(
    playedGames, 
    userGamesData.length, 
    totalPlaytimeHours, 
    gamesList
    // Don't pass recentlyPlayedCount - let the function calculate it
  );

  return {
    unplayedGames,
    totalGames: userGamesData.length,
    dustScore: totalDustScore, // Use sum of all dust scores (not average)
    totalPlaytime: totalPlaytimeHours,
    totalSpent,
    unplayedSpent: 0, // This will be populated later
    genres: genresArray,
    shelfLife: shelfLife,
    library: libraryItems,
    gamesList: gamesList,
    cleanScore,
    cleanScoreBreakdown: legacyCleanScoreBreakdown,
    cleanTier,
    cleanStreak,
    recentlyPlayedCount,
    recentlyPlayedUnplayed,
    cleanStreakMetadata: streakMetadata
  };
};
