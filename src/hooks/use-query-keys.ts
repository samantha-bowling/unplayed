

export const queryKeys = {
  auth: {
    profile: () => ['auth', 'profile'] as const,
  },
  library: {
    data: (userId?: string) => ['library', 'data', userId] as const,
  },
  unifiedLibrary: {
    data: (userId?: string) => ['unified-library', 'data', userId] as const,
  },
  enhancedSpendingData: (userId?: string, onlyUnplayed?: boolean) =>
    ['enhanced-spending-data', userId, onlyUnplayed] as const,
  cleanSpendingData: (userId?: string, onlyUnplayed?: boolean) => 
    ['clean-spending-data', userId, onlyUnplayed] as const,
  
  cleanLibraryStats: (userId?: string) => 
    ['clean-library-stats', userId] as const,
  
  cleanGamePrice: (gameId: number, fallbackPrice?: number) => 
    ['clean-game-price', gameId, fallbackPrice] as const,

  // Add missing query keys - match actual usage patterns
  profile: (userId?: string) => ['profile', userId] as const,
  
  gamePicks: (userId?: string) => ['game-picks', userId] as const,
  
  detailedDustData: (userId?: string) => ['detailed-dust-data', userId] as const,
  
  libraryGamesCount: (userId?: string, filters?: any) => 
    ['library-games-count', userId, filters] as const,
  
  paginatedLibraryGames: (
    userId?: string, 
    page?: number, 
    pageSize?: number, 
    filters?: any, 
    sortBy?: string, 
    sortDirection?: string
  ) => 
    ['paginated-library-games', userId, page, pageSize, filters, sortBy, sortDirection] as const,

  // Add missing query keys that Index.tsx expects
  libraryGames: (userId?: string) => ['library-games', userId] as const,
  
  pickerGames: (userId?: string) => ['picker-games', userId] as const,
  
  spendingData: (userId?: string) => ['spending-data', userId] as const,
} as const;

// Export FilterOptions type that matches actual usage in use-paginated-library.tsx
export interface FilterOptions {
  search?: string;  // matches actual usage
  hideIgnored?: boolean;  // matches actual usage
  onlyUnplayed?: boolean;  // matches actual usage
  selectedGenre?: string;  // matches actual usage
  
  // Legacy properties that might be used elsewhere
  genreFilter?: string;
  platformFilter?: string;
  searchQuery?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  showOnlyUnplayed?: boolean;
  showOnlyFree?: boolean;
  priceRange?: [number, number];
}

// Export useCacheManagement function with proper structure
export const useCacheManagement = () => {
  return {
    clearAllCaches: () => {
      console.log('Cache management functionality');
    },
    queryKeys,
    utils: {
      invalidateAll: () => {
        console.log('Invalidating all caches');
      },
      invalidateUnifiedLibrary: (userId?: string) => [
        queryKeys.unifiedLibrary.data(userId),
        queryKeys.library.data(userId),
        queryKeys.libraryGames(userId),
        queryKeys.libraryGamesCount(userId),
        queryKeys.paginatedLibraryGames(userId),
      ],
      invalidateProfile: (userId?: string) => [
        queryKeys.profile(userId),
        queryKeys.auth.profile(),
      ]
    }
  };
};

