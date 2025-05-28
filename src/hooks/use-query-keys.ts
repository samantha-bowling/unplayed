
/**
 * Central location for all query keys used in the application
 * This helps ensure consistency in cache management and invalidation
 */

// Type definitions for query key parameters
type FilterOptions = {
  search: string;
  hideIgnored: boolean;
  onlyUnplayed: boolean;
  selectedGenre: string;
};

export const queryKeys = {
  // User data
  profile: (userId?: string) => ['profile', userId],
  
  // Library data
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
  
  // Unplayed data
  unplayedData: (userId?: string) => ['unplayedData', userId],
  detailedDustData: (userId?: string) => ['detailedDustData', userId],
  
  // Game details
  gameEstimates: (userId?: string) => ['gameEstimates', userId],
  gameDetails: (gameId?: number) => ['gameDetails', gameId],
  
  // Picker data
  pickerGames: (userId?: string) => ['pickerGames', userId],
  previousPicks: (userId?: string) => ['previousPicks', userId],
  
  // Spending data
  spendingData: (userId?: string) => ['spendingData', userId],
  
  // Leaderboard data
  leaderboardData: () => ['leaderboardData'],
  
  // Helper to create an array of all user-related queries for bulk invalidation
  allUserData: (userId?: string) => [
    queryKeys.profile(userId),
    queryKeys.unplayedData(userId),
    queryKeys.libraryGames(userId),
    queryKeys.paginatedLibraryGames(userId),
    queryKeys.libraryGamesCount(userId),
    queryKeys.detailedDustData(userId),
    queryKeys.gameEstimates(userId),
    queryKeys.pickerGames(userId),
    queryKeys.previousPicks(userId),
    queryKeys.spendingData(userId)
  ]
};

/**
 * Hook for cache management operations
 * Provides utilities to perform targeted invalidations and updates
 */
export const useCacheManagement = () => {
  // This will be expanded with additional utilities 
  // for more advanced cache operations
  
  return {
    queryKeys
  };
};

export default useCacheManagement;
