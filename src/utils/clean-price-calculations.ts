
/**
 * Enhanced price calculations using the new database functions
 * This replaces the old spending-calculations.ts with cleaner, more accurate data
 */

import { supabase } from '@/integrations/supabase/client';

export interface CleanPriceInfo {
  final_price_cents: number | null;
  original_price_cents: number | null;
  is_free: boolean;
  confidence: 'high' | 'medium' | 'low';
  source: 'game_prices' | 'games_table' | 'unknown';
  currency: string;
}

export interface LibraryStats {
  total_games: number;
  unplayed_games: number;
  free_games: number;
  games_with_prices: number;
  games_without_prices: number;
  total_library_value_cents: number;
  unplayed_value_cents: number;
  total_library_value_dollars: number;
  unplayed_value_dollars: number;
  data_quality_percentage: number;
}

export interface EnhancedSpendingBreakdown {
  totalSpent: number;
  totalSaved: number | null;
  freeGamesCount: number;
  paidGamesCount: number;
  unknownPriceGamesCount: number;
  currency: string;
  confidence: 'high' | 'medium' | 'low';
  dataQuality: {
    gamesWithPriceData: number;
    gamesWithMissingData: number;
    dataQualityPercentage: number;
  };
}

/**
 * Get clean library statistics using the new database function
 */
export async function getCleanLibraryStats(userId: string): Promise<LibraryStats | null> {
  try {
    const { data, error } = await supabase.rpc('get_user_library_stats', {
      p_user_id: userId
    });

    if (error) {
      console.error('Error fetching clean library stats:', error);
      throw error;
    }

    return data as LibraryStats;
  } catch (error) {
    console.error('Error in getCleanLibraryStats:', error);
    return null;
  }
}

/**
 * Get clean price info for a specific game
 */
export async function getCleanGamePrice(gameId: number, fallbackPriceCents?: number): Promise<CleanPriceInfo | null> {
  try {
    const { data, error } = await supabase.rpc('get_clean_game_price', {
      p_game_id: gameId,
      p_fallback_price_cents: fallbackPriceCents || null
    });

    if (error) {
      console.error('Error fetching clean game price:', error);
      throw error;
    }

    return data as CleanPriceInfo;
  } catch (error) {
    console.error('Error in getCleanGamePrice:', error);
    return null;
  }
}

/**
 * Transform library stats to enhanced spending breakdown format
 */
export function transformToSpendingBreakdown(
  stats: LibraryStats,
  onlyUnplayed: boolean = true
): EnhancedSpendingBreakdown {
  const totalSpent = onlyUnplayed 
    ? stats.unplayed_value_dollars 
    : stats.total_library_value_dollars;
  
  const paidGamesCount = stats.games_with_prices - stats.free_games;
  const unknownPriceGamesCount = stats.games_without_prices;
  
  // Determine confidence based on data quality
  let confidence: 'high' | 'medium' | 'low';
  if (stats.data_quality_percentage >= 90) {
    confidence = 'high';
  } else if (stats.data_quality_percentage >= 70) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  return {
    totalSpent,
    totalSaved: null, // We'll calculate this separately if needed
    freeGamesCount: stats.free_games,
    paidGamesCount,
    unknownPriceGamesCount,
    currency: 'USD',
    confidence,
    dataQuality: {
      gamesWithPriceData: stats.games_with_prices,
      gamesWithMissingData: stats.games_without_prices,
      dataQualityPercentage: stats.data_quality_percentage
    }
  };
}

/**
 * Format spending data for display with transparency about data quality
 */
export function formatCleanSpendingDisplay(breakdown: EnhancedSpendingBreakdown): {
  displayText: string;
  warningText?: string;
  confidenceText: string;
} {
  const { totalSpent, freeGamesCount, unknownPriceGamesCount, confidence, dataQuality } = breakdown;
  
  let displayText = `$${totalSpent.toFixed(2)} spent`;
  if (freeGamesCount > 0) {
    displayText += ` • ${freeGamesCount} free games`;
  }
  
  let warningText: string | undefined;
  if (unknownPriceGamesCount > 0) {
    warningText = `${unknownPriceGamesCount} games have unknown pricing (${(100 - dataQuality.dataQualityPercentage).toFixed(1)}% of library)`;
  }
  
  const confidenceText = `Data confidence: ${confidence} (${dataQuality.dataQualityPercentage.toFixed(1)}% of games have valid price data)`;
  
  return {
    displayText,
    warningText,
    confidenceText
  };
}
