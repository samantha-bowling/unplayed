
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

    // First, get user metrics with user info
    const { data: metricsData, error: metricsError } = await supabase
      .from('user_metrics')
      .select(`
        user_id,
        total_dust_score,
        clean_score,
        total_games,
        played_games,
        unplayed_games,
        total_library_value_cents
      `)
      .order('total_dust_score', { ascending: false })
      .range(from, to);

    if (metricsError) throw metricsError;

    if (!metricsData || metricsData.length === 0) {
      return { data: [], hasMore: false };
    }

    // Get user IDs to fetch user info
    const userIds = metricsData.map(entry => entry.user_id);

    // Get user visibility settings
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, steam_name, leaderboard_visibility')
      .in('id', userIds)
      .not('leaderboard_visibility', 'eq', 'off');

    if (usersError) throw usersError;

    // Transform the data to match our expected format
    const transformedData: RealtimeLeaderboardEntry[] = metricsData
      .map((entry, index) => {
        const userInfo = usersData?.find(u => u.id === entry.user_id);
        
        // Skip users who don't have visibility settings or are set to 'off'
        if (!userInfo) return null;

        return {
          user_id: entry.user_id,
          username: userInfo.leaderboard_visibility === 'public' ? userInfo.steam_name : null,
          is_anonymous: userInfo.leaderboard_visibility === 'anonymous',
          dust_score: entry.total_dust_score,
          clean_score: entry.clean_score,
          total_games: entry.total_games,
          played_games: entry.played_games,
          unplayed_games: entry.unplayed_games,
          library_value_cents: entry.total_library_value_cents,
          ranking: from + index + 1
        };
      })
      .filter(Boolean) as RealtimeLeaderboardEntry[];

    const hasMore = metricsData.length === PAGE_SIZE;

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
