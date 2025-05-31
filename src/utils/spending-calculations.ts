
/**
 * Centralized spending calculations utility
 * Handles price data properly and distinguishes between free games and missing price data
 * Now includes price validation to filter out unrealistic prices
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
  priceDataSource: 'games_table' | 'price_table' | 'estimated';
}

/**
 * Determines if a game is actually free vs has missing price data
 * Now includes price validation to reject unrealistic prices
 */
export function categorizeGamePrice(
  gamePrice: number | null | undefined,
  priceTableData: GamePriceInfo | null,
  gameName?: string
): {
  category: 'free' | 'paid' | 'unknown' | 'invalid';
  price: number;
  confidence: 'high' | 'medium' | 'low';
  source: 'games_table' | 'price_table' | 'estimated';
  validationReason?: string;
} {
  // Check price table data first (more recent and accurate)
  if (priceTableData?.final_price_cents !== null && priceTableData?.final_price_cents !== undefined) {
    const validation = validateGamePrice(priceTableData.final_price_cents, gameName);
    
    if (!validation.isValid) {
      return {
        category: 'invalid',
        price: 0,
        confidence: 'low',
        source: 'price_table',
        validationReason: validation.reason
      };
    }
    
    return {
      category: validation.validatedPrice === 0 ? 'free' : 'paid',
      price: validation.validatedPrice / 100,
      confidence: validation.confidence,
      source: 'price_table'
    };
  }

  // Fall back to games table data
  if (gamePrice !== null && gamePrice !== undefined) {
    const validation = validateGamePrice(gamePrice, gameName);
    
    if (!validation.isValid) {
      return {
        category: 'invalid',
        price: 0,
        confidence: 'low',
        source: 'games_table',
        validationReason: validation.reason
      };
    }
    
    const priceInDollars = validation.validatedPrice / 100;
    return {
      category: priceInDollars === 0 ? 'free' : 'paid',
      price: priceInDollars,
      confidence: validation.confidence,
      source: 'games_table'
    };
  }

  // No price data available - this is unknown, not free
  return {
    category: 'unknown',
    price: 0,
    confidence: 'low',
    source: 'estimated'
  };
}

/**
 * Calculate spending for a collection of games with proper categorization and price validation
 */
export function calculateSpending(
  games: GameWithPrice[],
  priceData: Map<number, GamePriceInfo> = new Map(),
  onlyUnplayed: boolean = false
): SpendingBreakdown {
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

  // Get pricing validation stats for logging
  const validationStats = getPricingValidationStats(relevantGames);
  console.log('Price validation stats:', validationStats);

  relevantGames.forEach(game => {
    const priceInfo = priceData.get(game.id);
    const priceCategory = categorizeGamePrice(game.price_cents, priceInfo, game.name);

    switch (priceCategory.category) {
      case 'free':
        freeGamesCount++;
        gamesActuallyFree++;
        gamesWithPriceData++;
        break;
      case 'paid':
        paidGamesCount++;
        totalSpent += priceCategory.price;
        gamesWithPriceData++;
        
        // Add to original price if we have discount data
        if (priceInfo?.initial_price_cents) {
          const originalValidation = validateGamePrice(priceInfo.initial_price_cents, game.name);
          if (originalValidation.isValid) {
            totalOriginalPrice += originalValidation.validatedPrice / 100;
          } else {
            totalOriginalPrice += priceCategory.price;
          }
        } else {
          totalOriginalPrice += priceCategory.price;
        }
        break;
      case 'unknown':
        unknownPriceGamesCount++;
        gamesWithMissingData++;
        break;
      case 'invalid':
        invalidPricesRejected++;
        gamesWithMissingData++;
        // Track rejected value for reporting
        if (game.price_cents && game.price_cents > 0) {
          totalRejectedValueDollars += game.price_cents / 100;
        }
        console.log(`Rejected invalid price for "${game.name}": ${priceCategory.validationReason}`);
        break;
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

  console.log(`Spending calculation: $${totalSpent.toFixed(2)} spent, ${invalidPricesRejected} invalid prices rejected (${totalRejectedValueDollars.toFixed(2)} value)`);

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
 * Generate top spending games list with proper price categorization and validation
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
      const priceInfo = priceData.get(game.id);
      const priceCategory = categorizeGamePrice(game.price_cents, priceInfo, game.name);
      
      return {
        id: game.id,
        title: game.name,
        price: priceCategory.price,
        originalPrice: priceInfo?.initial_price_cents ? priceInfo.initial_price_cents / 100 : null,
        discount: priceInfo?.discount_percent || null,
        imageUrl: game.header_image || game.image_url,
        currency: 'USD',
        priceDataSource: priceCategory.source, // This now returns 'price_table', 'games_table', or 'estimated'
        category: priceCategory.category
      };
    })
    .filter(game => game.price > 0 && game.category === 'paid') // Only include games with valid, paid prices
    .sort((a, b) => b.price - a.price) // Sort by price descending
    .slice(0, limit);

  console.log(`Generated top spending games: ${gamesWithPrices.length} games with valid prices`);

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
