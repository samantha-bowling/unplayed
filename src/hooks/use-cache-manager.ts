import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './use-unified-query-keys';

type QueryKey = readonly unknown[];

/**
 * Enhanced cache management hook with optimized invalidation patterns
 */
export const useCacheManager = () => {
  const queryClient = useQueryClient();

  const invalidateQueries = async (keys: QueryKey[]) => {
    await Promise.all(
      keys.map(key => queryClient.invalidateQueries({ queryKey: key }))
    );
  };

  const removeQueries = (keys: QueryKey[]) => {
    keys.forEach(key => queryClient.removeQueries({ queryKey: key }));
  };

  return {
    // Core operations
    invalidateQueries,
    removeQueries,

    // User-specific operations
    user: {
      // Refresh all user data
      invalidateAll: async (userId?: string) => {
        await invalidateQueries(queryKeys.helpers.allUserData(userId));
      },

      // Refresh core metrics only
      invalidateCore: async (userId?: string) => {
        await invalidateQueries(queryKeys.helpers.coreMetrics(userId));
      },

      // Refresh library data
      invalidateLibrary: async (userId?: string) => {
        await invalidateQueries(queryKeys.helpers.libraryData(userId));
      },

      // Refresh spending data
      invalidateSpending: async (userId?: string) => {
        await invalidateQueries(queryKeys.helpers.spendingData(userId));
      },

      // Refresh dust scores
      invalidateDust: async (userId?: string) => {
        await invalidateQueries(queryKeys.helpers.dustData(userId));
      },

      // Clear all user cache (for logout)
      clearAll: (userId?: string) => {
        removeQueries(queryKeys.helpers.allUserData(userId));
      },

      // Update profile data after Steam sync
      invalidateProfile: async (userId?: string) => {
        await invalidateQueries(queryKeys.helpers.profileData(userId));
      },
    },

    // Game-specific operations
    games: {
      // Invalidate unplayed data
      invalidateUnplayed: async (userId?: string) => {
        await queryClient.invalidateQueries({ 
          queryKey: queryKeys.games.unplayed(userId) 
        });
        await queryClient.invalidateQueries({ 
          queryKey: queryKeys.games.unplayedList(userId) 
        });
        await queryClient.invalidateQueries({ 
          queryKey: queryKeys.games.unplayedData(userId) 
        });
      },

      // Refresh library
      invalidateLibrary: async (userId?: string) => {
        await queryClient.invalidateQueries({ 
          queryKey: queryKeys.games.library(userId) 
        });
      },

      // Clear specific game cache
      clearGame: (gameId: string) => {
        queryClient.removeQueries({ 
          queryKey: queryKeys.games.libraryItem(gameId) 
        });
      },
    },

    // Batch operations for performance
    batch: {
      // Post-import refresh (common after Steam sync)
      postImport: async (userId?: string) => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.games.library(userId) }),
          queryClient.invalidateQueries({ queryKey: queryKeys.games.unplayed(userId) }),
          queryClient.invalidateQueries({ queryKey: queryKeys.metrics.user(userId) }),
          queryClient.invalidateQueries({ queryKey: queryKeys.library.genreStats(userId) }),
        ]);
      },

      // Post-gameplay refresh (after marking games as played)
      postGameplay: async (userId?: string) => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.games.unplayed(userId) }),
          queryClient.invalidateQueries({ queryKey: queryKeys.metrics.user(userId) }),
          queryClient.invalidateQueries({ queryKey: queryKeys.metrics.dustBreakdowns(userId) }),
          queryClient.invalidateQueries({ queryKey: queryKeys.metrics.cleanScoreBreakdowns(userId) }),
        ]);
      },

      // Price refresh
      postPriceUpdate: async (userId?: string) => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.metrics.spending(userId) }),
          queryClient.invalidateQueries({ queryKey: queryKeys.spending.priceDistribution(userId) }),
          queryClient.invalidateQueries({ queryKey: queryKeys.spending.topExpensiveUnplayed(userId) }),
        ]);
      },
    }
  };
};

export default useCacheManager;