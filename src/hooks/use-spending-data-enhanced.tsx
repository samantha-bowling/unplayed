
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';
import { useSpendingMetrics } from '@/hooks/useSpendingMetrics';
import { useToast } from '@/hooks/use-toast';
import { 
  generateTopSpendingGames, 
  formatSpendingDisplay,
  type SpendingBreakdown,
  type TopSpendingGame
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
 * Now uses the new spending metrics backend
 */
export const useEnhancedSpendingData = () => {
  const { user } = useAuth();
  const { isDemo, demoData } = useDemoMode();
  const { data: spendingMetrics, isLoading, error, refreshMetrics } = useSpendingMetrics();
  const { toast } = useToast();
  const [refreshInProgress, setRefreshInProgress] = useState<boolean>(false);

  // Create a proper SpendingBreakdown object that matches the expected structure
  const createSpendingBreakdown = (): SpendingBreakdown => {
    if (!spendingMetrics) {
      return {
        totalSpent: 0,
        totalSaved: null,
        freeGamesCount: 0,
        unknownPriceGamesCount: 0,
        paidGamesCount: 0,
        currency: 'USD',
        confidence: 'low',
        dataQuality: {
          gamesWithPriceData: 0,
          gamesWithMissingData: 0,
          gamesActuallyFree: 0
        }
      };
    }

    return {
      totalSpent: spendingMetrics.unplayedSpentDollars,
      totalSaved: spendingMetrics.unplayedSavedCents ? spendingMetrics.unplayedSavedCents / 100 : null,
      freeGamesCount: spendingMetrics.freeGames,
      unknownPriceGamesCount: spendingMetrics.gamesMissingPriceData,
      paidGamesCount: spendingMetrics.paidGames,
      currency: spendingMetrics.currency,
      confidence: spendingMetrics.confidence,
      dataQuality: {
        gamesWithPriceData: spendingMetrics.gamesWithPriceData,
        gamesWithMissingData: spendingMetrics.gamesMissingPriceData,
        gamesActuallyFree: spendingMetrics.freeGames
      }
    };
  };

  const spendingBreakdown = createSpendingBreakdown();
  const displayInfo = formatSpendingDisplay(spendingBreakdown);

  // Transform spending metrics to enhanced spending data format
  const spendingData: EnhancedSpendingData = {
    ...spendingBreakdown,
    topSpendingGames: [], // We'll need to implement this separately if needed
    displayInfo: {
      displayText: displayInfo.displayText,
      warningText: displayInfo.warningText,
      confidenceText: displayInfo.confidenceText
    },
    refreshedAt: spendingMetrics?.lastCalculated || null,
  };
  
  // Enhanced refresh function
  const refreshPrices = async () => {
    if (!user || isDemo) return;
    
    try {
      setRefreshInProgress(true);
      await refreshMetrics();
    } catch (error) {
      console.error("Error refreshing spending data:", error);
      toast({
        title: "Error refreshing spending data",
        description: "There was a problem updating your spending metrics. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setRefreshInProgress(false);
    }
  };
  
  return {
    data: spendingData,
    isLoading,
    error,
    refreshPrices,
    isRefreshing: refreshInProgress,
  };
};

export default useEnhancedSpendingData;
