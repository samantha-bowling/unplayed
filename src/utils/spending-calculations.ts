
/**
 * Centralized spending calculations utility
 * Simplified price logic with clear fallback system
 */

import { validateGamePrice, getPricingValidationStats } from './price-validation';

export interface GameWithPrice {
  id: number;
  name: string;
  price_cents?: number | null;
  playtime_minutes?: number;
  image_url?: string | null;
  header_image?: string | null;
}

export interface GamePriceInfo {
  app_id: number;
  final_price_cents: number | null;
  initial_price_cents: number | null;
  discount_percent: number | null;
  currency: string;
  last_checked: string;
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

export interface TopSpendingGame {
  id: number;
  title: string;
  price: number;
  originalPrice: number | null;
  discount: number | null;
  imageUrl: string | null;
  currency: string;
  priceDataSource: 'enhanced' | 'basic' | 'unknown';
}

/**
 * SIMPLIFIED: Get the best available price for a game using clear fallback
 */
function getBestPrice(
  gameId: number,
  basicPriceCents: number | null | undefined,
  enhancedPriceData: GamePriceInfo | null,
  gameName?: string
): {
  finalPrice: number | null;
  originalPrice: number | null;
  discount: number | null;
  source: 'enhanced' | 'basic' | 'unknown';
  isValid: boolean;
} {
  // Try enhanced price data first (from game_prices table)
  if (enhancedPriceData?.final_price_cents !== null && enhancedPriceData?.final_price_cents !== undefined) {
    const validation = validateGamePrice(enhancedPriceData.final_price_cents, gameName);
    if (validation.isValid) {
      const originalValidation = enhancedPriceData.initial_price_cents 
        ? validateGamePrice(enhancedPriceData.initial_price_cents, gameName)
        : { isValid: false, validatedPrice: 0 };
      
      return {
        finalPrice: validation.validatedPrice,
        originalPrice: originalValidation.isValid ? originalValidation.validatedPrice : validation.validatedPrice,
        discount: enhancedPriceData.discount_percent,
        source: 'enhanced',
        isValid: true
      };
    }
  }

  // Fall back to basic price data (from games table)
  if (basicPriceCents !== null && basicPriceCents !== undefined) {
    const validation = validateGamePrice(basicPriceCents, gameName);
    if (validation.isValid) {
      return {
        finalPrice: validation.validatedPrice,
        originalPrice: validation.validatedPrice,
        discount: null,
        source: 'basic',
        isValid: true
      };
    }
  }

  // No valid price data available
  return {
    finalPrice: null,
    originalPrice: null,
    discount: null,
    source: 'unknown',
    isValid: false
  };
}

/**
 * Calculate spending for a collection of games with simplified price logic
 */
export function calculateSpending(
  games: GameWithPrice[],
  priceData: Map<number, GamePriceInfo> = new Map(),
  onlyUnplayed: boolean = false
): SpendingBreakdown {
  console.log(`💰 [SpendingCalculations] Starting calculation for ${games.length} games, onlyUnplayed: ${onlyUnplayed}`);
  
  let totalSpent = 0;
  let totalOriginalPrice = 0;
  let freeGamesCount = 0;
  let unknownPriceGamesCount = 0;
  let paidGamesCount = 0;
  let gamesWithPriceData = 0;
  let gamesWithMissingData = 0;
  let gamesActuallyFree = 0;
  let invalidPricesRejected = 0;
  let totalRejectedValueDollars = 0;

  const relevantGames = onlyUnplayed 
    ? games.filter(game => (game.playtime_minutes || 0) === 0)
    : games;

  console.log(`💰 [SpendingCalculations] Processing ${relevantGames.length} relevant games`);

  // Get pricing validation stats for logging
  const validationStats = getPricingValidationStats(relevantGames);
  console.log('💰 [SpendingCalculations] Price validation stats:', validationStats);

  relevantGames.forEach(game => {
    const enhancedData = priceData.get(game.id);
    const priceResult = getBestPrice(game.id, game.price_cents, enhancedData, game.name);

    if (!priceResult.isValid) {
      unknownPriceGamesCount++;
      gamesWithMissingData++;
      
      // Track rejected value if we had invalid price data
      if (game.price_cents && game.price_cents > 0) {
        const validation = validateGamePrice(game.price_cents, game.name);
        if (!validation.isValid) {
          invalidPricesRejected++;
          totalRejectedValueDollars += game.price_cents / 100;
        }
      }
      return;
    }

    gamesWithPriceData++;
    const finalPriceDollars = (priceResult.finalPrice || 0) / 100;
    const originalPriceDollars = (priceResult.originalPrice || 0) / 100;

    if (finalPriceDollars === 0) {
      freeGamesCount++;
      gamesActuallyFree++;
    } else {
      paidGamesCount++;
      totalSpent += finalPriceDollars;
      totalOriginalPrice += originalPriceDollars;
    }
  });

  // Calculate confidence based on data quality
  const dataQualityRatio = gamesWithPriceData / relevantGames.length;
  let confidence: 'high' | 'medium' | 'low';
  
  if (dataQualityRatio >= 0.9) {
    confidence = 'high';
  } else if (dataQualityRatio >= 0.7) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  const totalSaved = totalOriginalPrice > totalSpent ? totalOriginalPrice - totalSpent : null;

  console.log(`💰 [SpendingCalculations] Results: $${totalSpent.toFixed(2)} spent, ${invalidPricesRejected} invalid prices rejected ($${totalRejectedValueDollars.toFixed(2)} value), confidence: ${confidence}`);

  return {
    totalSpent: parseFloat(totalSpent.toFixed(2)),
    totalSaved: totalSaved ? parseFloat(totalSaved.toFixed(2)) : null,
    freeGamesCount,
    unknownPriceGamesCount,
    paidGamesCount,
    currency: 'USD',
    confidence,
    dataQuality: {
      gamesWithPriceData,
      gamesWithMissingData,
      gamesActuallyFree,
      invalidPricesRejected,
      totalRejectedValueDollars: parseFloat(totalRejectedValueDollars.toFixed(2))
    }
  };
}

/**
 * Generate top spending games list with simplified price logic
 */
export function generateTopSpendingGames(
  games: GameWithPrice[],
  priceData: Map<number, GamePriceInfo> = new Map(),
  onlyUnplayed: boolean = false,
  limit: number = 50
): TopSpendingGame[] {
  const relevantGames = onlyUnplayed 
    ? games.filter(game => (game.playtime_minutes || 0) === 0)
    : games;

  const gamesWithPrices = relevantGames
    .map(game => {
      const enhancedData = priceData.get(game.id);
      const priceResult = getBestPrice(game.id, game.price_cents, enhancedData, game.name);
      
      if (!priceResult.isValid || !priceResult.finalPrice || priceResult.finalPrice === 0) {
        return null;
      }

      return {
        id: game.id,
        title: game.name,
        price: priceResult.finalPrice / 100,
        originalPrice: priceResult.originalPrice ? priceResult.originalPrice / 100 : null,
        discount: priceResult.discount,
        imageUrl: game.header_image || game.image_url,
        currency: 'USD',
        priceDataSource: priceResult.source
      };
    })
    .filter((game): game is TopSpendingGame => game !== null)
    .sort((a, b) => b.price - a.price)
    .slice(0, limit);

  console.log(`💰 [SpendingCalculations] Generated ${gamesWithPrices.length} top spending games`);

  return gamesWithPrices;
}

/**
 * Format spending data for display with transparency about data quality
 */
export function formatSpendingDisplay(breakdown: SpendingBreakdown): {
  displayText: string;
  warningText?: string;
  confidenceText: string;
  rejectedValueText?: string;
} {
  const { totalSpent, freeGamesCount, unknownPriceGamesCount, confidence, dataQuality } = breakdown;
  
  let displayText = `$${totalSpent.toFixed(2)} spent`;
  if (freeGamesCount > 0) {
    displayText += ` • ${freeGamesCount} free games`;
  }
  
  let warningText: string | undefined;
  if (unknownPriceGamesCount > 0) {
    warningText = `${unknownPriceGamesCount} games have unknown pricing (may be delisted or missing data)`;
  }
  
  let rejectedValueText: string | undefined;
  if (dataQuality.invalidPricesRejected > 0) {
    rejectedValueText = `${dataQuality.invalidPricesRejected} games with invalid prices rejected ($${dataQuality.totalRejectedValueDollars.toFixed(2)} value excluded)`;
  }
  
  const confidenceText = `Data confidence: ${confidence} (${dataQuality.gamesWithPriceData}/${dataQuality.gamesWithPriceData + dataQuality.gamesWithMissingData} games have valid price data)`;
  
  return {
    displayText,
    warningText,
    confidenceText,
    rejectedValueText
  };
}
