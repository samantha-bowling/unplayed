
/**
 * Standardized game definitions and utilities
 * Single source of truth for game classification logic
 */

export interface GameWithPlaytime {
  playtime_minutes?: number | null;
}

/**
 * Standardized check if a game is unplayed
 * Handles null/undefined consistently across all components
 */
export function isGameUnplayed(playtime_minutes: number | null | undefined): boolean {
  return !playtime_minutes || playtime_minutes === 0;
}

/**
 * Filter games to only unplayed ones using consistent logic
 */
export function filterUnplayedGames<T extends GameWithPlaytime>(games: T[]): T[] {
  return games.filter(game => isGameUnplayed(game.playtime_minutes));
}

/**
 * Get standardized game counts from a list of games
 */
export function getGameCounts<T extends GameWithPlaytime>(games: T[]) {
  const totalGames = games.length;
  const unplayedGames = filterUnplayedGames(games);
  const playedGames = games.filter(game => !isGameUnplayed(game.playtime_minutes));
  
  return {
    totalGames,
    unplayedGames: unplayedGames.length,
    playedGames: playedGames.length,
    unplayedGamesList: unplayedGames,
    playedGamesList: playedGames
  };
}
