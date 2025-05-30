
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

  // Add missing query keys
  profile: (userId?: string) => ['profile', userId] as const,
  
  gamePicks: (userId?: string) => ['game-picks', userId] as const,
  
  detailedDustData: (userId?: string) => ['detailed-dust-data', userId] as const,
  
  libraryGamesCount: (userId?: string) => ['library-games-count', userId] as const,
  
  paginatedLibraryGames: (userId?: string, page?: number, filters?: any) => 
    ['paginated-library-games', userId, page, filters] as const,
} as const;

// Export FilterOptions type that's used by paginated library
export interface FilterOptions {
  genreFilter?: string;
  platformFilter?: string;
  searchQuery?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  showOnlyUnplayed?: boolean;
  showOnlyFree?: boolean;
  priceRange?: [number, number];
}

// Export useCacheManagement function
export const useCacheManagement = () => {
  return {
    clearAllCaches: () => {
      console.log('Cache management functionality');
    }
  };
};
