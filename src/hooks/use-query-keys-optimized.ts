
/**
 * Optimized query keys with more granular cache management
 */
export const optimizedQueryKeys = {
  // User data with granular keys
  profile: {
    base: (userId?: string) => ['profile', userId] as const,
    steam: (userId?: string) => ['profile', userId, 'steam'] as const,
    settings: (userId?: string) => ['profile', userId, 'settings'] as const,
  },
  
  // Library data with pagination and filter-specific keys
  library: {
    all: (userId?: string) => ['library', userId] as const,
    games: (userId?: string, filters?: any) => ['library', userId, 'games', filters] as const,
    paginated: (userId?: string, page?: number, filters?: any) => 
      ['library', userId, 'paginated', page, filters] as const,
    count: (userId?: string, filters?: any) => 
      ['library', userId, 'count', filters] as const,
    metadata: (userId?: string) => ['library', userId, 'metadata'] as const,
  },
  
  // Unplayed data with dependency tracking
  unplayed: {
    base: (userId?: string) => ['unplayed', userId] as const,
    data: (userId?: string, profileSteamId?: string) => 
      ['unplayed', userId, 'data', profileSteamId] as const,
    detailed: (userId?: string, gameCount?: number) => 
      ['unplayed', userId, 'detailed', gameCount] as const,
  },
  
  // Game estimates with game-specific keys
  estimates: {
    all: (userId?: string) => ['estimates', userId] as const,
    byGameIds: (gameIds: number[]) => ['estimates', 'games', gameIds.sort()] as const,
    single: (gameId: number) => ['estimates', 'game', gameId] as const,
  },
  
  // Game details with individual caching
  games: {
    all: () => ['games'] as const,
    details: (gameId: number) => ['games', 'details', gameId] as const,
    batch: (gameIds: number[]) => ['games', 'batch', gameIds.sort()] as const,
  },
  
  // Picker data with filter-specific caching
  picker: {
    base: (userId?: string) => ['picker', userId] as const,
    games: (userId?: string, filters?: any) => ['picker', userId, 'games', filters] as const,
    previous: (userId?: string, limit?: number) => 
      ['picker', userId, 'previous', limit] as const,
  },
  
  // Spending data
  spending: {
    base: (userId?: string) => ['spending', userId] as const,
    total: (userId?: string) => ['spending', userId, 'total'] as const,
    breakdown: (userId?: string) => ['spending', userId, 'breakdown'] as const,
  },
  
  // Leaderboard data
  leaderboard: {
    base: () => ['leaderboard'] as const,
    rankings: (type?: 'dust' | 'clean') => ['leaderboard', 'rankings', type] as const,
    user: (userId?: string) => ['leaderboard', 'user', userId] as const,
  },
  
  // Helper functions for cache management
  helpers: {
    // Get all user-related keys for bulk invalidation
    allUserData: (userId?: string) => [
      optimizedQueryKeys.profile.base(userId),
      optimizedQueryKeys.library.all(userId),
      optimizedQueryKeys.unplayed.base(userId),
      optimizedQueryKeys.estimates.all(userId),
      optimizedQueryKeys.picker.base(userId),
      optimizedQueryKeys.spending.base(userId),
    ],
    
    // Get library-specific keys for targeted invalidation - use flexible typing
    libraryData: (userId?: string) => [
      optimizedQueryKeys.library.all(userId),
      optimizedQueryKeys.library.games(userId),
      optimizedQueryKeys.library.count(userId),
      optimizedQueryKeys.library.metadata(userId),
    ],
    
    // Get unplayed-specific keys
    unplayedData: (userId?: string) => [
      optimizedQueryKeys.unplayed.data(userId),
      optimizedQueryKeys.unplayed.detailed(userId),
    ],
  }
};

/**
 * Enhanced cache management hook with granular operations
 */
export const useOptimizedCacheManagement = () => {
  return {
    queryKeys: optimizedQueryKeys,
    
    // Utility functions for common cache operations
    utils: {
      // Invalidate only user profile data
      invalidateProfile: (userId?: string) => [
        optimizedQueryKeys.profile.base(userId),
        optimizedQueryKeys.profile.steam(userId),
        optimizedQueryKeys.profile.settings(userId),
      ],
      
      // Invalidate library data with specific filters
      invalidateLibrary: (userId?: string, includeFilters = true) => {
        const keys = [optimizedQueryKeys.library.all(userId)];
        if (includeFilters) {
          keys.push(optimizedQueryKeys.library.metadata(userId));
        }
        return keys;
      },
      
      // Invalidate unplayed data and dependencies
      invalidateUnplayed: (userId?: string) => [
        ...optimizedQueryKeys.helpers.unplayedData(userId),
        optimizedQueryKeys.estimates.all(userId),
      ],
      
      // Targeted game data invalidation
      invalidateGameData: (gameIds: number[]) => [
        optimizedQueryKeys.estimates.byGameIds(gameIds),
        ...gameIds.map(id => optimizedQueryKeys.games.details(id)),
      ],
    }
  };
};

export default useOptimizedCacheManagement;
