
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/hooks/use-query-keys';

export interface GenreStat {
  id: string;
  genre_name: string;
  game_count: number;
  percentage: number;
  color_hex: string;
  last_calculated: string;
}

export const useGenreStats = () => {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.genreStats(user?.id),
    queryFn: async (): Promise<GenreStat[]> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('Fetching genre stats...');

      const { data: genreData, error: genreError } = await supabase
        .from('user_genre_stats')
        .select('*')
        .eq('user_id', user.id)
        .order('game_count', { ascending: false });

      if (genreError) {
        console.error('Error fetching genre stats:', genreError);
        throw genreError;
      }

      console.log('Genre stats loaded:', genreData?.length || 0, 'genres');
      return genreData || [];
    },
    enabled: !!user,
    staleTime: 30 * 60 * 1000, // 30 minutes (extended for edge function optimization)
    retry: 2,
  });

  return {
    data: data || [],
    isLoading,
    error,
  };
};

export default useGenreStats;
