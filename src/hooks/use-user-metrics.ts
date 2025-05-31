
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/hooks/use-query-keys';

export interface UserMetrics {
  totalGames: number;
  unplayedGames: number;
  playedGames: number;
  totalDustScore: number;
  averageDustScore: number;
  cleanScore: number;
  cleanScoreTier: string;
  cleanStreak: number;
  totalLibraryValueCents: number;
  unplayedValueCents: number;
  totalPlaytimeHours: number;
  recentlyPlayedCount: number;
  lastCalculated: string;
}

export const useUserMetrics = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.userMetrics(user?.id),
    queryFn: async (): Promise<UserMetrics | null> => {
      if (!user) return null;

      console.log('Fetching user metrics for user:', user.id);

      const { data, error } = await supabase
        .from('user_metrics')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user metrics:', error);
        return null;
      }

      console.log('Raw user metrics from database:', data);

      const metrics = {
        totalGames: data.total_games,
        unplayedGames: data.unplayed_games,
        playedGames: data.played_games,
        totalDustScore: data.total_dust_score,
        averageDustScore: data.average_dust_score,
        cleanScore: data.clean_score,
        cleanScoreTier: data.clean_score_tier,
        cleanStreak: data.clean_streak,
        totalLibraryValueCents: data.total_library_value_cents || 0,
        unplayedValueCents: data.unplayed_value_cents || 0,
        totalPlaytimeHours: data.total_playtime_hours || 0,
        recentlyPlayedCount: data.recently_played_count || 0,
        lastCalculated: data.last_calculated
      };

      // Add data consistency debugging
      const unplayedPercentage = metrics.totalGames > 0 
        ? Math.round((metrics.unplayedGames / metrics.totalGames) * 100) 
        : 0;
      
      console.log('Processed user metrics with consistency check:', {
        ...metrics,
        unplayedPercentage,
        dataAge: new Date(data.last_calculated),
        isStale: new Date(data.last_calculated) < new Date(Date.now() - 24 * 60 * 60 * 1000)
      });

      return metrics;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
