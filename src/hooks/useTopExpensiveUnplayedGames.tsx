
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/hooks/use-query-keys';

export interface TopExpensiveGame {
  id: number;
  name: string;
  price: number;
  currency: string;
  headerImage: string | null;
}

export const useTopExpensiveUnplayedGames = () => {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.topExpensiveUnplayedGames(user?.id),
    queryFn: async (): Promise<TopExpensiveGame[]> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('Fetching top expensive unplayed games...');

      // Get unplayed games with prices, sorted by price descending
      const { data: gamesData, error: gamesError } = await supabase
        .from('user_games')
        .select(`
          game_id,
          games!inner(
            id,
            name,
            header_image
          )
        `)
        .eq('user_id', user.id)
        .eq('playtime_minutes', 0)
        .limit(50); // Get more than we need to filter properly

      if (gamesError) {
        console.error('Error fetching unplayed games:', gamesError);
        throw gamesError;
      }

      if (!gamesData || gamesData.length === 0) {
        return [];
      }

      // Get game IDs for price lookup
      const gameIds = gamesData.map(item => item.game_id);

      // Get prices for these games from game_prices table
      const { data: pricesData, error: pricesError } = await supabase
        .from('game_prices')
        .select('app_id, final_price_cents, currency')
        .in('app_id', gameIds)
        .not('final_price_cents', 'is', null)
        .gt('final_price_cents', 0) // Only paid games
        .order('final_price_cents', { ascending: false })
        .limit(3);

      if (pricesError) {
        console.error('Error fetching game prices:', pricesError);
        throw pricesError;
      }

      if (!pricesData || pricesData.length === 0) {
        return [];
      }

      // Match games with prices and format result
      const result: TopExpensiveGame[] = pricesData
        .map(priceItem => {
          const gameData = gamesData.find(g => g.game_id === priceItem.app_id);
          if (!gameData) return null;

          return {
            id: priceItem.app_id,
            name: gameData.games.name,
            price: priceItem.final_price_cents / 100,
            currency: priceItem.currency || 'USD',
            headerImage: gameData.games.header_image,
          };
        })
        .filter((item): item is TopExpensiveGame => item !== null);

      console.log('Top expensive unplayed games loaded:', result);

      return result;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  return {
    data: data || [],
    isLoading,
    error,
  };
};

export default useTopExpensiveUnplayedGames;
