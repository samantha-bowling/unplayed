
import { UnplayedDataType, GameListItem, ShelfLifeItem } from '@/types/unplayed-data.types';
import { calculateCleanScore } from './clean-score-utils';
import { processGenres, countGenres } from './genre-processing';

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

    // Populate games list
    gamesList.push({
      id: game.game_id,
      name: gameData.name,
      image: gameData.image_url || gameData.header_image || '',
      playtimeMinutes: playtimeMinutes,
      lastPlayed: game.last_played_date || null,
      added: game.acquisition_date || null,
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

  // Process genres using the enhanced utility
  const genreCounts = countGenres(userGamesData);
  const genresArray = processGenres(genreCounts);

  // Calculate shelf life by release year with proper ShelfLifeItem format
  const now = new Date();
  const year = now.getFullYear();
  const shelfLife: ShelfLifeItem[] = [];

  // Create shelf life data for the last 10 years
  for (let i = 0; i < 10; i++) {
    const currentYear = year - i;
    const gamesInYear = gamesList.filter(game => {
      if (!game.releaseDate) return false;
      const releaseYear = new Date(game.releaseDate).getFullYear();
      return releaseYear === currentYear;
    });
    
    if (gamesInYear.length > 0) {
      shelfLife.push({ 
        name: String(currentYear), 
        value: gamesInYear.length,
        games: gamesInYear.slice(0, 20) // Limit to first 20 games for performance
      });
    }
  }

  // Sort by oldest games first (by release date, then by acquisition date)
  const sortedOldestGames = gamesList
    .filter(game => game.playtimeMinutes === 0) // Only unplayed games
    .sort((a, b) => {
      // Primary sort by release date (oldest first)
      if (a.releaseDate && b.releaseDate) {
        const dateComparison = new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime();
        if (dateComparison !== 0) return dateComparison;
      }
      
      // If release dates are equal or missing, sort by acquisition date (oldest first)
      if (a.added && b.added) {
        return new Date(a.added).getTime() - new Date(b.added).getTime();
      }
      
      // Handle missing dates - games with dates come first
      if (a.releaseDate && !b.releaseDate) return -1;
      if (!a.releaseDate && b.releaseDate) return 1;
      if (a.added && !b.added) return -1;
      if (!a.added && b.added) return 1;
      
      return 0;
    });

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

  // Calculate total dust score
  const totalDustScore = userGamesData.reduce((sum, game) => sum + (game.dust_score || 0), 0);

  return {
    unplayedGames,
    totalGames: userGamesData.length,
    dustScore: totalDustScore,
    totalPlaytime: totalPlaytimeHours,
    totalSpent,
    unplayedSpent: 0, // This will be populated later
    potentialGameplayHours,
    genres: genresArray,
    shelfLife: sortedOldestGames, // Use the sorted games directly for shelf life display
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
