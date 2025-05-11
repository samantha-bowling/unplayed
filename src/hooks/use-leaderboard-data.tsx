
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
  snapshot_date: string;
  user_id: string;
};

type LeaderboardType = 'dust' | 'clean';

type PaginationState = {
  cursor: string | null;
  hasMore: boolean;
  page: number;
};

// Define the type for the query result
type LeaderboardQueryResult = {
  data: LeaderboardEntry[];
  hasMore: boolean;
  nextCursor: string | null;
};

const PAGE_SIZE = 20;

export const useLeaderboardData = (type: LeaderboardType) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [timeframe, setTimeframe] = useState<'all' | 'month' | 'week'>('all');
  const [pagination, setPagination] = useState<PaginationState>({
    cursor: null,
    hasMore: true,
    page: 1
  });

  const getTimeframeFilter = () => {
    const now = new Date();
    if (timeframe === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      return weekAgo.toISOString();
    } else if (timeframe === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(now.getMonth() - 1);
      return monthAgo.toISOString();
    }
    return null; // 'all' timeframe
  };

  const orderByColumn = type === 'dust' ? 'dust_score' : 'clean_score';
  // Using string literal instead of comparing strings to avoid TypeScript error
  const orderDirection = 'desc';

  const fetchLeaderboardPage = async (
    cursorValue: string | null, 
    timeframeFilter: string | null
  ): Promise<LeaderboardQueryResult> => {
    let query = supabase
      .from('leaderboard_snapshots')
      .select('id, username, is_anonymous, dust_score, clean_score, total_games, played_games, unplayed_games, library_value_cents, ranking, snapshot_date, user_id');
    
    // Apply timeframe filter if needed
    if (timeframeFilter) {
      query = query.gte('snapshot_date', timeframeFilter);
    }
    
    // Apply cursor pagination if cursor exists
    if (cursorValue) {
      // For dust score or clean score, we're ordering by descending score
      if (type === 'dust') {
        query = query.lt('dust_score', Number(cursorValue.split('|')[0]));
      } else {
        query = query.lt('clean_score', Number(cursorValue.split('|')[0]));
      }
      
      // Add tie-breaker on user_id to ensure stable ordering
      const userId = cursorValue.split('|')[1];
      if (userId) {
        query = query.or(`user_id.gt.${userId},${orderByColumn}.lt.${Number(cursorValue.split('|')[0])}`);
      }
    }
    
    // Order by the appropriate score column and limit results
    const { data, error } = await query
      .order(orderByColumn, { ascending: false })
      .order('user_id', { ascending: true }) // Tie-breaker for stable pagination
      .limit(PAGE_SIZE + 1); // Fetch one extra to determine if we have more pages
    
    if (error) throw error;
    
    // Check if we have more pages
    const hasMore = data && data.length > PAGE_SIZE;
    // Remove the extra item if we have more pages
    const results = hasMore ? data.slice(0, PAGE_SIZE) : data;
    
    // Build the next cursor from the last item
    let nextCursor = null;
    if (hasMore && results.length > 0) {
      const lastItem = results[results.length - 1];
      nextCursor = `${lastItem[orderByColumn]}|${lastItem.user_id}`;
    }
    
    return {
      data: results as LeaderboardEntry[],
      hasMore,
      nextCursor
    };
  };

  const timeFilter = getTimeframeFilter();

  const queryResult = useQuery<LeaderboardQueryResult, Error>({
    queryKey: ['leaderboard', type, timeframe, pagination.page],
    queryFn: async () => {
      return await fetchLeaderboardPage(pagination.cursor, timeFilter);
    },
    staleTime: 60 * 1000, // 1 min stale
    gcTime: 5 * 60 * 1000, // 5 min in cache (replaced cacheTime)
    refetchOnWindowFocus: false,
    refetchOnMount: false // Optimize refetch behavior
  });

  // Move prefetching logic to useEffect
  useEffect(() => {
    // Only prefetch if we have data and there's more to fetch
    if (queryResult.data?.hasMore && queryResult.data?.nextCursor) {
      queryClient.prefetchQuery({
        queryKey: ['leaderboard', type, timeframe, pagination.page + 1],
        queryFn: async () => {
          return await fetchLeaderboardPage(queryResult.data.nextCursor, timeFilter);
        },
        gcTime: 5 * 60 * 1000 // Match parent query's gcTime for consistency
      });
    }
  }, [queryResult.data, type, timeframe, pagination.page, queryClient, timeFilter]);

  const loadNextPage = () => {
    if (queryResult.data?.hasMore) {
      setPagination({
        cursor: queryResult.data.nextCursor,
        hasMore: queryResult.data.hasMore,
        page: pagination.page + 1
      });
    }
  };

  const resetPagination = () => {
    setPagination({
      cursor: null,
      hasMore: true,
      page: 1
    });
  };

  // When timeframe or type changes, reset pagination
  const changeTimeframe = (newTimeframe: 'all' | 'month' | 'week') => {
    setTimeframe(newTimeframe);
    resetPagination();
  };

  // Find user rank in the current data
  const leaderboardEntries = queryResult.data?.data || [];
  const userRank = user && leaderboardEntries.length > 0 
    ? leaderboardEntries.findIndex(entry => entry.user_id === user.id) + 1 
    : null;

  return {
    data: leaderboardEntries,
    isLoading: queryResult.isLoading,
    error: queryResult.error,
    refetch: queryResult.refetch,
    timeframe,
    setTimeframe: changeTimeframe,
    userRank,
    pagination: {
      hasMore: queryResult.data?.hasMore || false,
      page: pagination.page,
      loadNextPage
    }
  };
};

export default useLeaderboardData;
