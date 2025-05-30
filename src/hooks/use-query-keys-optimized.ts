
/**
 * Streamlined query keys with better performance and cleaner structure
 * Maintains demo/live separation at the query level
 */

import { FilterOptions } from './use-paginated-library';

type QueryKey = readonly [string, ...unknown[]];

// Enhanced type definition for query keys
interface QueryKeyBase {
  readonly scope: 'unplayed' | 'estimates' | 'profile' | 'spending' | 'library' | 'leaderboard' | 'dust' | 'unifiedLibrary';
  readonly entity: 'data' | 'list' | 'detail' | 'count' | 'breakdown' | 'stats';
  readonly type: 'query' | 'mutation';
  readonly id?: string;
  readonly filters?: FilterOptions;
  readonly page?: number;
  readonly pageSize?: number;
  readonly sortBy?: string;
  readonly sortDirection?: 'asc' | 'desc';
}

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
    all: ['unplayed'] as const,
    data: (userId?: string, profileSteamId?: string) => 
      ['unplayed', userId, 'data', profileSteamId] as const,
  },
  
  // Game estimates with optimized caching
  estimates: {
    all: ['estimates'] as const,
    byGameIds: (gameIds: number[]) => ['estimates', 'games', [...gameIds].sort()] as const,
  },

  // Spending data queries
  spending: {
    all: ['spending'] as const,
    breakdown: (userId: string | undefined) =>
      [{ scope: 'spending', entity: 'breakdown', type: 'query', id: userId }] as const,
  },

  // Library queries
  library: {
    all: ['library'] as const,
    list: (userId: string | undefined, filters?: FilterOptions) =>
      [{ scope: 'library', entity: 'list', type: 'query', id: userId, filters }] as const,
  },

  // Leaderboard queries
  leaderboard: {
    all: ['leaderboard'] as const,
    list: (metric: string) =>
      [{ scope: 'leaderboard', entity: 'list', type: 'query', id: metric }] as const,
  },

  // Dust score queries
  dust: {
    all: ['dust'] as const,
    detail: (userId: string | undefined) =>
      [{ scope: 'dust', entity: 'detail', type: 'query', id: userId }] as const,
  },

  // Unified library data keys
  unifiedLibrary: {
    all: ['unifiedLibrary'] as const,
    data: (userId: string | undefined) => 
      [{ scope: 'unifiedLibrary', entity: 'data', type: 'query', id: userId }] as const,
    stats: (userId: string | undefined) => 
      [{ scope: 'unifiedLibrary', entity: 'stats', type: 'query', id: userId }] as const,
  },

  // Additional helper query keys
  libraryGamesCount: (userId: string | undefined, filters: FilterOptions) =>
    [{
      scope: 'library',
      entity: 'count',
      type: 'query',
      id: userId,
      filters: filters
    }] as const,

  paginatedLibraryGames: (
    userId: string | undefined,
    page: number,
    pageSize: number,
    filters: FilterOptions,
    sortBy: string,
    sortDirection: 'asc' | 'desc'
  ) =>
    [{
      scope: 'library',
      entity: 'list',
      type: 'query',
      id: userId,
      page: page,
      pageSize: pageSize,
      filters: filters,
      sortBy: sortBy,
      sortDirection: sortDirection
    }] as const,

  pickerGames: (userId: string | undefined) =>
    [{ scope: 'library', entity: 'list', type: 'query', id: userId }] as const,

  spendingData: (userId: string | undefined) =>
    [{ scope: 'spending', entity: 'data', type: 'query', id: userId }] as const,
  
  // Helper functions for cache management
  helpers: {
    // Get all user-related keys for bulk invalidation
    allUserData: (userId?: string): QueryKey[] => [
      optimizedQueryKeys.profile.base(userId),
      optimizedQueryKeys.unplayed.data(userId),
      ...optimizedQueryKeys.estimates.all,
      ...optimizedQueryKeys.spending.all,
      ...optimizedQueryKeys.library.all,
      ...optimizedQueryKeys.dust.all,
    ].map(key => [...key, userId]),
    
    // Get unplayed-specific keys
    unplayedData: (userId?: string): QueryKey[] => [
      optimizedQueryKeys.unplayed.data(userId),
    ],
  },

  // Utility functions for cache operations
  utils: {
    invalidateUnplayed: (userId: string | undefined) => {
      return [
        ['unplayed', 'data', userId, {}],
      ];
    },
    invalidateProfile: (userId: string | undefined) => {
      return [
        ['profile', 'detail', userId, {}],
      ];
    },
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
    }
  };
};

export default useOptimizedCacheManagement;
