
import { isGameUnplayed } from './game-definitions';

export interface SpendingGame {
  id: number;
  name: string;
  playtimeMinutes: number;
  price: number;
  originalPrice?: number;
  image?: string;
}

export interface SpendingStats {
  totalSpent: number;
  totalSaved: number;
  gameCount: number;
  topSpendingGames: SpendingGame[];
  averagePrice: number;
}

/**
 * Calculate spending statistics for a list of games
 * @param games Array of games with spending data
 * @param onlyUnplayed Whether to filter to only unplayed games
 * @returns Calculated spending statistics
 */
export function calculateSpendingStats(
  games: SpendingGame[], 
  onlyUnplayed: boolean = true
): SpendingStats {
  // UPDATED: Use standardized game classification logic
  const filteredGames = onlyUnplayed 
    ? games.filter(game => isGameUnplayed(game.playtimeMinutes))
    : games;

  const totalSpent = filteredGames.reduce((sum, game) => sum + game.price, 0);
  const totalSaved = filteredGames.reduce((sum, game) => {
    if (game.originalPrice && game.originalPrice > game.price) {
      return sum + (game.originalPrice - game.price);
    }
    return sum;
  }, 0);

  const topSpendingGames = filteredGames
    .sort((a, b) => b.price - a.price)
    .slice(0, 10);

  const averagePrice = filteredGames.length > 0 ? totalSpent / filteredGames.length : 0;

  return {
    totalSpent,
    totalSaved,
    gameCount: filteredGames.length,
    topSpendingGames,
    averagePrice,
  };
}

/**
 * Group games by price ranges for distribution analysis
 */
export function groupGamesByPriceRange(games: SpendingGame[]): { [range: string]: SpendingGame[] } {
  const ranges: { [range: string]: SpendingGame[] } = {
    'Free': [],
    '$0.01-$4.99': [],
    '$5-$9.99': [],
    '$10-$19.99': [],
    '$20-$39.99': [],
    '$40-$59.99': [],
    '$60+': [],
  };

  games.forEach(game => {
    if (game.price === 0) {
      ranges['Free'].push(game);
    } else if (game.price < 5) {
      ranges['$0.01-$4.99'].push(game);
    } else if (game.price < 10) {
      ranges['$5-$9.99'].push(game);
    } else if (game.price < 20) {
      ranges['$10-$19.99'].push(game);
    } else if (game.price < 40) {
      ranges['$20-$39.99'].push(game);
    } else if (game.price < 60) {
      ranges['$40-$59.99'].push(game);
    } else {
      ranges['$60+'].push(game);
    }
  });

  return ranges;
}
