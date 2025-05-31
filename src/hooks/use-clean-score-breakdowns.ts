
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/hooks/use-query-keys';

export interface CleanScoreBreakdownData {
  diversityScore: number;
  recencyScore: number;
  backlogConversionScore: number;
  sessionDepthScore: number;
  cleanStreakDays: number;
  recentlyPlayedCount: number;
  lastCalculated: string;
}

export const useCleanScoreBreakdowns = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.cleanScoreBreakdowns(user?.id),
    queryFn: async (): Promise<CleanScoreBreakdownData | null> => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_clean_score_breakdowns')
        .select('*')
        .eq('user_id', user.id)
        .order('last_calculated', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching clean score breakdowns:', error);
        return null;
      }

      return {
        diversityScore: data.diversity_score,
        recencyScore: data.recency_score,
        backlogConversionScore: data.backlog_conversion_score,
        sessionDepthScore: data.session_depth_score,
        cleanStreakDays: data.clean_streak_days,
        recentlyPlayedCount: data.recently_played_count,
        lastCalculated: data.last_calculated
      };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
