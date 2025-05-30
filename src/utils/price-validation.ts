
/**
 * Price validation utilities to handle unrealistic pricing data
 */

export interface PriceValidationResult {
  isValid: boolean;
  validatedPrice: number;
  reason?: string;
  confidence: 'high' | 'medium' | 'low';
}

// Maximum reasonable price thresholds
const MAX_REASONABLE_PRICE_CENTS = 50000; // $500
const SUSPICIOUS_PRICE_CENTS = 20000; // $200
const FREE_GAME_THRESHOLD = 0;

/**
 * Validates if a price is reasonable and should be included in calculations
 */
export function validateGamePrice(
  priceCents: number | null | undefined,
  gameName?: string
): PriceValidationResult {
  // Handle null/undefined prices
  if (priceCents === null || priceCents === undefined) {
    return {
      isValid: false,
      validatedPrice: 0,
      reason: 'No price data available',
      confidence: 'low'
    };
  }

  // Handle free games
  if (priceCents === FREE_GAME_THRESHOLD) {
    return {
      isValid: true,
      validatedPrice: 0,
      confidence: 'high'
    };
  }

  // Handle negative prices (invalid)
  if (priceCents < 0) {
    return {
      isValid: false,
      validatedPrice: 0,
      reason: 'Negative price detected (invalid data)',
      confidence: 'low'
    };
  }

  // Handle extremely high prices (likely data errors)
  if (priceCents > MAX_REASONABLE_PRICE_CENTS) {
    console.warn(`Rejecting unrealistic price for game "${gameName}": $${(priceCents / 100).toFixed(2)}`);
    return {
      isValid: false,
      validatedPrice: 0,
      reason: `Price too high: $${(priceCents / 100).toFixed(2)} (likely data error)`,
      confidence: 'low'
    };
  }

  // Handle suspicious but potentially valid prices
  if (priceCents > SUSPICIOUS_PRICE_CENTS) {
    console.log(`Suspicious but accepted price for game "${gameName}": $${(priceCents / 100).toFixed(2)}`);
    return {
      isValid: true,
      validatedPrice: priceCents,
      reason: `High price but within acceptable range`,
      confidence: 'medium'
    };
  }

  // Normal price range
  return {
    isValid: true,
    validatedPrice: priceCents,
    confidence: 'high'
  };
}

/**
 * Filters a list of games to only include those with valid pricing
 */
export function filterGamesWithValidPricing<T extends { price_cents?: number | null; name?: string }>(
  games: T[]
): T[] {
  return games.filter(game => {
    const validation = validateGamePrice(game.price_cents, game.name);
    return validation.isValid;
  });
}

/**
 * Gets pricing statistics including validation info
 */
export function getPricingValidationStats(games: Array<{ price_cents?: number | null; name?: string }>) {
  let validPrices = 0;
  let invalidPrices = 0;
  let freePrices = 0;
  let suspiciousPrices = 0;
  let totalRejectedValue = 0;

  games.forEach(game => {
    const validation = validateGamePrice(game.price_cents, game.name);
    
    if (validation.isValid) {
      validPrices++;
      if (validation.validatedPrice === 0) {
        freePrices++;
      } else if (validation.confidence === 'medium') {
        suspiciousPrices++;
      }
    } else {
      invalidPrices++;
      if (game.price_cents && game.price_cents > 0) {
        totalRejectedValue += game.price_cents;
      }
    }
  });

  return {
    validPrices,
    invalidPrices,
    freePrices,
    suspiciousPrices,
    totalRejectedValueCents: totalRejectedValue,
    totalRejectedValueDollars: totalRejectedValue / 100,
    validationRate: games.length > 0 ? (validPrices / games.length) * 100 : 0
  };
}
