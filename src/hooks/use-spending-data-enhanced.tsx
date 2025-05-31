
import { useUnifiedSpendingData } from './useUnifiedSpendingData';
import { formatSpendingDisplay } from '@/utils/spending-calculations';

// Enhanced adapter with display formatting
export const useEnhancedSpendingData = () => {
  const { data, isLoading, refreshMetrics } = useUnifiedSpendingData();
  
  const spendingBreakdown = {
    totalSpent: data.unplayedSpent,
    totalSaved: data.unplayedSaved,
    freeGamesCount: 0, // Would need separate query if needed
    unknownPriceGamesCount: 0, // Would need separate query if needed
    paidGamesCount: 0, // Would need separate query if needed
    currency: data.currency,
    confidence: data.confidence,
    dataQuality: {
      gamesWithPriceData: 0, // Would need separate query if needed
      gamesWithMissingData: 0, // Would need separate query if needed
      gamesActuallyFree: 0, // Would need separate query if needed
    }
  };

  const displayInfo = formatSpendingDisplay(spendingBreakdown);

  return {
    data: {
      ...spendingBreakdown,
      topSpendingGames: data.topSpendingGames,
      displayInfo: {
        displayText: displayInfo.displayText,
        warningText: displayInfo.warningText,
        confidenceText: displayInfo.confidenceText
      },
      refreshedAt: data.lastCalculated,
    },
    isLoading,
    error: null,
    refreshPrices: refreshMetrics,
    isRefreshing: false,
  };
};

export default useEnhancedSpendingData;
