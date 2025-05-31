
import { isGameUnplayed } from './game-definitions';

export interface SpendingGame {
  id: number;
  name: string;
  playtimeMinutes: number;
  price: number;
  originalPrice?: number;
  image?: string;
}

export interface GameWithPrice {
  id: number;
  name: string;
  price_cents: number | null;
  playtime_minutes: number | null;
  image_url?: string | null;
  header_image?: string | null;
}

export interface GamePriceInfo {
  app_id: number;
  final_price_cents: number | null;
  initial_price_cents: number | null;
  discount_percent: number | null;
  currency: string;
}

export interface TopSpendingGame {
  id: number;
  title: string;
  price: number;
  originalPrice: number | null;
  discount: number | null;
  imageUrl: string | null;
  currency: string;
}

export interface SpendingBreakdown {
  totalSpent: number;
  totalSaved: number | null;
  freeGamesCount: number;
  unknownPriceGamesCount: number;
  paidGamesCount: number;
  currency: string;
  confidence: 'high' | 'medium' | 'low';
  dataQuality: {
    gamesWithPriceData: number;
    gamesWithMissingData: number;
    gamesActuallyFree: number;
    invalidPricesRejected: number;
    totalRejectedValueDollars: number;
  };
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
 * Enhanced spending calculation using enhanced price data
 */
export function calculateSpending(
  games: GameWithPrice[],
  priceDataMap: Map<number, GamePriceInfo>,
  onlyUnplayed: boolean = true
): SpendingBreakdown {
  const filteredGames = onlyUnplayed 
    ? games.filter(game => isGameUnplayed(game.playtime_minutes))
    : games;

  let totalSpent = 0;
  let totalSaved = 0;
  let freeGamesCount = 0;
  let paidGamesCount = 0;
  let gamesWithPriceData = 0;
  let gamesActuallyFree = 0;

  filteredGames.forEach(game => {
    const priceData = priceDataMap.get(game.id);
    const finalPrice = priceData?.final_price_cents || game.price_cents || 0;
    const initialPrice = priceData?.initial_price_cents;

    if (finalPrice === 0) {
      freeGamesCount++;
      gamesActuallyFree++;
    } else {
      paidGamesCount++;
      totalSpent += finalPrice / 100;
    }

    if (priceData) {
      gamesWithPriceData++;
      if (initialPrice && initialPrice > finalPrice) {
        totalSaved += (initialPrice - finalPrice) / 100;
      }
    }
  });

  const confidence: 'high' | 'medium' | 'low' = 
    gamesWithPriceData / filteredGames.length > 0.8 ? 'high' :
    gamesWithPriceData / filteredGames.length > 0.5 ? 'medium' : 'low';

  return {
    totalSpent,
    totalSaved: totalSaved > 0 ? totalSaved : null,
    freeGamesCount,
    unknownPriceGamesCount: filteredGames.length - gamesWithPriceData,
    paidGamesCount,
    currency: 'USD',
    confidence,
    dataQuality: {
      gamesWithPriceData,
      gamesWithMissingData: filteredGames.length - gamesWithPriceData,
      gamesActuallyFree,
      invalidPricesRejected: 0,
      totalRejectedValueDollars: 0
    }
  };
}

/**
 * Generate top spending games list
 */
export function generateTopSpendingGames(
  games: GameWithPrice[],
  priceDataMap: Map<number, GamePriceInfo>,
  onlyUnplayed: boolean = true,
  limit: number = 10
): TopSpendingGame[] {
  const filteredGames = onlyUnplayed 
    ? games.filter(game => isGameUnplayed(game.playtime_minutes))
    : games;

  return filteredGames
    .map(game => {
      const priceData = priceDataMap.get(game.id);
      const finalPrice = priceData?.final_price_cents || game.price_cents || 0;
      const initialPrice = priceData?.initial_price_cents;

      return {
        id: game.id,
        title: game.name,
        price: finalPrice / 100,
        originalPrice: initialPrice ? initialPrice / 100 : null,
        discount: priceData?.discount_percent || null,
        imageUrl: game.image_url || game.header_image,
        currency: 'USD'
      };
    })
    .sort((a, b) => b.price - a.price)
    .slice(0, limit);
}

/**
 * Format spending display information
 */
export function formatSpendingDisplay(breakdown: SpendingBreakdown) {
  const displayText = `$${breakdown.totalSpent.toFixed(2)} spent`;
  const confidenceText = `Data confidence: ${breakdown.confidence} (${breakdown.dataQuality.gamesWithPriceData}/${breakdown.dataQuality.gamesWithPriceData + breakdown.dataQuality.gamesWithMissingData} games have valid price data)`;

  return {
    displayText,
    confidenceText,
    warningText: breakdown.confidence === 'low' ? 'Price data is limited, actual spending may be higher' : undefined
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
