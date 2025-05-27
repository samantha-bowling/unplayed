import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';
import { useProfile } from '@/hooks/use-profile';
import { useUnplayedData } from '@/hooks/useUnplayedData';
import { GameListItem } from '@/types/unplayed-data.types';
import { queryKeys } from '@/hooks/use-query-keys';

interface SpendingData {
  totalSpent: number;
  unplayedSpent: number;
  playedSpent: number;
}

const useTotalLibrarySpending = () => {
  const { user } = useAuth();
  const { isDemo, demoData } = useDemoMode();
  const { profile } = useProfile();
  const { data: unplayedData } = useUnplayedData();

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.spendingData(user?.id),
    queryFn: async (): Promise<SpendingData> => {
      if (!user || isDemo) {
        // In demo mode, return demo data
        return {
          totalSpent: 799,
          unplayedSpent: 549,
          playedSpent: 250,
        };
      }

      const { data: userGames, error } = await supabase
        .from('user_games')
        .select(`
          id,
          game_id,
          playtime_minutes,
          games:game_id(
            price_cents
          )
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error("Error fetching user games:", error);
        throw error;
      }

      let totalSpent = 0;
      let unplayedSpent = 0;
      let playedSpent = 0;

      userGames.forEach(game => {
        const priceCents = game.games?.price_cents || 0;
        const priceDollars = priceCents / 100;
        totalSpent += priceDollars;

        if (game.playtime_minutes === 0) {
          unplayedSpent += priceDollars;
        } else {
          playedSpent += priceDollars;
        }
      });

      return {
        totalSpent: parseFloat(totalSpent.toFixed(2)),
        unplayedSpent: parseFloat(unplayedSpent.toFixed(2)),
        playedSpent: parseFloat(playedSpent.toFixed(2)),
      };
    },
    enabled: !!user && !!profile?.steam_id && !isDemo,
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  // In demo mode, return demo data
  if (isDemo) {
    return {
      data: {
        totalSpent: 799,
        unplayedSpent: 549,
        playedSpent: 250,
      },
      isLoading: false,
      error: null,
    };
  }

  return { data, isLoading, error };
};

export default useTotalLibrarySpending;
