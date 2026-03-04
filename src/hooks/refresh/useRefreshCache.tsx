
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { queryKeys } from '@/hooks/use-query-keys';
import { useOptimizedCacheManagement } from '@/hooks/use-query-keys';

export type CacheInvalidationScope = 'unplayed' | 'phase2-metrics' | 'spending' | 'all-user-data';

export const useRefreshCache = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { queryKeys: optimizedKeys, utils } = useOptimizedCacheManagement();

  // Get keys to invalidate based on scope
  const getKeysForScope = useCallback((scope: CacheInvalidationScope) => {
    if (!user?.id) return [];

    switch (scope) {
      case 'unplayed':
        return [
          queryKeys.unplayedGames(user.id),
          queryKeys.library(user.id),
          optimizedKeys.unplayed.data(user.id),
        ];

      case 'phase2-metrics':
        return [
          ...optimizedKeys.helpers.phase2Metrics(user.id),
          ...queryKeys.helpers.phase2Metrics(user.id),
        ];

      case 'spending':
        return [
          queryKeys.spendingMetrics(user.id),
          queryKeys.spendingData(user.id),
          optimizedKeys.metrics.spending(user.id),
        ];

      case 'all-user-data':
        return [
          ...optimizedKeys.helpers.allUserData(user.id),
          ...queryKeys.helpers.allUserData(user.id),
        ];

      default:
        return [];
    }
  }, [user?.id, optimizedKeys, queryKeys]);

  // Invalidate cache for specific scope
  const invalidateCache = useCallback((scope: CacheInvalidationScope) => {
    const keysToInvalidate = getKeysForScope(scope);
    
    keysToInvalidate.forEach(key => {
      queryClient.invalidateQueries({ queryKey: key });
    });

    
  }, [getKeysForScope, queryClient]);

  // Invalidate cache with delay (useful for backend processing)
  const invalidateCacheDelayed = useCallback((scope: CacheInvalidationScope, delayMs: number = 1000) => {
    setTimeout(() => {
      invalidateCache(scope);
    }, delayMs);
  }, [invalidateCache]);

  return {
    invalidateCache,
    invalidateCacheDelayed,
    getKeysForScope,
  };
};
