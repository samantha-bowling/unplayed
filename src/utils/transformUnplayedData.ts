import { UnplayedDataType, GameListItem } from '@/types/unplayed-data.types';
import { calculateCleanScore } from './clean-score-utils';

/**
 * Transforms user game data into a structured format for the dashboard.
 * Aggregates playtime, spending, and other relevant metrics.
 */
export const transformUserGameData = (
  userGamesData: any[],
  gameEstimatesData: Record<number, any> = {}
): UnplayedDataType => {
  // Initialize accumulators
  let totalPlaytime = 0;
  let totalSpent = 0;
  const genres: { [key: string]: number } = {};
  const shelfLife: { name: string; value: number }[] = [];
  const gamesList: GameListItem[] = [];

  // Process each game
  userGamesData.forEach(game => {
    const gameData = game.games;

    // Ensure gameData is valid before proceeding
    if (!gameData) return;

    const price = gameData.price_cents ? (gameData.price_cents / 100) : 0;
    const playtimeMinutes = game.playtime_minutes || 0;

    // Accumulate total playtime
    totalPlaytime += playtimeMinutes;

    // Accumulate total spent
    totalSpent += price;

    // Aggregate genres
    if (gameData.genres) {
      gameData.genres.forEach((genre: string) => {
        genres[genre] = (genres[genre] || 0) + 1;
      });
    }

    // Populate games list
    gamesList.push({
      id: game.game_id,
      name: gameData.name,
      image: gameData.image_url || gameData.header_image || '',
      playtimeMinutes: playtimeMinutes,
      lastPlayed: game.last_played_date || null,
      added: game.acquisition_date || null,
      price: price,
      genre: gameData.genres || [],
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

  // Convert genres object to array
  const genresArray = Object.entries(genres)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Calculate shelf life
  const now = new Date();
  const year = now.getFullYear();

  for (let i = 0; i < 5; i++) {
    const currentYear = year - i;
    const count = gamesList.filter(game => {
      if (!game.releaseDate) return false;
      const releaseYear = new Date(game.releaseDate).getFullYear();
      return releaseYear === currentYear;
    }).length;
    shelfLife.push({ name: String(currentYear), value: count });
  }

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
  const { cleanScore, breakdown: cleanScoreBreakdown, tier: cleanTier, cleanStreak } = 
    calculateCleanScore(
      playedGames, 
      userGamesData.length, 
      totalPlaytimeHours, 
      gamesList, // Pass the games list array instead of a number
      recentlyPlayedCount
    );

  return {
    unplayedGames,
    totalGames: userGamesData.length,
    dustScore: 0, // This will be populated later
    totalPlaytime: totalPlaytimeHours,
    totalSpent,
    unplayedSpent: 0, // This will be populated later
    potentialGameplayHours,
    genres: genresArray,
    shelfLife,
    library: gamesList,
    gamesList: gamesList,
    cleanScore,
    cleanScoreBreakdown,
    cleanTier,
    cleanStreak,
    recentlyPlayedCount
  };
};
