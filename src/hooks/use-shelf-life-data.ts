
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/hooks/use-query-keys';

export interface ShelfLifeGame {
  gameId: number;
  releaseDate: string | null;
  yearsOld: number;
  playtimeMinutes: number;
  rank: number;
  gameName: string;
  imageUrl: string | null;
}

export const useShelfLifeData = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.shelfLifeData(user?.id),
    queryFn: async (): Promise<ShelfLifeGame[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_shelf_life')
        .select(`
          game_id,
          release_date,
          years_old,
          playtime_minutes,
          shelf_life_rank,
          games:game_id (
            name,
            image_url,
            header_image
          )
        `)
        .eq('user_id', user.id)
        .order('shelf_life_rank', { ascending: true });

      if (error) {
        console.error('Error fetching shelf life data:', error);
        return [];
      }

      return data.map(item => ({
        gameId: item.game_id,
        releaseDate: item.release_date,
        yearsOld: item.years_old || 0,
        playtimeMinutes: item.playtime_minutes || 0,
        rank: item.shelf_life_rank,
        gameName: item.games?.name || 'Unknown Game',
        imageUrl: item.games?.header_image || item.games?.image_url || null
      }));
    },
    enabled: !!user,
    staleTime: 30 * 60 * 1000, // 30 minutes (extended for edge function optimization)
  });
};
