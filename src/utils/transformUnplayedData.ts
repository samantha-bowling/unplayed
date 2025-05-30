
import { UnplayedDataType, GameListItem } from '@/types/unplayed-data.types';
import { calculateCleanScore } from './clean-score-utils';
import { processGenres, countGenres } from './genre-processing';

/**
 * Transforms user game data into a structured format for the dashboard.
 * Aggregates playtime, spending, and other relevant metrics.
 * Note: Removed acquisition_date dependencies as this data is unreliable.
 */
export const transformUserGameData = (
  userGamesData: any[],
  gameEstimatesData: Record<number, any> = {}
): UnplayedDataType => {
  // Initialize accumulators
  let totalPlaytime = 0;
  let totalSpent = 0;
  let totalDustScore = 0; // Add dust score accumulator
  const gamesList: GameListItem[] = [];

  // Process each game
  userGamesData.forEach(game => {
    const gameData = game.games;

    // Ensure gameData is valid before proceeding
    if (!gameData) return;

    const price = gameData.price_cents ? (gameData.price_cents / 100) : 0;
    const playtimeMinutes = game.playtime_minutes || 0;
    const dustScore = game.dust_score || 0;

    // Accumulate total playtime
    totalPlaytime += playtimeMinutes;

    // Accumulate total spent
    totalSpent += price;

    // Accumulate total dust score
    totalDustScore += dustScore;

    // Populate games list (removed acquisition_date reference)
    gamesList.push({
      id: game.game_id,
      name: gameData.name,
      image: gameData.image_url || gameData.header_image || '',
      playtimeMinutes: playtimeMinutes,
      lastPlayed: game.last_played_date || null,
      added: null, // Removed acquisition_date dependency
      price: price,
      genres: gameData.genres || [],
      notes: game.notes || null,
      hidden: game.hidden || false,
      releaseDate: gameData.release_date || null,
      metacritic: gameData.metacritic_score || null,
      categories: gameData.categories || [],
      completionEstimate: gameEstimatesData[game.game_id]?.completionist || null,
      mainStoryEstimate: gameEstimatesData[game.game_id]?.main_story || null,
      averageEstimate: gameEstimatesData[game.game_id]?.average || null,
      steamAppid: gameEstimatesData[game.game_id]?.steam_appid || null,
      howLongToBeatId: gameEstimatesData[game.game_id]?.how_long_to_beat_id || null,
    });
  });

  // Calculate unplayed games count
  const unplayedGames = gamesList.filter(game => game.playtimeMinutes === 0).length;

  // Process genres using new consolidation logic
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
      addedDate: null, // Removed acquisition_date dependency
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

  // Calculate recently played games count
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentlyPlayedCount = gamesList.filter(game => {
    if (!game.lastPlayed) return false;
    const lastPlayedDate = new Date(game.lastPlayed);
    return lastPlayedDate >= thirtyDaysAgo;
  }).length;

  // Calculate total potential gameplay hours
  const potentialGameplayHours = gamesList.reduce((sum, game) => {
    return sum + (game.completionEstimate || 0);
  }, 0);

  const playedGames = gamesList.filter(game => game.playtimeMinutes > 0).length;
  const totalPlaytimeHours = totalPlaytime / 60;

  // Calculate clean score using enhanced calculation
  const { 
    cleanScore, 
    breakdown: cleanScoreBreakdown, 
    tier: cleanTier, 
    cleanStreak,
    recentlyPlayedUnplayed,
    streakMetadata
  } = calculateCleanScore(
    playedGames, 
    userGamesData.length, 
    totalPlaytimeHours, 
    gamesList,
    recentlyPlayedCount
  );

  return {
    unplayedGames,
    totalGames: userGamesData.length,
    dustScore: totalDustScore, // Use accumulated dust score
    totalPlaytime: totalPlaytimeHours,
    totalSpent,
    unplayedSpent: 0, // This will be populated later
    potentialGameplayHours,
    genres: genresArray,
    shelfLife: shelfLife, // Now properly sorted by oldest release date only
    library: libraryItems,
    gamesList: gamesList,
    cleanScore,
    cleanScoreBreakdown,
    cleanTier,
    cleanStreak,
    recentlyPlayedCount,
    recentlyPlayedUnplayed,
    cleanStreakMetadata: streakMetadata
  };
};
