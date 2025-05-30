
/**
 * Central location for all query keys used in the application
 * This helps ensure consistency in cache management and invalidation
 */

// Type definitions for query key parameters
export type FilterOptions = {
  search: string;
  hideIgnored: boolean;
  onlyUnplayed: boolean;
  selectedGenre: string;
};

export const queryKeys = {
  // User data
  profile: (userId?: string) => ['profile', userId],
  
  // Unified library data - PRIMARY data source
  unifiedLibrary: {
    all: ['unifiedLibrary'],
    data: (userId?: string) => ['unifiedLibrary', 'data', userId],
    stats: (userId?: string) => ['unifiedLibrary', 'stats', userId],
  },
  
  // Legacy library data (kept for backward compatibility)
  libraryGames: (userId?: string) => ['libraryGames', userId],
  paginatedLibraryGames: (
    userId?: string, 
    page?: number, 
    pageSize?: number, 
    filters?: FilterOptions, 
    sortBy?: string, 
    sortDirection?: string
  ) => [
    'paginatedLibraryGames', 
    userId, 
    page, 
    pageSize, 
    filters, 
    sortBy, 
    sortDirection
  ],
  libraryGamesCount: (userId?: string, filters?: FilterOptions) => 
    ['libraryGamesCount', userId, filters],
  
  // Game details
  gameEstimates: (userId?: string) => ['gameEstimates', userId],
  gameDetails: (gameId?: number) => ['gameDetails', gameId],
  
  // Picker data
  pickerGames: (userId?: string) => ['pickerGames', userId],
  gamePicks: (userId?: string) => ['gamePicks', userId],
  previousPicks: (userId?: string) => ['previousPicks', userId],
  
  // Spending data
  spendingData: (userId?: string) => ['spendingData', userId],
  enhancedSpendingData: (userId?: string, onlyUnplayed?: boolean) => 
    ['enhancedSpendingData', userId, onlyUnplayed],
  
  // Leaderboard data
  leaderboardData: () => ['leaderboardData'],
  
  // Helper to create an array of all user-related queries for bulk invalidation
  allUserData: (userId?: string) => [
    queryKeys.profile(userId),
    queryKeys.unifiedLibrary.data(userId),
    queryKeys.unifiedLibrary.stats(userId),
    queryKeys.libraryGames(userId),
    queryKeys.paginatedLibraryGames(userId),
    queryKeys.libraryGamesCount(userId),
    queryKeys.gameEstimates(userId),
    queryKeys.pickerGames(userId),
    queryKeys.gamePicks(userId),
    queryKeys.previousPicks(userId),
    queryKeys.spendingData(userId),
    queryKeys.enhancedSpendingData(userId)
  ]
};

/**
 * Hook for cache management operations
 * Provides utilities to perform targeted invalidations and updates
 */
export const useCacheManagement = () => {
  return {
    queryKeys,
    
    // Utility functions for common cache operations
    utils: {
      // Invalidate only user profile data
      invalidateProfile: (userId?: string) => [
        queryKeys.profile(userId),
      ],
      
      // Invalidate unified library data (primary data source)
      invalidateUnifiedLibrary: (userId?: string) => [
        queryKeys.unifiedLibrary.data(userId),
        queryKeys.unifiedLibrary.stats(userId),
      ],
      
      // Invalidate all user data
      invalidateAllUserData: (userId?: string) => 
        queryKeys.allUserData(userId),
    }
  };
};

export default useCacheManagement;
