
import { useUnifiedSpendingData } from './useUnifiedSpendingData';

// Simple adapter to maintain compatibility with existing SpendingEstimate component
export const useSpendingDataSimple = () => {
  const { data, isLoading, refreshMetrics } = useUnifiedSpendingData();
  
  return {
    data: {
      totalSpent: data.unplayedSpent, // SpendingEstimate shows unplayed spending
      totalSaved: data.unplayedSaved,
      topSpendingGames: data.topSpendingGames,
      priceDistribution: data.priceDistribution,
      currency: data.currency,
      refreshedAt: data.lastCalculated,
    },
    isLoading,
    error: null,
    refreshPrices: refreshMetrics,
    isRefreshing: false,
  };
};

export default useSpendingDataSimple;
