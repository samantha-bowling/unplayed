
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';
import { useSpendingMetrics } from '@/hooks/useSpendingMetrics';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/hooks/use-query-keys';

export interface UnifiedSpendingData {
  // Aggregate data (from user_spending_metrics)
  totalSpent: number;
  unplayedSpent: number;
  totalSaved: number | null;
  unplayedSaved: number | null;
  confidence: 'low' | 'medium' | 'high';
  currency: string;
  lastCalculated: string | null;
  
  // Game details for charts/lists
  topSpendingGames: Array<{
    id: number;
    title: string;
    price: number;
    originalPrice: number | null;
    discount: number | null;
    imageUrl: string | null;
    currency: string;
  }>;
  
  priceDistribution: Array<{
    range: string;
    count: number;
    totalValue: number;
  }>;
}

export const useUnifiedSpendingData = () => {
  const { user } = useAuth();
  const { isDemo, demoData } = useDemoMode();
  const { data: spendingMetrics, isLoading: metricsLoading, refreshMetrics } = useSpendingMetrics();

  // Fetch top spending games for charts/details
  const { data: gameDetails, isLoading: gamesLoading } = useQuery({
    queryKey: queryKeys.topSpendingGames(user?.id),
    queryFn: async () => {
      if (!user || isDemo) return [];

      const { data, error } = await supabase
        .from('user_games')
        .select(`
          game_id,
          playtime_minutes,
          games!inner(
            id,
            name,
            header_image
          )
        `)
        .eq('user_id', user.id)
        .eq('playtime_minutes', 0)
        .limit(20);

      if (error) throw error;

      // Get prices for these games
      const gameIds = data.map(item => item.game_id);
      const { data: prices } = await supabase
        .from('game_prices')
        .select('app_id, final_price_cents, initial_price_cents, discount_percent')
        .in('app_id', gameIds);

      const priceMap = new Map(prices?.map(p => [p.app_id, p]) || []);

      return data.map(item => {
        const price = priceMap.get(item.game_id);
        const finalPrice = price?.final_price_cents ? price.final_price_cents / 100 : 0;
        const originalPrice = price?.initial_price_cents ? price.initial_price_cents / 100 : null;

        return {
          id: item.game_id,
          title: item.games.name,
          price: finalPrice,
          originalPrice,
          discount: price?.discount_percent || null,
          imageUrl: item.games.header_image,
          currency: 'USD'
        };
      }).sort((a, b) => b.price - a.price);
    },
    enabled: !!user && !isDemo && !!spendingMetrics,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Build price distribution from game details
  const priceDistribution = gameDetails ? buildPriceDistribution(gameDetails) : [];

  const unifiedData: UnifiedSpendingData = {
    // Use spending metrics as primary source
    totalSpent: spendingMetrics?.totalSpentDollars || (isDemo ? demoData.totalSpent : 0),
    unplayedSpent: spendingMetrics?.unplayedSpentDollars || (isDemo ? demoData.totalSpent : 0),
    totalSaved: spendingMetrics?.totalSavedCents ? spendingMetrics.totalSavedCents / 100 : null,
    unplayedSaved: spendingMetrics?.unplayedSavedCents ? spendingMetrics.unplayedSavedCents / 100 : null,
    confidence: spendingMetrics?.confidence || 'low',
    currency: spendingMetrics?.currency || 'USD',
    lastCalculated: spendingMetrics?.lastCalculated || null,
    
    // Use game details for charts
    topSpendingGames: isDemo ? buildDemoTopGames() : (gameDetails || []),
    priceDistribution: isDemo ? [] : priceDistribution,
  };

  return {
    data: unifiedData,
    isLoading: metricsLoading || gamesLoading,
    refreshMetrics,
  };
};

function buildPriceDistribution(games: Array<{ price: number }>) {
  const ranges = {
    'Free': { range: 'Free', count: 0, totalValue: 0 },
    '$0.01-$4.99': { range: '$0.01-$4.99', count: 0, totalValue: 0 },
    '$5-$9.99': { range: '$5-$9.99', count: 0, totalValue: 0 },
    '$10-$19.99': { range: '$10-$19.99', count: 0, totalValue: 0 },
    '$20-$39.99': { range: '$20-$39.99', count: 0, totalValue: 0 },
    '$40-$59.99': { range: '$40-$59.99', count: 0, totalValue: 0 },
    '$60+': { range: '$60+', count: 0, totalValue: 0 },
  };

  games.forEach(game => {
    let rangeKey: string;
    if (game.price === 0) rangeKey = 'Free';
    else if (game.price < 5) rangeKey = '$0.01-$4.99';
    else if (game.price < 10) rangeKey = '$5-$9.99';
    else if (game.price < 20) rangeKey = '$10-$19.99';
    else if (game.price < 40) rangeKey = '$20-$39.99';
    else if (game.price < 60) rangeKey = '$40-$59.99';
    else rangeKey = '$60+';

    ranges[rangeKey].count += 1;
    ranges[rangeKey].totalValue += game.price;
  });

  return Object.values(ranges);
}

function buildDemoTopGames() {
  return [
    { id: 1, title: 'Cyberpunk 2077', price: 59.99, originalPrice: 59.99, discount: null, imageUrl: null, currency: 'USD' },
    { id: 2, title: 'Red Dead Redemption 2', price: 49.99, originalPrice: 59.99, discount: 17, imageUrl: null, currency: 'USD' },
    { id: 3, title: 'The Witcher 3', price: 39.99, originalPrice: 49.99, discount: 20, imageUrl: null, currency: 'USD' },
  ];
}

export default useUnifiedSpendingData;
