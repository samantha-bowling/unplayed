
/**
 * Streamlined query keys with better performance and cleaner structure
 * Maintains demo/live separation at the query level
 */

type QueryKey = readonly [string, ...unknown[]];

/**
 * Optimized query keys focused on actual usage patterns
 */
export const optimizedQueryKeys = {
  // Core user data queries
  profile: {
    base: (userId?: string) => ['profile', userId] as const,
    steam: (userId?: string) => ['profile', userId, 'steam'] as const,
  },
  
  // Unplayed data with dependency tracking
  unplayed: {
    data: (userId?: string, profileSteamId?: string) => 
      ['unplayed', userId, 'data', profileSteamId] as const,
  },
  
  // Game estimates with optimized caching
  estimates: {
    byGameIds: (gameIds: number[]) => ['estimates', 'games', [...gameIds].sort()] as const,
  },
  
  // Phase 2 metrics keys
  metrics: {
    user: (userId?: string) => ['user-metrics', userId] as const,
    spending: (userId?: string) => ['spendingMetrics', userId] as const,
    library: (userId?: string) => ['library', userId] as const,
    shelfLife: (userId?: string) => ['shelf-life-data', userId] as const,
    genreStats: (userId?: string) => ['genre-stats', userId] as const,
  },
  
  // Helper functions for cache management
  helpers: {
    // Get all user-related keys for bulk invalidation
    allUserData: (userId?: string): QueryKey[] => [
      optimizedQueryKeys.profile.base(userId),
      optimizedQueryKeys.unplayed.data(userId),
      // Phase 2 metrics
      optimizedQueryKeys.metrics.user(userId),
      optimizedQueryKeys.metrics.spending(userId),
      optimizedQueryKeys.metrics.library(userId),
      optimizedQueryKeys.metrics.shelfLife(userId),
      optimizedQueryKeys.metrics.genreStats(userId),
    ],
    
    // Get unplayed-specific keys
    unplayedData: (userId?: string): QueryKey[] => [
      optimizedQueryKeys.unplayed.data(userId),
    ],
    
    // Get Phase 2 metrics keys only
    phase2Metrics: (userId?: string): QueryKey[] => [
      optimizedQueryKeys.metrics.user(userId),
      optimizedQueryKeys.metrics.spending(userId),
      optimizedQueryKeys.metrics.library(userId),
      optimizedQueryKeys.metrics.shelfLife(userId),
      optimizedQueryKeys.metrics.genreStats(userId),
    ],
  }
};

/**
 * Simplified cache management hook
 */
export const useOptimizedCacheManagement = () => {
  return {
    queryKeys: optimizedQueryKeys,
    
    // Utility functions for common cache operations
    utils: {
      // Invalidate only user profile data
      invalidateProfile: (userId?: string): QueryKey[] => [
        optimizedQueryKeys.profile.base(userId),
        optimizedQueryKeys.profile.steam(userId),
      ],
      
      // Invalidate unplayed data and dependencies
      invalidateUnplayed: (userId?: string): QueryKey[] => [
        ...optimizedQueryKeys.helpers.unplayedData(userId),
      ],
      
      // Invalidate all Phase 2 metrics
      invalidatePhase2Metrics: (userId?: string): QueryKey[] => [
        ...optimizedQueryKeys.helpers.phase2Metrics(userId),
      ],
      
      // Invalidate everything for comprehensive refresh
      invalidateAllUserData: (userId?: string): QueryKey[] => [
        ...optimizedQueryKeys.helpers.allUserData(userId),
      ],
    }
  };
};

export default useOptimizedCacheManagement;
