
import { useMemo } from 'react';
import { useUnifiedLibraryData } from '@/hooks/useUnifiedLibraryData';
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';

/**
 * Hook to calculate total library spending (all games, not just unplayed)
 */
export const useTotalLibrarySpending = () => {
  const { user } = useAuth();
  const { isDemo, demoData } = useDemoMode();
  const { data: unifiedData, isLoading } = useUnifiedLibraryData();

  // Transform unified data and calculate spending
  const totalSpending = useMemo(() => {
    if (isDemo) {
      return {
        totalSpent: demoData.totalSpent || 0,
        totalGames: demoData.totalGames || 0,
        currency: 'USD'
      };
    }

    if (!unifiedData) {
      return {
        totalSpent: 0,
        totalGames: 0,
        currency: 'USD'
      };
    }

    // Fix the reduce function - correct parameter order: (accumulator, currentValue)
    const totalSpent = unifiedData.reduce((sum, gameItem) => {
      const price = gameItem.games?.price_cents ? gameItem.games.price_cents / 100 : 0;
      return sum + price;
    }, 0); // Initial value of 0

    return {
      totalSpent,
      totalGames: unifiedData.length,
      currency: 'USD'
    };
  }, [isDemo, demoData, unifiedData]);

  return {
    data: totalSpending,
    isLoading,
    error: null
  };
};

export default useTotalLibrarySpending;
