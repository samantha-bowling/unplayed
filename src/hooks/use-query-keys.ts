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
        queryKeys.detailedDustData(userId)
      ];
    }
  }
};
