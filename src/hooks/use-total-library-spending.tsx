
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
  const { data, isLoading } = useUnifiedLibraryData();

  // Transform unified data and calculate spending
  const totalSpending = useMemo(() => {
    if (isDemo) {
      return {
        totalSpent: demoData.totalSpent || 0,
        totalGames: demoData.totalGames || 0,
        currency: 'USD'
      };
    }

    if (!data) {
      return {
        totalSpent: 0,
        totalGames: 0,
        currency: 'USD'
      };
    }

    // Add explicit type annotation to fix TypeScript inference issue
    const totalSpent = data.reduce<number>((accumulator, currentGame) => {
      const price = currentGame.games?.price_cents ? currentGame.games.price_cents / 100 : 0;
      return accumulator + price;
    }, 0); // Initial value of 0

    return {
      totalSpent,
      totalGames: data.length,
      currency: 'USD'
    };
  }, [isDemo, demoData, data]);

  return {
    data: totalSpending,
    isLoading,
    error: null
  };
};

export default useTotalLibrarySpending;
