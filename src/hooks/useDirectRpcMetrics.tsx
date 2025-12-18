/**
 * Direct RPC hook for user metrics calculation.
 * Calls the database RPC function directly instead of going through edge function.
 * Falls back to edge function if direct call fails.
 */
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { FEATURE_FLAGS } from '@/lib/feature-flags';

interface MetricsResult {
  success: boolean;
  metrics?: {
    totalGames: number;
    unplayedGames: number;
    playedGames: number;
    totalDustScore: number;
    averageDustScore: number;
    cleanScore: number;
    cleanScoreTier: string;
    cleanStreak: number;
    totalLibraryValueCents: number;
    unplayedValueCents: number;
    totalPlaytimeHours: number;
    recentlyPlayedCount: number;
  };
  error?: string;
}

/**
 * Calculate user metrics using direct RPC call with edge function fallback.
 * This reduces edge function invocations while maintaining reliability.
 */
export const calculateUserMetricsDirect = async (userId: string): Promise<MetricsResult> => {
  // If feature flag is disabled, go straight to edge function
  if (!FEATURE_FLAGS.USE_DIRECT_RPC) {
    return calculateViaEdgeFunction(userId);
  }

  try {
    console.log('📊 Attempting direct RPC call for user metrics...');
    
    const { data, error } = await supabase.rpc('calculate_user_metrics_with_clean_score', {
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

    console.log('✅ Direct RPC successful for user metrics');

    // Cast to expected shape since RPC returns JSONB
    const metrics = data as Record<string, unknown>;

    return {
      success: true,
      metrics: {
        totalGames: (metrics.total_games as number) || 0,
        unplayedGames: (metrics.unplayed_games as number) || 0,
        playedGames: (metrics.played_games as number) || 0,
        totalDustScore: (metrics.total_dust_score as number) || 0,
        averageDustScore: (metrics.average_dust_score as number) || 0,
        cleanScore: (metrics.clean_score as number) || 0,
        cleanScoreTier: (metrics.clean_score_tier as string) || 'dusty',
        cleanStreak: (metrics.clean_streak as number) || 0,
        totalLibraryValueCents: (metrics.total_library_value_cents as number) || 0,
        unplayedValueCents: (metrics.unplayed_value_cents as number) || 0,
        totalPlaytimeHours: (metrics.total_playtime_hours as number) || 0,
        recentlyPlayedCount: (metrics.recently_played_count as number) || 0,
      }
    };
  } catch (err) {
    console.error('Direct RPC error, falling back to edge function:', err);
    return calculateViaEdgeFunction(userId);
  }
};

/**
 * Fallback to edge function for metrics calculation.
 */
const calculateViaEdgeFunction = async (userId: string): Promise<MetricsResult> => {
  try {
    console.log('📊 Using edge function for user metrics...');
    
    const { data, error } = await supabase.functions.invoke('calculate-user-metrics', {
      body: { user_id: userId }
    });

    if (error) {
      console.error('Edge function error:', error);
      return { success: false, error: error.message };
    }

    if (!data?.success) {
      return { success: false, error: data?.error || 'Unknown error' };
    }

    console.log('✅ Edge function successful for user metrics');
    return {
      success: true,
      metrics: data.metrics
    };
  } catch (err) {
    console.error('Edge function invocation error:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
};

/**
 * Hook for direct RPC metrics calculation.
 */
export const useDirectRpcMetrics = () => {
  const { user } = useAuth();

  const refreshMetrics = async (): Promise<MetricsResult> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }
    return calculateUserMetricsDirect(user.id);
  };

  return { refreshMetrics };
};
