
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';
import { useUnplayedData } from '@/hooks/use-unplayed-data';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface GamePriceData {
  app_id: number;
  currency: string;
  initial_price_cents: number | null;
  final_price_cents: number | null;
  discount_percent: number | null;
  last_checked: string;
}

export interface TopSpendingGame {
  id: number;
  title: string;
  price: number;
  originalPrice: number | null;
  discount: number | null;
  imageUrl: string | null;
  currency: string;
}

export interface PriceRange {
  range: string;
  count: number;
  totalValue: number;
}

export interface SpendingData {
  totalSpent: number;
  totalSaved: number | null;
  topSpendingGames: TopSpendingGame[];
  priceDistribution: PriceRange[];
  currency: string;
  refreshedAt: string | null;
}

/**
 * Custom hook to fetch and calculate spending data for the user's unplayed games
 * Now simplified to USD-only for consistency
 */
export const useSpendingData = () => {
  const { user } = useAuth();
  const { isDemo, demoData } = useDemoMode();
  const { data: unplayedData, isLoading: isUnplayedLoading } = useUnplayedData();
  const { toast } = useToast();
  const [refreshInProgress, setRefreshInProgress] = useState<boolean>(false);
  
  // Extract game IDs from unplayed data for querying - we need this regardless of demo mode
  const gameIds = useMemo(() => {
    if (isUnplayedLoading || !unplayedData?.gamesList) return [];
    
    return unplayedData.gamesList
      .filter(game => game.playtimeMinutes === 0)
      .map(game => game.id);
  }, [unplayedData?.gamesList, isUnplayedLoading]);
  
  // Query game price data from our database - only if not in demo mode
  const {
    data: gamePrices,
    isLoading: isGamePricesLoading,
    error: gamePricesError,
    refetch: refetchGamePrices,
  } = useQuery({
    queryKey: ['gamePrices', gameIds, isDemo],
    queryFn: async () => {
      if (!user || gameIds.length === 0) return [];
      
      // Fetch game prices from our database
      const { data, error } = await supabase
        .from('game_prices')
        .select('*')
        .in('app_id', gameIds);
        
      if (error) throw error;
      return data as GamePriceData[];
    },
    enabled: !isDemo && !!user && gameIds.length > 0 && !isUnplayedLoading,
  });
  
  // Calculate spending data based on prices
  const spendingData = useMemo(() => {
    // If in demo mode, return demo data with proper structure
    if (isDemo) {
      const topSpendingGames = unplayedData?.gamesList
        ? unplayedData.gamesList
            .filter(game => game.playtimeMinutes === 0)
            .map(game => ({
              id: game.id,
              title: game.name,
              price: game.price || 0,
              originalPrice: null,
              discount: null,
              imageUrl: game.image,
              currency: 'USD'
            }))
            .sort((a, b) => b.price - a.price)
        : [];
      
      return {
        totalSpent: demoData.totalSpent,
        totalSaved: null,
        topSpendingGames,
        priceDistribution: [],
        currency: 'USD',
        refreshedAt: new Date().toISOString(),
      };
    }
    
    // For real data, calculate from game prices
    if (!unplayedData?.gamesList || !gamePrices) {
      return {
        totalSpent: 0,
        totalSaved: null,
        topSpendingGames: [],
        priceDistribution: [],
        currency: 'USD',
        refreshedAt: null,
      };
    }
    
    // Map of game IDs to price data for quick lookup
    const priceMap = new Map<number, GamePriceData>();
    gamePrices.forEach(price => priceMap.set(price.app_id, price));
    
    // Calculate total spent on unplayed games - FIXED: consistent price handling
    let totalSpent = 0;
    let totalOriginalPrice = 0;
    
    // Track the latest refresh date
    let latestRefresh: Date | null = null;
    
    // Generate top spending games list
    const topSpendingGames: TopSpendingGame[] = unplayedData.gamesList
      .filter(game => game.playtimeMinutes === 0)
      .map(game => {
        const priceData = priceMap.get(game.id);
        
        // Track the latest refresh date
        if (priceData?.last_checked) {
          const refreshDate = new Date(priceData.last_checked);
          if (!latestRefresh || refreshDate > latestRefresh) {
            latestRefresh = refreshDate;
          }
        }
        
        // Calculate price in dollars (from cents) - FIXED: consistent with total library
        const price = priceData?.final_price_cents 
          ? priceData.final_price_cents / 100
          : 0; // Default to 0 for free games or missing price data
          
        const originalPrice = priceData?.initial_price_cents
          ? priceData.initial_price_cents / 100
          : null;
          
        // Add to totals
        totalSpent += price;
        if (originalPrice) totalOriginalPrice += originalPrice;
        
        return {
          id: game.id,
          title: game.name,
          price,
          originalPrice,
          discount: priceData?.discount_percent || null,
          imageUrl: game.image,
          currency: 'USD', // Simplified to USD only
        };
      })
      // Sort by price (highest first)
      .sort((a, b) => b.price - a.price);
    
    // Calculate savings (if we have original price data)
    const totalSaved = totalOriginalPrice > 0 ? totalOriginalPrice - totalSpent : null;
    
    console.log(`Unplayed spending calculation: ${topSpendingGames.length} games, $${totalSpent.toFixed(2)} total spent`);
    
    // Build price distribution chart data
    const priceRanges: { [key: string]: PriceRange } = {
      'Free': { range: 'Free', count: 0, totalValue: 0 },
      '$0.01-$4.99': { range: '$0.01-$4.99', count: 0, totalValue: 0 },
      '$5-$9.99': { range: '$5-$9.99', count: 0, totalValue: 0 },
      '$10-$19.99': { range: '$10-$19.99', count: 0, totalValue: 0 },
      '$20-$39.99': { range: '$20-$39.99', count: 0, totalValue: 0 },
      '$40-$59.99': { range: '$40-$59.99', count: 0, totalValue: 0 },
      '$60+': { range: '$60+', count: 0, totalValue: 0 },
    };
    
    topSpendingGames.forEach(game => {
      let range: string;
      
      if (game.price === 0) {
        range = 'Free';
      } else if (game.price < 5) {
        range = '$0.01-$4.99';
      } else if (game.price < 10) {
        range = '$5-$9.99';
      } else if (game.price < 20) {
        range = '$10-$19.99';
      } else if (game.price < 40) {
        range = '$20-$39.99';
      } else if (game.price < 60) {
        range = '$40-$59.99';
      } else {
        range = '$60+';
      }
      
      priceRanges[range].count += 1;
      priceRanges[range].totalValue += game.price;
    });
    
    const priceDistribution = Object.values(priceRanges);
    
    return {
      totalSpent,
      totalSaved,
      topSpendingGames,
      priceDistribution,
      currency: 'USD', // Simplified to USD only
      refreshedAt: latestRefresh ? latestRefresh.toISOString() : null,
    };
  }, [isDemo, demoData, unplayedData?.gamesList, gamePrices]);
  
  // Refresh price data by calling our edge function - only for authenticated users
  const refreshPrices = async () => {
    if (!user || isDemo || gameIds.length === 0) return;
    
    try {
      setRefreshInProgress(true);
      toast({
        title: "Refreshing price data",
        description: `Updating ${gameIds.length} games. This might take a moment...`
      });
      
      // Call our edge function with batches of game IDs
      // We'll limit to 10 at a time to avoid timeouts
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
        
        // If there are more batches, give a small delay
        if (i + batchSize < gameIds.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      // Refetch prices from the DB
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
  
  // Return a stable structure for all cases
  return {
    data: spendingData,
    isLoading: isGamePricesLoading || isUnplayedLoading,
    error: gamePricesError as Error | null,
    refreshPrices,
    isRefreshing: refreshInProgress,
  };
};

export default useSpendingData;
