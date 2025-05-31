
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';
import { useSpendingMetrics } from '@/hooks/useSpendingMetrics';

interface TotalLibrarySpendingData {
  totalLibraryValue: number;
  totalSaved: number | null;
  totalGames: number;
  currency: string;
  refreshedAt: string | null;
}

const useTotalLibrarySpending = () => {
  const { user } = useAuth();
  const { isDemo, demoData } = useDemoMode();
  const { data: spendingMetrics, isLoading, error } = useSpendingMetrics();

  // Transform spending metrics to total library spending format
  const data: TotalLibrarySpendingData | undefined = spendingMetrics ? {
    totalLibraryValue: spendingMetrics.totalSpentDollars,
    totalSaved: spendingMetrics.totalSavedCents ? spendingMetrics.totalSavedCents / 100 : null,
    totalGames: spendingMetrics.totalGames,
    currency: spendingMetrics.currency,
    refreshedAt: spendingMetrics.lastCalculated,
  } : undefined;

  // In demo mode, return demo data
  if (isDemo) {
    return {
      data: {
        totalLibraryValue: 799,
        totalSaved: null,
        totalGames: 150,
        currency: 'USD',
        refreshedAt: new Date().toISOString(),
      },
      isLoading: false,
      error: null,
    };
  }

  return { data, isLoading, error };
};

export default useTotalLibrarySpending;
