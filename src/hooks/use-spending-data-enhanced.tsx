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
import { callSupabaseFunction } from '@/utils/supabase-functions';
import { toast } from 'sonner';
import { useState } from 'react';
import { queryKeys } from './use-query-keys';
import { usePriceRefreshRateLimit } from './use-price-refresh-rate-limit';

export interface EnhancedSpendingData {
  totalSpent: number;
  totalSaved: number | null;
  freeGamesCount: number;
  paidGamesCount: number;
  currency: string;
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

/**
 * Enhanced spending data hook - ONLY handles price calculations
 * Gets game list from useUnifiedLibraryData, focuses on price data only
 */
export const useEnhancedSpendingData = (onlyUnplayed: boolean = true) => {
  const { user } = useAuth();
  const { isDemo, demoData } = useDemoMode();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const {
    canRefresh,
    isOnCooldown,
    countdown,
    createRefreshLog,
    updateRefreshLog,
    trackPriceRequest,
    showRateLimitNotification,
    formatCountdown
  } = usePriceRefreshRateLimit();

  const queryResult = useQuery({
    queryKey: queryKeys.enhancedSpendingData(user?.id, onlyUnplayed),
    queryFn: async (): Promise<EnhancedSpendingData> => {
      console.log('🔍 [EnhancedSpendingData] Starting price calculation fetch');
      
      if (isDemo) {
        console.log('🎭 [EnhancedSpendingData] Using demo data');
        return {
          totalSpent: demoData.unplayedSpent || 0,
          totalSaved: null,
          freeGamesCount: 20,
          paidGamesCount: 80,
          currency: 'USD',
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

      console.log('📊 [EnhancedSpendingData] Fetching user games for price calculations');

      // Fetch user games with basic game details - simplified query
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
        console.error('❌ [EnhancedSpendingData] Error fetching user games:', userGamesError);
        throw userGamesError;
      }

      console.log(`✅ [EnhancedSpendingData] Found ${userGames?.length || 0} user games`);

      // Fetch enhanced price data from game_prices table
      const gameIds = userGames?.map(ug => ug.game_id) || [];
      let priceDataMap = new Map<number, GamePriceInfo>();

      if (gameIds.length > 0) {
        console.log(`💰 [EnhancedSpendingData] Fetching enhanced price data for ${gameIds.length} games`);
        
        const { data: priceData, error: priceError } = await supabase
          .from('game_prices')
          .select('*')
          .in('app_id', gameIds);

        if (priceError) {
          console.warn('⚠️ [EnhancedSpendingData] Could not fetch enhanced price data:', priceError);
        } else {
          priceDataMap = new Map(
            priceData?.map(price => [price.app_id, price]) || []
          );
          console.log(`💰 [EnhancedSpendingData] Found enhanced prices for ${priceDataMap.size} games`);
        }
      }

      // Transform to spending calculation format
      const gamesWithPrices: GameWithPrice[] = userGames
        ?.filter(ug => ug.games)
        .map(ug => ({
          id: ug.games.id,
          name: ug.games.name,
          price_cents: ug.games.price_cents,
          playtime_minutes: ug.playtime_minutes,
          image_url: ug.games.image_url,
          header_image: ug.games.header_image,
        })) || [];

      console.log(`🎯 [EnhancedSpendingData] Processing spending for ${gamesWithPrices.length} games, ${onlyUnplayed ? 'unplayed only' : 'all games'}`);

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

      // Calculate spending using the centralized utility
      const breakdown = calculateSpending(gamesWithPrices, priceDataMap, onlyUnplayed);
      const topSpendingGames = generateTopSpendingGames(gamesWithPrices, priceDataMap, onlyUnplayed, 50);
      const displayInfo = formatSpendingDisplay(breakdown);

      console.log('✅ [EnhancedSpendingData] Enhanced spending calculation complete:', {
        totalSpent: breakdown.totalSpent,
        confidence: breakdown.confidence,
        gamesProcessed: gamesWithPrices.length,
        rejectedValue: breakdown.dataQuality.totalRejectedValueDollars
      });

      return {
        totalSpent: breakdown.totalSpent,
        totalSaved: breakdown.totalSaved,
        freeGamesCount: breakdown.freeGamesCount,
        paidGamesCount: breakdown.paidGamesCount,
        currency: breakdown.currency,
        confidence: breakdown.confidence,
        dataQuality: breakdown.dataQuality,
        topSpendingGames,
        breakdown,
        displayInfo,
        refreshedAt: new Date().toISOString()
      };
    },
    enabled: !!user || isDemo,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });

  const refreshPrices = async () => {
    if (!user || isDemo) return;
    
    // Check rate limiting
    if (!canRefresh) {
      showRateLimitNotification();
      return;
    }
    
    setIsRefreshing(true);
    let refreshLog: any = null;
    
    try {
      console.log('🔄 [EnhancedSpendingData] Starting price refresh...');
      
      // Get user's game IDs
      const { data: userGames } = await supabase
        .from('user_games')
        .select('game_id')
        .eq('user_id', user.id);
      
      const gameIds = userGames?.map(ug => ug.game_id) || [];
      
      if (gameIds.length === 0) {
        toast.info("No games found to refresh prices for.");
        return;
      }

      // Create refresh log
      refreshLog = await createRefreshLog({
        refreshType: 'manual',
        gamesRequested: gameIds.length
      });

      // Track user request for prioritization
      await trackPriceRequest(gameIds);

      toast.info("Refreshing price data from Steam...", {
        description: `Processing ${gameIds.length} games. This may take a moment.`
      });

      // Call the refresh-game-price function
      const response = await callSupabaseFunction('refresh-game-price', {
        app_ids: gameIds,
        force_refresh: false // Respect 24-hour cache
      });

      const updatedCount = response?.updated_count || 0;

      // Update refresh log with success
      if (refreshLog) {
        await updateRefreshLog({
          logId: refreshLog.id,
          gamesUpdated: updatedCount,
          status: 'completed'
        });
      }

      // Refetch the query data
      await queryResult.refetch();
      
      toast.success("Price data refreshed successfully!", {
        description: `Updated ${updatedCount} game prices with the latest information.`
      });

      console.log('✅ [EnhancedSpendingData] Price refresh completed successfully');

    } catch (error) {
      console.error('❌ [EnhancedSpendingData] Error refreshing prices:', error);
      
      // Update refresh log with failure
      if (refreshLog) {
        await updateRefreshLog({
          logId: refreshLog.id,
          gamesUpdated: 0,
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      toast.error("Failed to refresh prices", {
        description: "Please try again later or check your connection."
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return {
    ...queryResult,
    refreshPrices,
    isRefreshing,
    
    // Rate limiting info
    canRefresh,
    isOnCooldown,
    cooldownRemaining: countdown,
    formatCooldown: () => formatCountdown(countdown),
    showRateLimitNotification,
  };
};

// Keep backward compatibility
export const useSpendingData = useEnhancedSpendingData;
