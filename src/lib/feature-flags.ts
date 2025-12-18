/**
 * Feature flags for controlling application behavior.
 * Use these to enable/disable features or rollback changes quickly.
 */
export const FEATURE_FLAGS = {
  /**
   * When true, use direct Supabase RPC calls instead of edge functions
   * for metrics calculations. This reduces edge function invocations.
   * Set to false to rollback to edge function calls if issues arise.
   */
  USE_DIRECT_RPC: true,

  /**
   * Extended cache staleness times (in milliseconds).
   * These values are used when USE_DIRECT_RPC is true to reduce API calls.
   */
  CACHE_STALE_TIMES: {
    SPENDING_METRICS: 4 * 60 * 60 * 1000, // 4 hours
    GENRE_STATS: 30 * 60 * 1000, // 30 minutes
    SHELF_LIFE: 30 * 60 * 1000, // 30 minutes
    DUST_BREAKDOWNS: 30 * 60 * 1000, // 30 minutes
    CLEAN_SCORE_BREAKDOWNS: 30 * 60 * 1000, // 30 minutes
    USER_METRICS: 30 * 60 * 1000, // 30 minutes
  },
} as const;

export type FeatureFlags = typeof FEATURE_FLAGS;
