
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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

export const useLeaderboardData = (type: LeaderboardType) => {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState<'all' | 'month' | 'week'>('all');

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
  // Fix: Remove comparison that causes the TypeScript error
  const orderDirection = 'desc'; // Higher is better for both dust and clean scores

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['leaderboard', type, timeframe],
    queryFn: async () => {
      const timeFilter = getTimeframeFilter();
      
      let query = supabase
        .from('leaderboard_snapshots')
        .select('*');
      
      // Apply timeframe filter if needed
      if (timeFilter) {
        query = query.gte('snapshot_date', timeFilter);
      }
      
      // Order by the appropriate score column
      const { data, error } = await query
        .order(orderByColumn, { ascending: orderDirection === 'asc' })
        .limit(100);
      
      if (error) throw error;
      return data as LeaderboardEntry[];
    },
  });

  const userRank = user && data ? data.findIndex(entry => entry.user_id === user.id) + 1 : null;

  return {
    data,
    isLoading,
    error,
    refetch,
    timeframe,
    setTimeframe,
    userRank,
  };
};

export default useLeaderboardData;
