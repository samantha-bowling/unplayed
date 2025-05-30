import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';
import { 
  calculateSpending, 
  generateTopSpendingGames, 
  formatSpendingDisplay,
  type GameWithPrice,
  type GamePriceInfo,
  type SpendingBreakdown
} from '@/utils/spending-calculations';
import { validateGamePrice } from '@/utils/price-validation';

export interface EnhancedSpendingData {
  totalSpent: number;
  confidence: 'high' | 'medium' | 'low';
  dataQuality: {
    gamesWithPriceData: number;
    gamesWithMissingData: number;
    gamesActuallyFree: number;
    invalidPricesRejected: number;
    totalRejectedValueDollars: number;
  };
  topSpendingGames: TopSpendingGame[];
  breakdown: SpendingBreakdown;
  displayInfo: {
    displayText: string;
    warningText?: string;
    confidenceText: string;
    rejectedValueText?: string;
  };
  refreshedAt: string;
}

export interface TopSpendingGame {
  id: number;
  title: string;
  price: number;
  originalPrice: number | null;
  discount: number | null;
  imageUrl: string | null;
  currency: string;
  priceDataSource: 'games_table' | 'price_table' | 'estimated';
}

export const useEnhancedSpendingData = (onlyUnplayed: boolean = true) => {
  const { user } = useAuth();
  const { isDemo, demoData } = useDemoMode();

  return useQuery({
    queryKey: ['enhancedSpendingData', user?.id, onlyUnplayed],
    queryFn: async (): Promise<EnhancedSpendingData> => {
      if (isDemo) {
        // Return demo data structure
        return {
          totalSpent: demoData.unplayedSpent || 0,
          confidence: 'high' as const,
          dataQuality: {
            gamesWithPriceData: 100,
            gamesWithMissingData: 0,
            gamesActuallyFree: 20,
            invalidPricesRejected: 0,
            totalRejectedValueDollars: 0
          },
          topSpendingGames: [],
          breakdown: {
            totalSpent: demoData.unplayedSpent || 0,
            totalSaved: null,
            freeGamesCount: 20,
            unknownPriceGamesCount: 0,
            paidGamesCount: 80,
            currency: 'USD',
            confidence: 'high' as const,
            dataQuality: {
              gamesWithPriceData: 100,
              gamesWithMissingData: 0,
              gamesActuallyFree: 20,
              invalidPricesRejected: 0,
              totalRejectedValueDollars: 0
            }
          },
          displayInfo: {
            displayText: `$${(demoData.unplayedSpent || 0).toFixed(2)} spent`,
            confidenceText: 'Data confidence: high (100/100 games have valid price data)'
          },
          refreshedAt: new Date().toISOString()
        };
      }

      if (!user) {
        throw new Error('User not authenticated');
      }

      // Fetch user games with game details and price information
      const { data: userGames, error: userGamesError } = await supabase
        .from('user_games')
        .select(`
          game_id,
          playtime_minutes,
          games:game_id(
            id,
            name,
            price_cents,
            image_url,
            header_image
          )
        `)
        .eq('user_id', user.id);

      if (userGamesError) {
        console.error('Error fetching user games for spending:', userGamesError);
        throw userGamesError;
      }

      // Fetch enhanced price data
      const gameIds = userGames?.map(ug => ug.game_id) || [];
      let priceDataMap = new Map<number, GamePriceInfo>();

      if (gameIds.length > 0) {
        const { data: priceData, error: priceError } = await supabase
          .from('game_prices')
          .select('*')
          .in('app_id', gameIds);

        if (priceError) {
          console.warn('Could not fetch enhanced price data:', priceError);
        } else {
          priceDataMap = new Map(
            priceData?.map(price => [price.app_id, price]) || []
          );
        }
      }

      // Transform data to the expected format
      const gamesWithPrices: GameWithPrice[] = userGames
        ?.filter(ug => ug.games) // Only include games with valid game data
        .map(ug => ({
          id: ug.games.id,
          name: ug.games.name,
          price_cents: ug.games.price_cents,
          playtime_minutes: ug.playtime_minutes,
          image_url: ug.games.image_url,
          header_image: ug.games.header_image,
        })) || [];

      console.log(`Processing spending for ${gamesWithPrices.length} games, ${onlyUnplayed ? 'unplayed only' : 'all games'}`);

      // Log validation statistics
      let validatedGames = 0;
      let rejectedGames = 0;
      let totalRejectedValue = 0;

      gamesWithPrices.forEach(game => {
        const validation = validateGamePrice(game.price_cents, game.name);
        if (validation.isValid) {
          validatedGames++;
        } else {
          rejectedGames++;
          if (game.price_cents) {
            totalRejectedValue += game.price_cents;
          }
        }
      });

      console.log(`Price validation: ${validatedGames} valid, ${rejectedGames} rejected games (${(totalRejectedValue / 100).toFixed(2)} value rejected)`);

      // Calculate spending breakdown with price validation
      const breakdown = calculateSpending(gamesWithPrices, priceDataMap, onlyUnplayed);
      
      // Generate top spending games
      const topSpendingGames = generateTopSpendingGames(gamesWithPrices, priceDataMap, onlyUnplayed, 50);
      
      // Format display information
      const displayInfo = formatSpendingDisplay(breakdown);

      console.log('Enhanced spending calculation complete:', {
        totalSpent: breakdown.totalSpent,
        confidence: breakdown.confidence,
        rejectedValue: breakdown.dataQuality.totalRejectedValueDollars,
        topGamePrice: topSpendingGames[0]?.price || 0
      });

      return {
        totalSpent: breakdown.totalSpent,
        confidence: breakdown.confidence,
        dataQuality: breakdown.dataQuality,
        topSpendingGames,
        breakdown,
        displayInfo,
        refreshedAt: new Date().toISOString()
      };
    },
    enabled: !!user || isDemo,
    staleTime: 10 * 60 * 1000, // 10 minutes - spending data changes less frequently
    refetchOnWindowFocus: false,
  });
};

export const useSpendingData = useEnhancedSpendingData;
