
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';
import { isGameUnplayed } from '@/utils/game-definitions';

export interface DustScoreGame {
  id: number;
  name: string;
  image: string | null;
  dustScore: number;
  playtimeMinutes: number;
  addedDate: string | null;
  lastPlayedDate: string | null;
}

export interface DustScoreData {
  totalDustScore: number;
  unplayedDustScore: number;
  averageDustScore: number;
  topDustContributors: DustScoreGame[];
  dustDistribution: {
    low: number;
    medium: number;
    high: number;
  };
}

export const useDustScoreData = () => {
  const { user } = useAuth();
  const { isDemo, demoData } = useDemoMode();

  const { data, isLoading, error } = useQuery({
    queryKey: ['dustScoreData', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data: userGamesData, error: userGamesError } = await supabase
        .from('user_games')
        .select(`
          id,
          game_id,
          playtime_minutes,
          dust_score,
          acquisition_date,
          last_played_date,
          games:game_id(
            id,
            name,
            image_url
          )
        `)
        .eq('user_id', user.id)
        .not('dust_score', 'is', null)
        .order('dust_score', { ascending: false });

      if (userGamesError) throw userGamesError;

      const games: DustScoreGame[] = userGamesData
        .filter(item => item.games && item.dust_score !== null)
        .map(item => ({
          id: item.game_id,
          name: item.games!.name,
          image: item.games!.image_url,
          dustScore: item.dust_score!,
          playtimeMinutes: item.playtime_minutes || 0,
          addedDate: item.acquisition_date,
          lastPlayedDate: item.last_played_date,
        }));

      const totalDustScore = games.reduce((sum, game) => sum + game.dustScore, 0);
      
      // UPDATED: Use standardized game classification logic
      const unplayedGames = games.filter(game => isGameUnplayed(game.playtimeMinutes));
      const unplayedDustScore = unplayedGames.reduce((sum, game) => sum + game.dustScore, 0);
      
      const averageDustScore = games.length > 0 ? totalDustScore / games.length : 0;

      const dustDistribution = {
        low: games.filter(game => game.dustScore < 33).length,
        medium: games.filter(game => game.dustScore >= 33 && game.dustScore < 67).length,
        high: games.filter(game => game.dustScore >= 67).length,
      };

      return {
        totalDustScore,
        unplayedDustScore,
        averageDustScore,
        topDustContributors: games.slice(0, 10),
        dustDistribution,
      } as DustScoreData;
    },
    enabled: !isDemo && !!user,
  });

  // Return demo data if in demo mode
  if (isDemo) {
    return {
      data: {
        totalDustScore: demoData.dustScore,
        unplayedDustScore: demoData.dustScore * 0.8, // Assume 80% from unplayed
        averageDustScore: 45,
        topDustContributors: [],
        dustDistribution: {
          low: 20,
          medium: 30,
          high: 25,
        },
      } as DustScoreData,
      isLoading: false,
      error: null,
    };
  }

  return {
    data,
    isLoading,
    error,
  };
};
