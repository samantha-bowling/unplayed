
export const queryKeys = {
  userMetrics: (userId?: string) => ['userMetrics', userId],
  dustBreakdowns: (userId?: string) => ['dustBreakdowns', userId],
  cleanScoreBreakdowns: (userId?: string) => ['cleanScoreBreakdowns', userId],
  unplayedData: (userId?: string) => ['unplayedData', userId],
  detailedDustData: (userId?: string) => ['detailedDustData', userId],
  spendingData: (userId?: string) => ['spendingData', userId],
  enhancedSpendingData: (userId?: string) => ['enhancedSpendingData', userId],
  libraryData: (userId?: string) => ['libraryData', userId],
  pickerData: (userId?: string) => ['pickerData', userId],
  leaderboardData: () => ['leaderboardData'],
  genreStats: (userId?: string) => ['genreStats', userId],
  shelfLifeData: (userId?: string) => ['shelfLifeData', userId],
  totalLibrarySpending: (userId?: string) => ['totalLibrarySpending', userId],
  steamReviews: (gameId: number) => ['steamReviews', gameId],
  gamePicks: (userId?: string) => ['gamePicks', userId],
  profile: (userId?: string) => ['profile', userId],
  adminStats: () => ['adminStats'],
  batchProcessor: () => ['batchProcessor'],
  libraryGamesCount: (userId?: string) => ['libraryGamesCount', userId],
  paginatedLibraryGames: (userId?: string, page?: number, limit?: number, filters?: any) => 
    ['paginatedLibraryGames', userId, page, limit, filters],
} as const;

export type FilterOptions = {
  search?: string;
  genre?: string;
  sortBy?: 'name' | 'playtime' | 'dust_score' | 'release_date';
  sortOrder?: 'asc' | 'desc';
  showUnplayed?: boolean;
  showPlayed?: boolean;
};
