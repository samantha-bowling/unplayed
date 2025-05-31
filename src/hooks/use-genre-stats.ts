
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/hooks/use-query-keys';

export interface GenreStat {
  genreName: string;
  gameCount: number;
  percentage: number;
  colorHex: string;
}

export const useGenreStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.genreStats(user?.id),
    queryFn: async (): Promise<GenreStat[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_genre_stats')
        .select('*')
        .eq('user_id', user.id)
        .order('game_count', { ascending: false });

      if (error) {
        console.error('Error fetching genre stats:', error);
        return [];
      }

      return data.map(stat => ({
        genreName: stat.genre_name,
        gameCount: stat.game_count,
        percentage: stat.percentage,
        colorHex: stat.color_hex
      }));
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
