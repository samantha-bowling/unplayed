
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export type RealtimeLeaderboardEntry = {
  user_id: string;
  username: string | null;
  is_anonymous: boolean;
  dust_score: number;
  clean_score: number;
  total_games: number;
  played_games: number;
  unplayed_games: number;
  library_value_cents: number | null;
  ranking: number;
};

const PAGE_SIZE = 20;

export const useRealtimeLeaderboard = () => {
  const { user } = useAuth();
  const [pagination, setPagination] = useState({
    page: 1,
    hasMore: true
  });

  const fetchLeaderboard = async (page: number): Promise<{ data: RealtimeLeaderboardEntry[], hasMore: boolean }> => {
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    // Query user_metrics with users data for real-time leaderboard
    const { data, error } = await supabase
      .from('user_metrics')
      .select(`
        user_id,
        total_dust_score,
        clean_score,
        total_games,
        played_games,
        unplayed_games,
        total_library_value_cents,
        users!inner (
          steam_name,
          leaderboard_visibility
        )
      `)
      .not('users.leaderboard_visibility', 'eq', 'off')
      .order('total_dust_score', { ascending: false })
      .range(from, to);

    if (error) throw error;

    // Transform the data to match our expected format
    const transformedData: RealtimeLeaderboardEntry[] = data.map((entry, index) => ({
      user_id: entry.user_id,
      username: entry.users.leaderboard_visibility === 'public' ? entry.users.steam_name : null,
      is_anonymous: entry.users.leaderboard_visibility === 'anonymous',
      dust_score: entry.total_dust_score,
      clean_score: entry.clean_score,
      total_games: entry.total_games,
      played_games: entry.played_games,
      unplayed_games: entry.unplayed_games,
      library_value_cents: entry.total_library_value_cents,
      ranking: from + index + 1
    }));

    const hasMore = data.length === PAGE_SIZE;

    return {
      data: transformedData,
      hasMore
    };
  };

  const queryResult = useQuery({
    queryKey: ['realtime-leaderboard', pagination.page],
    queryFn: () => fetchLeaderboard(pagination.page),
    staleTime: 30 * 1000, // 30 seconds - more frequent updates for real-time feel
    gcTime: 2 * 60 * 1000, // 2 minutes cache
    refetchOnWindowFocus: true,
    refetchInterval: 60 * 1000 // Auto-refresh every minute
  });

  const loadNextPage = () => {
    if (queryResult.data?.hasMore) {
      setPagination(prev => ({
        ...prev,
        page: prev.page + 1
      }));
    }
  };

  // Find current user's rank in the data
  const currentUserRank = user && queryResult.data?.data 
    ? queryResult.data.data.findIndex(entry => entry.user_id === user.id) + 1
    : null;

  return {
    data: queryResult.data?.data || [],
    isLoading: queryResult.isLoading,
    error: queryResult.error,
    refetch: queryResult.refetch,
    userRank: currentUserRank > 0 ? currentUserRank : null,
    pagination: {
      hasMore: queryResult.data?.hasMore || false,
      page: pagination.page,
      loadNextPage
    }
  };
};

export default useRealtimeLeaderboard;
