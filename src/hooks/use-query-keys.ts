
// FilterOptions type for shared use across hooks
export interface FilterOptions {
  search: string;
  hideIgnored: boolean;
  onlyUnplayed: boolean;
  selectedGenre: string;
}

export const queryKeys = {
  unplayedGames: (userId?: string) => ['unplayed-games', userId] as const,
  unplayedGamesList: (userId?: string) => ['unplayed-games-list', userId] as const,
  unplayedGame: (gameId: string) => ['unplayed-game', gameId] as const,
  library: (userId?: string) => ['library', userId] as const,
  libraryItem: (gameId: string) => ['library-item', gameId] as const,
  shelfLife: (userId?: string) => ['shelf-life', userId] as const,
  genreBreakdown: (userId?: string) => ['genre-breakdown', userId] as const,
  spendingData: (userId?: string) => ['spending-data', userId] as const,
  spendingConfidence: (userId?: string) => ['spending-confidence', userId] as const,
  steamProfile: (steamId?: string) => ['steam-profile', steamId] as const,
  profile: (userId?: string) => ['profile', userId] as const,
  detailedDustData: (userId?: string) => ['detailed-dust-data', userId] as const,
  
  // New Phase 2 query keys
  userMetrics: (userId?: string) => ['user-metrics', userId] as const,
  genreStats: (userId?: string) => ['genre-stats', userId] as const,
  shelfLifeData: (userId?: string) => ['shelf-life-data', userId] as const,
  dustBreakdowns: (userId?: string) => ['dust-breakdowns', userId] as const,
  cleanScoreBreakdowns: (userId?: string) => ['clean-score-breakdowns', userId] as const,

  // Missing query keys that were causing build errors
  gamePicks: (userId?: string) => ['game-picks', userId] as const,
  unplayedData: (userId?: string) => ['unplayed-data', userId] as const,
  libraryGamesCount: (userId?: string, filters?: FilterOptions) => ['library-games-count', userId, filters] as const,
  paginatedLibraryGames: (
    userId?: string, 
    page?: number, 
    pageSize?: number, 
    filters?: FilterOptions, 
    sortBy?: string, 
    sortDirection?: string
  ) => ['paginated-library-games', userId, page, pageSize, filters, sortBy, sortDirection] as const,

  spendingMetrics: (userId?: string) => ['spendingMetrics', userId] as const,
  
  // Add the missing topSpendingGames query key
  topSpendingGames: (userId?: string) => ['topSpendingGames', userId] as const,
  
  topExpensiveUnplayedGames: (userId?: string) => ['top-expensive-unplayed-games', userId] as const,
  
  priceDistribution: (userId?: string) => ['price-distribution', userId] as const,
  
  helpers: {
    allUserData: (userId: string) => {
      return [
        queryKeys.unplayedGames(userId),
        queryKeys.unplayedGamesList(userId),
        queryKeys.library(userId),
        queryKeys.shelfLife(userId),
        queryKeys.genreBreakdown(userId),
        queryKeys.spendingData(userId),
        queryKeys.spendingConfidence(userId),
        queryKeys.profile(userId),
        queryKeys.detailedDustData(userId),
        // Phase 2 metrics
        queryKeys.userMetrics(userId),
        queryKeys.genreStats(userId),
        queryKeys.shelfLifeData(userId),
        queryKeys.dustBreakdowns(userId),
        queryKeys.cleanScoreBreakdowns(userId),
        queryKeys.spendingMetrics(userId),
      ];
    },
    
    // Add Phase 2 specific helper
    phase2Metrics: (userId: string) => {
      return [
        queryKeys.userMetrics(userId),
        queryKeys.genreStats(userId),
        queryKeys.shelfLifeData(userId),
        queryKeys.dustBreakdowns(userId),
        queryKeys.cleanScoreBreakdowns(userId),
        queryKeys.spendingMetrics(userId),
      ];
    }
  }
} as const;

export default queryKeys;
