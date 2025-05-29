
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';
import { useProfile } from '@/hooks/use-profile';
import { useUnplayedData } from '@/hooks/useUnplayedData';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { queryKeys } from '@/hooks/use-query-keys';
import { 
  calculateSpending, 
  generateTopSpendingGames, 
  formatSpendingDisplay,
  type SpendingBreakdown,
  type TopSpendingGame,
  type GamePriceInfo,
  type GameWithPrice
} from '@/utils/spending-calculations';

export interface EnhancedSpendingData extends SpendingBreakdown {
  topSpendingGames: TopSpendingGame[];
  displayInfo: {
    displayText: string;
    warningText?: string;
    confidenceText: string;
  };
  refreshedAt: string | null;
}

/**
 * Enhanced spending data hook with improved accuracy and data quality reporting
 */
export const useEnhancedSpendingData = () => {
  const { user } = useAuth();
  const { isDemo, demoData } = useDemoMode();
  const { data: unplayedData, isLoading: isUnplayedLoading } = useUnplayedData();
  const { toast } = useToast();
  const [refreshInProgress, setRefreshInProgress] = useState<boolean>(false);
  
  // Extract game IDs from unplayed data for querying
  const gameIds = useMemo(() => {
    if (isUnplayedLoading || !unplayedData?.gamesList) return [];
    
    return unplayedData.gamesList.map(game => game.id);
  }, [unplayedData?.gamesList, isUnplayedLoading]);
  
  // Query user games with price data from both tables
  const {
    data: userGamesData,
    isLoading: isUserGamesLoading,
    error: userGamesError,
  } = useQuery({
    queryKey: ['enhancedUserGames', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_games')
        .select(`
          id,
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
        
      if (error) throw error;
      
      // Transform to our expected format
      return data.map(item => ({
        id: item.game_id,
        name: item.games?.name || 'Unknown Game',
        price_cents: item.games?.price_cents,
        playtime_minutes: item.playtime_minutes || 0,
        image_url: item.games?.image_url,
        header_image: item.games?.header_image,
      })) as GameWithPrice[];
    },
    enabled: !!user && !isDemo,
  });

  // Query game price data from price table
  const {
    data: gamePricesData,
    isLoading: isGamePricesLoading,
    error: gamePricesError,
    refetch: refetchGamePrices,
  } = useQuery({
    queryKey: ['enhancedGamePrices', gameIds],
    queryFn: async () => {
      if (gameIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('game_prices')
        .select('*')
        .in('app_id', gameIds);
        
      if (error) throw error;
      return data as GamePriceInfo[];
    },
    enabled: gameIds.length > 0 && !isDemo,
  });

  // Calculate spending data using enhanced utilities
  const spendingData = useMemo((): EnhancedSpendingData => {
    // Return demo data if in demo mode
    if (isDemo) {
      return {
        totalSpent: demoData.totalSpent,
        totalSaved: null,
        freeGamesCount: 15,
        unknownPriceGamesCount: 0,
        paidGamesCount: 85,
        currency: 'USD',
        confidence: 'high' as const,
        dataQuality: {
          gamesWithPriceData: 100,
          gamesWithMissingData: 0,
          gamesActuallyFree: 15
        },
        topSpendingGames: unplayedData?.gamesList
          ?.filter(game => game.playtimeMinutes === 0 && (game.price || 0) > 0)
          ?.slice(0, 20)
          ?.map(game => ({
            id: game.id,
            title: game.name,
            price: game.price || 0,
            originalPrice: null,
            discount: null,
            imageUrl: game.image,
            currency: 'USD',
            priceDataSource: 'games_table' as const
          })) || [],
        displayInfo: {
          displayText: `$${demoData.totalSpent.toFixed(2)} spent • 15 free games`,
          confidenceText: 'Data confidence: high (demo data)'
        },
        refreshedAt: new Date().toISOString(),
      };
    }
    
    // Return empty data if no user games
    if (!userGamesData || userGamesData.length === 0) {
      return {
        totalSpent: 0,
        totalSaved: null,
        freeGamesCount: 0,
        unknownPriceGamesCount: 0,
        paidGamesCount: 0,
        currency: 'USD',
        confidence: 'high' as const,
        dataQuality: {
          gamesWithPriceData: 0,
          gamesWithMissingData: 0,
          gamesActuallyFree: 0
        },
        topSpendingGames: [],
        displayInfo: {
          displayText: '$0.00 spent',
          confidenceText: 'No games found'
        },
        refreshedAt: null,
      };
    }
    
    // Create price data map for efficient lookups
    const priceDataMap = new Map<number, GamePriceInfo>();
    if (gamePricesData) {
      gamePricesData.forEach(price => {
        priceDataMap.set(price.app_id, price);
      });
    }
    
    // Calculate unplayed spending breakdown
    const unplayedBreakdown = calculateSpending(userGamesData, priceDataMap, true);
    const topSpendingGames = generateTopSpendingGames(userGamesData, priceDataMap, true, 50);
    const displayInfo = formatSpendingDisplay(unplayedBreakdown);
    
    // Find latest refresh date
    let latestRefresh: Date | null = null;
    if (gamePricesData) {
      gamePricesData.forEach(price => {
        if (price.last_checked) {
          const refreshDate = new Date(price.last_checked);
          if (!latestRefresh || refreshDate > latestRefresh) {
            latestRefresh = refreshDate;
          }
        }
      });
    }
    
    console.log('Enhanced spending calculation:', {
      totalGames: userGamesData.length,
      unplayedSpent: unplayedBreakdown.totalSpent,
      confidence: unplayedBreakdown.confidence,
      dataQuality: unplayedBreakdown.dataQuality
    });
    
    return {
      ...unplayedBreakdown,
      topSpendingGames,
      displayInfo,
      refreshedAt: latestRefresh ? latestRefresh.toISOString() : null,
    };
  }, [isDemo, demoData, userGamesData, gamePricesData, unplayedData?.gamesList]);
  
  // Refresh price data functionality
  const refreshPrices = async () => {
    if (!user || isDemo || gameIds.length === 0) return;
    
    try {
      setRefreshInProgress(true);
      toast({
        title: "Refreshing price data",
        description: `Updating prices for ${gameIds.length} games. This might take a moment...`
      });
      
      // Call refresh function in batches
      const batchSize = 10;
      let updatedCount = 0;
      
      for (let i = 0; i < gameIds.length; i += batchSize) {
        const batchIds = gameIds.slice(i, i + batchSize);
        
        const response = await supabase.functions.invoke('refresh-game-price', {
          body: {
            app_ids: batchIds,
            force_refresh: false
          }
        });
        
        if (response.data?.updated_count) {
          updatedCount += response.data.updated_count;
        }
        
        if (i + batchSize < gameIds.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      await refetchGamePrices();
      
      toast({
        title: "Price refresh complete",
        description: `Updated ${updatedCount} game prices successfully.`
      });
      
    } catch (error) {
      console.error("Error refreshing prices:", error);
      toast({
        title: "Error refreshing prices",
        description: "There was a problem updating game prices. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setRefreshInProgress(false);
    }
  };
  
  return {
    data: spendingData,
    isLoading: isUserGamesLoading || isGamePricesLoading || isUnplayedLoading,
    error: userGamesError || gamePricesError,
    refreshPrices,
    isRefreshing: refreshInProgress,
  };
};

export default useEnhancedSpendingData;
