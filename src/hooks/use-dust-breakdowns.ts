
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/hooks/use-query-keys';

export interface GameDustBreakdown {
  gameId: number;
  gameName: string;
  dustScore: number;
  ageScore: number;
  ownershipScore: number;
  qualityScore: number; // New 5-factor field
  priceScore: number;   // New 5-factor field
  genreScore: number;   // New 5-factor field
  playtimeFactor: number;
  imageUrl: string | null;
  headerImage: string | null;
  releaseDate: string | null;
  playtimeMinutes: number;
}

export const useDustBreakdowns = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.dustBreakdowns(user?.id),
    queryFn: async (): Promise<GameDustBreakdown[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('game_dust_breakdowns')
        .select('*')
        .eq('user_id', user.id)
        .order('current_dust_score', { ascending: false });

      if (error) {
        console.error('Error fetching dust breakdowns:', error);
        return [];
      }

      return data.map(breakdown => ({
        gameId: breakdown.game_id,
        gameName: breakdown.game_name,
        dustScore: breakdown.current_dust_score,
        ageScore: breakdown.age_score,
        ownershipScore: breakdown.ownership_score,
        qualityScore: breakdown.quality_score,
        priceScore: breakdown.price_score,
        genreScore: breakdown.genre_score,
        playtimeFactor: breakdown.playtime_factor,
        imageUrl: breakdown.image_url || breakdown.header_image,
        headerImage: breakdown.header_image,
        releaseDate: breakdown.release_date,
        playtimeMinutes: breakdown.playtime_minutes || 0
      }));
    },
    enabled: !!user,
    staleTime: 30 * 60 * 1000, // 30 minutes (extended for edge function optimization)
  });
};
