
import { FilterOptions } from './use-paginated-library';

// Enhanced type definition for query keys
interface QueryKeyBase {
  readonly scope: 'unplayed' | 'estimates' | 'profile' | 'spending' | 'library' | 'leaderboard' | 'dust' | 'unifiedLibrary';
  readonly entity: 'data' | 'list' | 'detail' | 'count' | 'breakdown' | 'stats';
  readonly type: 'query' | 'mutation';
  readonly id?: string;
  readonly filters?: FilterOptions;
  readonly page?: number;
  readonly pageSize?: number;
  readonly sortBy?: string;
  readonly sortDirection?: 'asc' | 'desc';
}

// Helper type to enforce the structure
type QueryKey<T extends QueryKeyBase> =
  [T['scope'], T['entity'], T['id'] | undefined,
    Omit<T, 'scope' | 'entity' | 'type' | 'id'>]

export const optimizedQueryKeys = {
  unplayed: {
    all: ['unplayed'] as const,
    data: (userId: string | undefined, steamId: string | undefined) =>
      [{ scope: 'unplayed', entity: 'data', type: 'query', id: userId, steamId }] as const,
  },
  estimates: {
    all: ['estimates'] as const,
    byGameIds: (gameIds: number[]) =>
      [{ scope: 'estimates', entity: 'list', type: 'query', id: gameIds.join(',') }] as const,
  },
  profile: {
    all: ['profile'] as const,
    detail: (userId: string | undefined) =>
      [{ scope: 'profile', entity: 'detail', type: 'query', id: userId }] as const,
  },
  spending: {
    all: ['spending'] as const,
    breakdown: (userId: string | undefined) =>
      [{ scope: 'spending', entity: 'breakdown', type: 'query', id: userId }] as const,
  },
  library: {
    all: ['library'] as const,
    list: (userId: string | undefined, filters?: FilterOptions) =>
      [{ scope: 'library', entity: 'list', type: 'query', id: userId, filters }] as const,
  },
  leaderboard: {
    all: ['leaderboard'] as const,
    list: (metric: string) =>
      [{ scope: 'leaderboard', entity: 'list', type: 'query', id: metric }] as const,
  },
  dust: {
    all: ['dust'] as const,
    detail: (userId: string | undefined) =>
      [{ scope: 'dust', entity: 'detail', type: 'query', id: userId }] as const,
  },
  // New unified library data keys
  unifiedLibrary: {
    all: ['unifiedLibrary'] as const,
    data: (userId: string | undefined) => 
      [{ scope: 'unifiedLibrary', entity: 'data', type: 'query', id: userId }] as const,
    stats: (userId: string | undefined) => 
      [{ scope: 'unifiedLibrary', entity: 'stats', type: 'query', id: userId }] as const,
  },
  libraryGamesCount: (userId: string | undefined, filters: FilterOptions) =>
    [{
      scope: 'library',
      entity: 'count',
      type: 'query',
      id: userId,
      filters: filters
    }] as const,
  paginatedLibraryGames: (
    userId: string | undefined,
    page: number,
    pageSize: number,
    filters: FilterOptions,
    sortBy: string,
    sortDirection: 'asc' | 'desc'
  ) =>
    [{
      scope: 'library',
      entity: 'list',
      type: 'query',
      id: userId,
      page: page,
      pageSize: pageSize,
      filters: filters,
      sortBy: sortBy,
      sortDirection: sortDirection
    }] as const,
  pickerGames: (userId: string | undefined) =>
    [{ scope: 'library', entity: 'list', type: 'query', id: userId }] as const,
  spendingData: (userId: string | undefined) =>
    [{ scope: 'spending', entity: 'data', type: 'query', id: userId }] as const,
  helpers: {
    allUserData: (userId: string) => {
      return [
        ...optimizedQueryKeys.unplayed.all,
        ...optimizedQueryKeys.estimates.all,
        ...optimizedQueryKeys.profile.all,
        ...optimizedQueryKeys.spending.all,
        ...optimizedQueryKeys.library.all,
        ...optimizedQueryKeys.dust.all,
      ].map(key => [...key, userId]);
    }
  },
  utils: {
    invalidateUnplayed: (userId: string | undefined) => {
      return [
        ['unplayed', 'data', userId, {}],
      ];
    },
    invalidateProfile: (userId: string | undefined) => {
      return [
        ['profile', 'detail', userId, {}],
      ];
    },
  }
} as const;

export const useOptimizedCacheManagement = () => {
  return {
    queryKeys: optimizedQueryKeys,
    utils: {
      invalidateUnplayed: (userId: string | undefined) => {
        return [
          ['unplayed', 'data', userId, {}],
        ];
      },
      invalidateProfile: (userId: string | undefined) => {
        return [
          ['profile', 'detail', userId, {}],
        ];
      },
    }
  };
};
