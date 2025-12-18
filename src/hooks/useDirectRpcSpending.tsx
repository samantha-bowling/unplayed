/**
 * Direct RPC hook for spending metrics calculation.
 * Calls the database RPC function directly instead of going through edge function.
 * Falls back to edge function if direct call fails.
 */
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { FEATURE_FLAGS } from '@/lib/feature-flags';

interface SpendingResult {
  success: boolean;
  metrics?: {
    totalGames: number;
    unplayedGames: number;
    freeGames: number;
    paidGames: number;
    gamesWithPriceData: number;
    gamesMissingPriceData: number;
    totalSpentCents: number;
    unplayedSpentCents: number;
    totalSavedCents: number | null;
    unplayedSavedCents: number | null;
    totalSpentDollars: number;
    unplayedSpentDollars: number;
    confidenceScore: number;
    currency: string;
  };
  error?: string;
}

/**
 * Calculate spending metrics using direct RPC call with edge function fallback.
 */
export const calculateSpendingMetricsDirect = async (userId: string): Promise<SpendingResult> => {
  // If feature flag is disabled, go straight to edge function
  if (!FEATURE_FLAGS.USE_DIRECT_RPC) {
    return calculateViaEdgeFunction(userId);
  }

  try {
    console.log('💰 Attempting direct RPC call for spending metrics...');
    
    const { data, error } = await supabase.rpc('upsert_user_spending_metrics', {
      p_user_id: userId
    });

    if (error) {
      console.warn('Direct RPC failed, falling back to edge function:', error.message);
      return calculateViaEdgeFunction(userId);
    }

    if (!data) {
      console.warn('No data from direct RPC, falling back to edge function');
      return calculateViaEdgeFunction(userId);
    }

    console.log('✅ Direct RPC successful for spending metrics');

    // Cast to expected shape since RPC returns JSONB
    const metrics = data as Record<string, unknown>;

    return {
      success: true,
      metrics: {
        totalGames: (metrics.total_games as number) || 0,
        unplayedGames: (metrics.unplayed_games as number) || 0,
        freeGames: (metrics.free_games as number) || 0,
        paidGames: (metrics.paid_games as number) || 0,
        gamesWithPriceData: (metrics.games_with_price_data as number) || 0,
        gamesMissingPriceData: (metrics.games_missing_price_data as number) || 0,
        totalSpentCents: (metrics.total_spent_cents as number) || 0,
        unplayedSpentCents: (metrics.unplayed_spent_cents as number) || 0,
        totalSavedCents: (metrics.total_saved_cents as number | null) || null,
        unplayedSavedCents: (metrics.unplayed_saved_cents as number | null) || null,
        totalSpentDollars: (metrics.total_spent_dollars as number) || 0,
        unplayedSpentDollars: (metrics.unplayed_spent_dollars as number) || 0,
        confidenceScore: (metrics.confidence_score as number) || 0,
        currency: (metrics.currency as string) || 'USD',
      }
    };
  } catch (err) {
    console.error('Direct RPC error, falling back to edge function:', err);
    return calculateViaEdgeFunction(userId);
  }
};

/**
 * Fallback to edge function for spending calculation.
 */
const calculateViaEdgeFunction = async (userId: string): Promise<SpendingResult> => {
  try {
    console.log('💰 Using edge function for spending metrics...');
    
    const { data, error } = await supabase.functions.invoke('calculate-user-spending', {
      body: { user_id: userId, force_refresh: true }
    });

    if (error) {
      console.error('Edge function error:', error);
      return { success: false, error: error.message };
    }

    if (!data?.success) {
      return { success: false, error: data?.error || 'Unknown error' };
    }

    console.log('✅ Edge function successful for spending metrics');
    return {
      success: true,
      metrics: {
        totalGames: data.metrics?.total_games || 0,
        unplayedGames: data.metrics?.unplayed_games || 0,
        freeGames: data.metrics?.free_games || 0,
        paidGames: data.metrics?.paid_games || 0,
        gamesWithPriceData: data.metrics?.games_with_price_data || 0,
        gamesMissingPriceData: data.metrics?.games_missing_price_data || 0,
        totalSpentCents: data.metrics?.total_spent_cents || 0,
        unplayedSpentCents: data.metrics?.unplayed_spent_cents || 0,
        totalSavedCents: data.metrics?.total_saved_cents || null,
        unplayedSavedCents: data.metrics?.unplayed_saved_cents || null,
        totalSpentDollars: data.metrics?.total_spent_dollars || 0,
        unplayedSpentDollars: data.metrics?.unplayed_spent_dollars || 0,
        confidenceScore: data.metrics?.confidence_score || 0,
        currency: data.metrics?.currency || 'USD',
      }
    };
  } catch (err) {
    console.error('Edge function invocation error:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
};

/**
 * Hook for direct RPC spending calculation.
 */
export const useDirectRpcSpending = () => {
  const { user } = useAuth();

  const refreshSpending = async (): Promise<SpendingResult> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }
    return calculateSpendingMetricsDirect(user.id);
  };

  return { refreshSpending };
};
