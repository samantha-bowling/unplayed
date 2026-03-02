
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/hooks/use-query-keys';

export interface PriceDistributionData {
  priceRange: string;
  count: number;
  totalValue: number;
}

export const usePriceDistribution = () => {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.priceDistribution(user?.id),
    queryFn: async (): Promise<PriceDistributionData[]> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get user games with prices
      const { data: gamesData, error: gamesError } = await supabase
        .from('user_games')
        .select(`
          games!inner(
            id,
            name,
            price_cents
          ),
          game_prices(
            final_price_cents
          )
        `)
        .eq('user_id', user.id);

      if (gamesError) {
        console.error('Error fetching games for price distribution:', gamesError);
        throw gamesError;
      }

      if (!gamesData || gamesData.length === 0) {
        return [];
      }

      // Process the data to create price ranges
      const priceRanges = [
        { range: 'Free', min: 0, max: 0 },
        { range: '$0.01-$5', min: 1, max: 500 },
        { range: '$5-$15', min: 501, max: 1500 },
        { range: '$15-$30', min: 1501, max: 3000 },
        { range: '$30-$60', min: 3001, max: 6000 },
        { range: '$60+', min: 6001, max: Infinity }
      ];

      const distribution = priceRanges.map(({ range, min, max }) => {
        const gamesInRange = gamesData.filter(game => {
          // Use game_prices data if available, otherwise fall back to games.price_cents
          const gamePrice = Array.isArray(game.game_prices) && game.game_prices.length > 0 
            ? game.game_prices[0]?.final_price_cents 
            : game.games.price_cents;
          
          if (gamePrice === null || gamePrice === undefined) return false;
          
          if (max === Infinity) {
            return gamePrice >= min;
          }
          return gamePrice >= min && gamePrice <= max;
        });

        const totalValue = gamesInRange.reduce((sum, game) => {
          const gamePrice = Array.isArray(game.game_prices) && game.game_prices.length > 0 
            ? game.game_prices[0]?.final_price_cents 
            : game.games.price_cents;
          return sum + (gamePrice || 0);
        }, 0);

        return {
          priceRange: range,
          count: gamesInRange.length,
          totalValue: totalValue / 100 // Convert to dollars
        };
      });

      return distribution;
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

export default usePriceDistribution;
