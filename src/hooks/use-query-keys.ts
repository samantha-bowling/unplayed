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
} as const;
