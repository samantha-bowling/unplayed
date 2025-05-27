
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';
import { useProfile } from '@/hooks/use-profile';
import { useUnplayedData } from '@/hooks/useUnplayedData';
import { GameListItem } from '@/types/unplayed-data.types';
import { queryKeys } from '@/hooks/use-query-keys';

interface TotalLibrarySpendingData {
  totalLibraryValue: number;
  totalSaved: number | null;
  totalGames: number;
  currency: string;
  refreshedAt: string | null;
}

const useTotalLibrarySpending = () => {
  const { user } = useAuth();
  const { isDemo, demoData } = useDemoMode();
  const { profile } = useProfile();
  const { data: unplayedData } = useUnplayedData();

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.spendingData(user?.id),
    queryFn: async (): Promise<TotalLibrarySpendingData> => {
      if (!user || isDemo) {
        // In demo mode, return demo data
        return {
          totalLibraryValue: 799,
          totalSaved: null,
          totalGames: 150,
          currency: 'USD',
          refreshedAt: new Date().toISOString(),
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

      let totalLibraryValue = 0;
      const totalGames = userGames.length;

      userGames.forEach(game => {
        const priceCents = game.games?.price_cents || 0;
        const priceDollars = priceCents / 100;
        totalLibraryValue += priceDollars;
      });

      return {
        totalLibraryValue: parseFloat(totalLibraryValue.toFixed(2)),
        totalSaved: null, // We don't have saved data in this context
        totalGames,
        currency: 'USD',
        refreshedAt: new Date().toISOString(),
      };
    },
    enabled: !!user && !!profile?.steam_id && !isDemo,
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  // In demo mode, return demo data
  if (isDemo) {
    return {
      data: {
        totalLibraryValue: 799,
        totalSaved: null,
        totalGames: 150,
        currency: 'USD',
        refreshedAt: new Date().toISOString(),
      },
      isLoading: false,
      error: null,
    };
  }

  return { data, isLoading, error };
};

export default useTotalLibrarySpending;
