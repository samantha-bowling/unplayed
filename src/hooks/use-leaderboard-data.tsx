
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export type LeaderboardEntry = {
  id: string;
  username: string | null;
  is_anonymous: boolean;
  dust_score: number;
  clean_score: number;
  total_games: number;
  played_games: number;
  unplayed_games: number;
  library_value_cents: number | null;
  ranking: number | null;
  previous_ranking: number | null;
  rank_change: number | null;
  snapshot_date: string;
  user_id: string;
};

type LeaderboardType = 'dust' | 'clean';

type PaginationState = {
  cursor: string | null;
  hasMore: boolean;
  page: number;
  pageSize: number;
  totalItems: number;
};

// Define the type for the query result
type LeaderboardQueryResult = {
  data: LeaderboardEntry[];
  hasMore: boolean;
  nextCursor: string | null;
  totalCount: number;
};

const DEFAULT_PAGE_SIZE = 20;

export const useLeaderboardData = (type: LeaderboardType) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  // Always default to 'all' timeframe for all-time leaderboard
  const [timeframe] = useState<'all' | 'month' | 'week'>('all');
  const [pagination, setPagination] = useState<PaginationState>({
    cursor: null,
    hasMore: true,
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    totalItems: 0
  });
  
  // Query for the last updated timestamp
  const lastUpdatedQuery = useQuery({
    queryKey: ['leaderboard-last-updated'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leaderboard_snapshots')
        .select('snapshot_date')
        .order('snapshot_date', { ascending: false })
        .limit(1)
        .single();
      
      if (error) throw error;
      return data.snapshot_date;
    },
    staleTime: 60 * 1000, // 1 min stale
    gcTime: 5 * 60 * 1000 // 5 min in cache
  });

  // Query for previous snapshot date (for calculating rank changes)
  const previousSnapshotQuery = useQuery({
    queryKey: ['leaderboard-previous-snapshot', lastUpdatedQuery.data],
    enabled: !!lastUpdatedQuery.data,
    queryFn: async () => {
      const currentDate = lastUpdatedQuery.data;
      if (!currentDate) return null;
      
      const { data, error } = await supabase
        .from('leaderboard_snapshots')
        .select('snapshot_date')
        .lt('snapshot_date', currentDate)
        .order('snapshot_date', { ascending: false })
        .limit(1)
        .single();
      
      if (error) {
        // It's possible there is no previous snapshot yet
        console.log('No previous snapshot found');
        return null;
      }
      
      return data.snapshot_date;
    },
    staleTime: 60 * 1000, // 1 min stale
    gcTime: 5 * 60 * 1000 // 5 min in cache
  });

  const getTimeframeFilter = () => {
    // For all-time leaderboard, we don't filter by timeframe
    return null;
  };

  const orderByColumn = type === 'dust' ? 'dust_score' : 'clean_score';

  // Query for total count
  const countQuery = useQuery({
    queryKey: ['leaderboard-count', type, lastUpdatedQuery.data],
    queryFn: async () => {
      if (!lastUpdatedQuery.data) return 0;
      
      const { count, error } = await supabase
        .from('leaderboard_snapshots')
        .select('*', { count: 'exact', head: true })
        .eq('snapshot_date', lastUpdatedQuery.data);
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!lastUpdatedQuery.data,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000
  });

  const fetchLeaderboardPage = async (
    pageNumber: number,
    pageSize: number,
    timeframeFilter: string | null
  ): Promise<LeaderboardQueryResult> => {
    let query = supabase
      .from('leaderboard_snapshots')
      .select('id, username, is_anonymous, dust_score, clean_score, total_games, played_games, unplayed_games, library_value_cents, ranking, previous_ranking, rank_change, snapshot_date, user_id');
    
    // For all-time leaderboard, get the most recent snapshot for each user
    if (!timeframeFilter) {
      // Use the latest snapshot date
      if (lastUpdatedQuery.data) {
        query = query.eq('snapshot_date', lastUpdatedQuery.data);
      }
    } else {
      // Apply timeframe filter if needed (though we default to 'all')
      query = query.gte('snapshot_date', timeframeFilter);
    }
    
    // Apply offset pagination
    const from = (pageNumber - 1) * pageSize;
    const to = from + pageSize - 1;
    
    // Order by the appropriate score column and apply pagination
    const { data, error } = await query
      .order(orderByColumn, { ascending: false })
      .order('user_id', { ascending: true }) // Tie-breaker for stable pagination
      .range(from, to);
    
    if (error) throw error;
    
    const results = data || [];
    const totalCount = countQuery.data || 0;
    const hasMore = (pageNumber * pageSize) < totalCount;
    
    // If we have a previous snapshot, fetch rank information to calculate changes
    if (previousSnapshotQuery.data) {
      const previousDate = previousSnapshotQuery.data;
      
      // For each user in our results, get their previous ranking
      for (const entry of results) {
        try {
          const { data: previousData } = await supabase
            .from('leaderboard_snapshots')
            .select('ranking')
            .eq('user_id', entry.user_id)
            .eq('snapshot_date', previousDate)
            .single();
          
          if (previousData && entry.ranking !== null) {
            // Store previous ranking
            entry.previous_ranking = previousData.ranking;
            // Calculate rank change (positive means improved, negative means dropped)
            entry.rank_change = previousData.ranking !== null ? 
                previousData.ranking - entry.ranking : null;
          } else {
            entry.previous_ranking = null;
            entry.rank_change = null;
          }
        } catch (error) {
          // User might not have existed in the previous snapshot
          entry.previous_ranking = null;
          entry.rank_change = null;
        }
      }
    } else {
      // No previous snapshot data available, set rank changes to null
      for (const entry of results) {
        entry.previous_ranking = null;
        entry.rank_change = null;
      }
    }
    
    return {
      data: results as LeaderboardEntry[],
      hasMore,
      nextCursor: null, // Not needed for offset pagination
      totalCount
    };
  };

  const timeFilter = getTimeframeFilter();

  const queryResult = useQuery<LeaderboardQueryResult, Error>({
    queryKey: ['leaderboard', type, timeframe, pagination.page, pagination.pageSize, lastUpdatedQuery.data],
    queryFn: async () => {
      return await fetchLeaderboardPage(pagination.page, pagination.pageSize, timeFilter);
    },
    enabled: !!lastUpdatedQuery.data && !!countQuery.data, // Only run when we have the latest snapshot date and count
    staleTime: 60 * 1000, // 1 min stale
    gcTime: 5 * 60 * 1000, // 5 min in cache
    refetchOnWindowFocus: false,
    refetchOnMount: false
  });

  // Prefetch next page
  useEffect(() => {
    // Only prefetch if we have data and there's more to fetch
    if (queryResult.data?.hasMore && lastUpdatedQuery.data && countQuery.data) {
      queryClient.prefetchQuery({
        queryKey: ['leaderboard', type, timeframe, pagination.page + 1, pagination.pageSize, lastUpdatedQuery.data],
        queryFn: async () => {
          return await fetchLeaderboardPage(pagination.page + 1, pagination.pageSize, timeFilter);
        },
        gcTime: 5 * 60 * 1000
      });
    }
  }, [queryResult.data, type, timeframe, pagination.page, pagination.pageSize, queryClient, timeFilter, lastUpdatedQuery.data, countQuery.data]);

  const goToPage = (page: number) => {
    setPagination(prev => ({
      ...prev,
      page: Math.max(1, Math.min(page, Math.ceil((queryResult.data?.totalCount || 0) / prev.pageSize)))
    }));
  };

  const setPageSize = (size: number) => {
    setPagination(prev => ({
      ...prev,
      pageSize: size,
      page: 1,
      totalItems: queryResult.data?.totalCount || 0
    }));
  };

  const resetPagination = () => {
    setPagination({
      cursor: null,
      hasMore: true,
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      totalItems: 0
    });
  };

  // Fixed timeframe setter for backward compatibility (always 'all')
  const changeTimeframe = (newTimeframe: 'all' | 'month' | 'week') => {
    // For all-time leaderboard, we ignore timeframe changes
    console.log('Timeframe changes ignored for all-time leaderboard');
  };

  // Find user rank in the current data
  const leaderboardEntries = queryResult.data?.data || [];
  const userRank = user && leaderboardEntries.length > 0 
    ? leaderboardEntries.findIndex(entry => entry.user_id === user.id) + 1 
    : null;

  // Update total items when query data changes
  useEffect(() => {
    if (queryResult.data?.totalCount !== undefined) {
      setPagination(prev => ({
        ...prev,
        totalItems: queryResult.data.totalCount
      }));
    }
  }, [queryResult.data?.totalCount]);

  return {
    data: leaderboardEntries,
    isLoading: queryResult.isLoading || lastUpdatedQuery.isLoading || countQuery.isLoading,
    error: queryResult.error || lastUpdatedQuery.error || countQuery.error,
    refetch: queryResult.refetch,
    timeframe,
    setTimeframe: changeTimeframe,
    userRank: userRank && userRank > 0 ? userRank : null,
    lastUpdated: {
      date: lastUpdatedQuery.data,
      isLoading: lastUpdatedQuery.isLoading,
      error: lastUpdatedQuery.error
    },
    previousSnapshot: {
      date: previousSnapshotQuery.data,
      isLoading: previousSnapshotQuery.isLoading,
      error: previousSnapshotQuery.error
    },
    pagination: {
      hasMore: queryResult.data?.hasMore || false,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalItems: pagination.totalItems,
      totalPages: Math.ceil(pagination.totalItems / pagination.pageSize),
      goToPage,
      setPageSize
    }
  };
};

export default useLeaderboardData;
