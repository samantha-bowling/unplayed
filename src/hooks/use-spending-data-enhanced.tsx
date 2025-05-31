
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

  // Transform spending metrics to enhanced spending data format
  const spendingData: EnhancedSpendingData = {
    totalSpent: spendingMetrics?.unplayedSpentDollars || 0,
    totalSaved: spendingMetrics?.unplayedSavedCents ? spendingMetrics.unplayedSavedCents / 100 : null,
    freeGamesCount: spendingMetrics?.freeGames || 0,
    unknownPriceGamesCount: spendingMetrics?.gamesMissingPriceData || 0,
    paidGamesCount: spendingMetrics?.paidGames || 0,
    currency: spendingMetrics?.currency || 'USD',
    confidence: spendingMetrics?.confidence || 'low',
    dataQuality: {
      gamesWithPriceData: spendingMetrics?.gamesWithPriceData || 0,
      gamesWithMissingData: spendingMetrics?.gamesMissingPriceData || 0,
      gamesActuallyFree: spendingMetrics?.freeGames || 0
    },
    topSpendingGames: [], // We'll need to implement this separately if needed
    displayInfo: {
      displayText: formatSpendingDisplay({
        totalSpent: spendingMetrics?.unplayedSpentDollars || 0,
        freeGamesCount: spendingMetrics?.freeGames || 0,
        confidence: spendingMetrics?.confidence || 'low'
      } as SpendingBreakdown).displayText,
      confidenceText: `Data confidence: ${spendingMetrics?.confidence || 'low'} (${Math.round(spendingMetrics?.dataQualityPercentage || 0)}% coverage)`
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
