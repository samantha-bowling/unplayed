/**
 * Unified Query Keys System - Phase 2 Optimization
 * Consolidates previous dual systems with enhanced cache management
 */

export interface FilterOptions {
  search: string;
  hideIgnored: boolean;
  onlyUnplayed: boolean;
  selectedGenre: string;
}

type QueryKey = readonly [string, ...unknown[]];

export const queryKeys = {
  // Core user data
  profile: {
    base: (userId?: string) => ['profile', userId] as const,
    steam: (userId?: string, steamId?: string) => ['steam-profile', steamId || userId] as const,
  },

  // Game data
  games: {
    library: (userId?: string) => ['library', userId] as const,
    libraryItem: (gameId: string) => ['library-item', gameId] as const,
    unplayed: (userId?: string) => ['unplayed-games', userId] as const,
    unplayedList: (userId?: string) => ['unplayed-games-list', userId] as const,
    unplayedData: (userId?: string, profileSteamId?: string) => 
      ['unplayed-data', userId, profileSteamId] as const,
    picks: (userId?: string) => ['game-picks', userId] as const,
    estimates: (gameIds: number[]) => ['estimates', 'games', [...gameIds].sort()] as const,
  },

  // Metrics and analytics
  metrics: {
    user: (userId?: string) => ['user-metrics', userId] as const,
    spending: (userId?: string) => ['spending-data', userId] as const,
    spendingMetrics: (userId?: string) => ['spendingMetrics', userId] as const,
    spendingConfidence: (userId?: string) => ['spending-confidence', userId] as const,
    dustBreakdowns: (userId?: string) => ['dust-breakdowns', userId] as const,
    cleanScoreBreakdowns: (userId?: string) => ['clean-score-breakdowns', userId] as const,
    detailedDustData: (userId?: string) => ['detailed-dust-data', userId] as const,
  },

  // Library features
  library: {
    count: (userId?: string, filters?: FilterOptions) => 
      ['library-games-count', userId, filters] as const,
    paginated: (
      userId?: string, 
      page?: number, 
      pageSize?: number, 
      filters?: FilterOptions, 
      sortBy?: string, 
      sortDirection?: string
    ) => ['paginated-library-games', userId, page, pageSize, filters, sortBy, sortDirection] as const,
    shelfLife: (userId?: string) => ['shelf-life', userId] as const,
    shelfLifeData: (userId?: string) => ['shelf-life-data', userId] as const,
    genreBreakdown: (userId?: string) => ['genre-breakdown', userId] as const,
    genreStats: (userId?: string) => ['genre-stats', userId] as const,
  },

  // Specialized data
  spending: {
    topGames: (userId?: string) => ['topSpendingGames', userId] as const,
    topExpensiveUnplayed: (userId?: string) => ['top-expensive-unplayed-games', userId] as const,
    priceDistribution: (userId?: string) => ['price-distribution', userId] as const,
  },

  // Cache management helpers
  helpers: {
    // Get all user-related keys for complete refresh
    allUserData: (userId?: string): QueryKey[] => [
      queryKeys.profile.base(userId),
      queryKeys.games.library(userId),
      queryKeys.games.unplayed(userId),
      queryKeys.games.unplayedList(userId),
      queryKeys.games.picks(userId),
      queryKeys.metrics.user(userId),
      queryKeys.metrics.spending(userId),
      queryKeys.metrics.spendingMetrics(userId),
      queryKeys.metrics.dustBreakdowns(userId),
      queryKeys.metrics.cleanScoreBreakdowns(userId),
      queryKeys.library.shelfLife(userId),
      queryKeys.library.shelfLifeData(userId),
      queryKeys.library.genreStats(userId),
      queryKeys.spending.topGames(userId),
      queryKeys.spending.topExpensiveUnplayed(userId),
      queryKeys.spending.priceDistribution(userId),
    ],

    // Core metrics for dashboard refresh
    coreMetrics: (userId?: string): QueryKey[] => [
      queryKeys.metrics.user(userId),
      queryKeys.metrics.spending(userId),
      queryKeys.metrics.spendingMetrics(userId),
      queryKeys.games.unplayedData(userId),
    ],

    // Library-specific data
    libraryData: (userId?: string): QueryKey[] => [
      queryKeys.games.library(userId),
      queryKeys.library.genreStats(userId),
      queryKeys.library.shelfLifeData(userId),
    ],

    // Profile and authentication
    profileData: (userId?: string): QueryKey[] => [
      queryKeys.profile.base(userId),
      queryKeys.profile.steam(userId),
    ],

    // Spending analysis
    spendingData: (userId?: string): QueryKey[] => [
      queryKeys.metrics.spending(userId),
      queryKeys.metrics.spendingMetrics(userId),
      queryKeys.metrics.spendingConfidence(userId),
      queryKeys.spending.topGames(userId),
      queryKeys.spending.topExpensiveUnplayed(userId),
      queryKeys.spending.priceDistribution(userId),
    ],

    // Dust score related
    dustData: (userId?: string): QueryKey[] => [
      queryKeys.metrics.dustBreakdowns(userId),
      queryKeys.metrics.cleanScoreBreakdowns(userId),
      queryKeys.metrics.detailedDustData(userId),
    ],
  }
} as const;

export default queryKeys;