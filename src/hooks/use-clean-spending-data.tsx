
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';
import { 
  getCleanLibraryStats, 
  transformToSpendingBreakdown, 
  formatCleanSpendingDisplay,
  type LibraryStats,
  type EnhancedSpendingBreakdown
} from '@/utils/clean-price-calculations';
import { usePriceRefreshRateLimit } from './use-price-refresh-rate-limit';
import { callSupabaseFunction } from '@/utils/supabase-functions';
import { toast } from 'sonner';
import { useState } from 'react';
import { queryKeys } from './use-query-keys';

export interface CleanSpendingData {
  totalSpent: number;
  totalSaved: number | null;
  freeGamesCount: number;
  paidGamesCount: number;
  unknownPriceGamesCount: number;
  currency: string;
  confidence: 'high' | 'medium' | 'low';
  dataQuality: {
    gamesWithPriceData: number;
    gamesWithMissingData: number;
    dataQualityPercentage: number;
  };
  breakdown: EnhancedSpendingBreakdown;
  displayInfo: {
    displayText: string;
    warningText?: string;
    confidenceText: string;
  };
  rawStats: LibraryStats;
  refreshedAt: string;
}

/**
 * Hook for clean, validated spending data using new database functions
 * This replaces the old useEnhancedSpendingData with more accurate pricing
 */
export const useCleanSpendingData = (onlyUnplayed: boolean = true) => {
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
    queryKey: queryKeys.cleanSpendingData(user?.id, onlyUnplayed),
    queryFn: async (): Promise<CleanSpendingData> => {
      if (isDemo) {
        // Return demo data structure
        const totalSpent = onlyUnplayed ? (demoData.unplayedSpent || 0) : (demoData.totalSpent || 0);
        
        return {
          totalSpent,
          totalSaved: null,
          freeGamesCount: 20,
          paidGamesCount: 80,
          unknownPriceGamesCount: 0,
          currency: 'USD',
          confidence: 'high' as const,
          dataQuality: {
            gamesWithPriceData: 100,
            gamesWithMissingData: 0,
            dataQualityPercentage: 100
          },
          breakdown: {
            totalSpent,
            totalSaved: null,
            freeGamesCount: 20,
            paidGamesCount: 80,
            unknownPriceGamesCount: 0,
            currency: 'USD',
            confidence: 'high' as const,
            dataQuality: {
              gamesWithPriceData: 100,
              gamesWithMissingData: 0,
              dataQualityPercentage: 100
            }
          },
          displayInfo: {
            displayText: `$${totalSpent.toFixed(2)} spent • 20 free games`,
            confidenceText: 'Data confidence: high (100.0% of games have valid price data)'
          },
          rawStats: {
            total_games: 100,
            unplayed_games: 80,
            free_games: 20,
            games_with_prices: 100,
            games_without_prices: 0,
            total_library_value_cents: Math.round((demoData.totalSpent || 0) * 100),
            unplayed_value_cents: Math.round((demoData.unplayedSpent || 0) * 100),
            total_library_value_dollars: demoData.totalSpent || 0,
            unplayed_value_dollars: demoData.unplayedSpent || 0,
            data_quality_percentage: 100
          },
          refreshedAt: new Date().toISOString()
        };
      }

      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('Fetching clean library stats for user:', user.id);
      
      const stats = await getCleanLibraryStats(user.id);
      if (!stats) {
        throw new Error('Failed to fetch library statistics');
      }

      console.log('Clean library stats received:', stats);

      const breakdown = transformToSpendingBreakdown(stats, onlyUnplayed);
      const displayInfo = formatCleanSpendingDisplay(breakdown);

      return {
        totalSpent: breakdown.totalSpent,
        totalSaved: breakdown.totalSaved,
        freeGamesCount: breakdown.freeGamesCount,
        paidGamesCount: breakdown.paidGamesCount,
        unknownPriceGamesCount: breakdown.unknownPriceGamesCount,
        currency: breakdown.currency,
        confidence: breakdown.confidence,
        dataQuality: breakdown.dataQuality,
        breakdown,
        displayInfo,
        rawStats: stats,
        refreshedAt: new Date().toISOString()
      };
    },
    enabled: !!user || isDemo,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });

  const refreshPrices = async () => {
    if (!user || isDemo) return;
    
    if (!canRefresh) {
      showRateLimitNotification();
      return;
    }
    
    setIsRefreshing(true);
    let refreshLog: any = null;
    
    try {
      // Get user's game IDs that need price updates
      const { data: userGames } = await supabase
        .from('user_games')
        .select('game_id')
        .eq('user_id', user.id);
      
      const gameIds = userGames?.map(ug => ug.game_id) || [];
      
      if (gameIds.length === 0) {
        toast.info("No games found to refresh prices for.");
        return;
      }

      refreshLog = await createRefreshLog({
        refreshType: 'manual',
        gamesRequested: gameIds.length
      });

      await trackPriceRequest(gameIds);

      toast.info("Refreshing price data with enhanced validation...", {
        description: `Processing ${gameIds.length} games with new price validation system.`
      });

      const response = await callSupabaseFunction('refresh-game-price', {
        app_ids: gameIds,
        force_refresh: false,
        validate_prices: true // New flag to enable validation
      });

      const updatedCount = response?.updated_count || 0;

      if (refreshLog) {
        await updateRefreshLog({
          logId: refreshLog.id,
          gamesUpdated: updatedCount,
          status: 'completed'
        });
      }

      await queryResult.refetch();
      
      toast.success("Price data refreshed with validation!", {
        description: `Updated ${updatedCount} game prices with enhanced validation and bad data filtering.`
      });

    } catch (error) {
      console.error('Error refreshing prices:', error);
      
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
    canRefresh,
    isOnCooldown,
    cooldownRemaining: countdown,
    formatCooldown: () => formatCountdown(countdown),
    showRateLimitNotification,
  };
};

export default useCleanSpendingData;
