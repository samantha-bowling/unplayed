
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
  // Always default to 'all' timeframe for all-time leaderboard
  const [timeframe] = useState<'all' | 'month' | 'week'>('all');
  const [pagination, setPagination] = useState<PaginationState>({
    cursor: null,
    hasMore: true,
    page: 1
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

  const fetchLeaderboardPage = async (
    cursorValue: string | null, 
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
      nextCursor
    };
  };

  const timeFilter = getTimeframeFilter();

  const queryResult = useQuery<LeaderboardQueryResult, Error>({
    queryKey: ['leaderboard', type, timeframe, pagination.page, lastUpdatedQuery.data],
    queryFn: async () => {
      return await fetchLeaderboardPage(pagination.cursor, timeFilter);
    },
    enabled: !!lastUpdatedQuery.data, // Only run when we have the latest snapshot date
    staleTime: 60 * 1000, // 1 min stale
    gcTime: 5 * 60 * 1000, // 5 min in cache
    refetchOnWindowFocus: false,
    refetchOnMount: false
  });

  // Prefetch next page
  useEffect(() => {
    // Only prefetch if we have data and there's more to fetch
    if (queryResult.data?.hasMore && queryResult.data?.nextCursor && lastUpdatedQuery.data) {
      queryClient.prefetchQuery({
        queryKey: ['leaderboard', type, timeframe, pagination.page + 1, lastUpdatedQuery.data],
        queryFn: async () => {
          return await fetchLeaderboardPage(queryResult.data.nextCursor, timeFilter);
        },
        gcTime: 5 * 60 * 1000
      });
    }
  }, [queryResult.data, type, timeframe, pagination.page, queryClient, timeFilter, lastUpdatedQuery.data]);

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

  return {
    data: leaderboardEntries,
    isLoading: queryResult.isLoading || lastUpdatedQuery.isLoading,
    error: queryResult.error || lastUpdatedQuery.error,
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
      loadNextPage
    }
  };
};

export default useLeaderboardData;
