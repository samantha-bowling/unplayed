
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';
import { useUnplayedData } from '@/hooks/use-unplayed-data';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TotalLibrarySpendingData {
  totalLibraryValue: number;
  totalSaved: number | null;
  currency: string;
  refreshedAt: string | null;
  totalGames: number;
}

/**
 * Custom hook to fetch and calculate total library spending for ALL games (played + unplayed)
 */
export const useTotalLibrarySpending = () => {
  const { user } = useAuth();
  const { isDemo, demoData } = useDemoMode();
  const { data: unplayedData, isLoading: isUnplayedLoading } = useUnplayedData();
  const { toast } = useToast();
  const [refreshInProgress, setRefreshInProgress] = useState<boolean>(false);
  
  // Extract ALL game IDs from library data for querying
  const gameIds = useMemo(() => {
    if (isUnplayedLoading || !unplayedData?.gamesList) return [];
    
    // Get ALL games, not just unplayed ones
    return unplayedData.gamesList.map(game => game.id);
  }, [unplayedData?.gamesList, isUnplayedLoading]);
  
  // Query game price data from our database for ALL games
  const {
    data: gamePrices,
    isLoading: isGamePricesLoading,
    error: gamePricesError,
    refetch: refetchGamePrices,
  } = useQuery({
    queryKey: ['allGamePrices', gameIds, isDemo],
    queryFn: async () => {
      if (!user || gameIds.length === 0) return [];
      
      // Fetch game prices from our database for ALL games
      const { data, error } = await supabase
        .from('game_prices')
        .select('*')
        .in('app_id', gameIds);
        
      if (error) throw error;
      return data;
    },
    enabled: !isDemo && !!user && gameIds.length > 0 && !isUnplayedLoading,
  });
  
  // Calculate total library spending data
  const totalLibraryData = useMemo(() => {
    // If in demo mode, calculate from demo data
    if (isDemo) {
      const totalValue = unplayedData?.gamesList
        ? unplayedData.gamesList.reduce((sum, game) => sum + (game.price || 0), 0)
        : demoData.totalSpent;
      
      return {
        totalLibraryValue: totalValue,
        totalSaved: null,
        currency: 'USD',
        refreshedAt: new Date().toISOString(),
        totalGames: unplayedData?.gamesList?.length || 0,
      };
    }
    
    // For real data, calculate from game prices
    if (!unplayedData?.gamesList || !gamePrices) {
      return {
        totalLibraryValue: 0,
        totalSaved: null,
        currency: 'USD',
        refreshedAt: null,
        totalGames: 0,
      };
    }
    
    // Map of game IDs to price data for quick lookup
    const priceMap = new Map();
    gamePrices.forEach(price => priceMap.set(price.app_id, price));
    
    // Calculate total spent on ALL games
    let totalLibraryValue = 0;
    let totalOriginalPrice = 0;
    const currency = gamePrices.length > 0 ? gamePrices[0].currency : 'USD';
    
    // Track the latest refresh date
    let latestRefresh = null;
    
    // Process ALL games in the library
    unplayedData.gamesList.forEach(game => {
      const priceData = priceMap.get(game.id);
      
      // Track the latest refresh date
      if (priceData?.last_checked) {
        const refreshDate = new Date(priceData.last_checked);
        if (!latestRefresh || refreshDate > latestRefresh) {
          latestRefresh = refreshDate;
        }
      }
      
      // Calculate price in dollars (not cents)
      const price = priceData?.final_price_cents 
        ? priceData.final_price_cents / 100
        : (game.price ? game.price / 100 : 0);
        
      const originalPrice = priceData?.initial_price_cents
        ? priceData.initial_price_cents / 100
        : null;
        
      // Add to totals
      totalLibraryValue += price;
      if (originalPrice) totalOriginalPrice += originalPrice;
    });
    
    // Calculate savings (if we have original price data)
    const totalSaved = totalOriginalPrice > 0 ? totalOriginalPrice - totalLibraryValue : null;
    
    return {
      totalLibraryValue,
      totalSaved,
      currency,
      refreshedAt: latestRefresh ? latestRefresh.toISOString() : null,
      totalGames: unplayedData.gamesList.length,
    };
  }, [isDemo, demoData, unplayedData?.gamesList, gamePrices]);
  
  // Refresh price data - same implementation as useSpendingData
  const refreshPrices = async () => {
    if (!user || isDemo || gameIds.length === 0) return;
    
    try {
      setRefreshInProgress(true);
      toast({
        title: "Refreshing price data",
        description: `Updating ${gameIds.length} games. This might take a moment...`
      });
      
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
    data: totalLibraryData,
    isLoading: isGamePricesLoading || isUnplayedLoading,
    error: gamePricesError,
    refreshPrices,
    isRefreshing: refreshInProgress,
  };
};

export default useTotalLibrarySpending;
