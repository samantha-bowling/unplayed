
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';
import { useUnplayedData } from '@/hooks/useUnplayedData';
import { useEnhancedSpendingData } from '@/hooks/use-spending-data-enhanced';
import { queryKeys } from '@/hooks/use-query-keys';

export interface DashboardData {
  unplayedGames: number;
  totalGames: number;
  dustScore: number;
  totalSpent: number;
  unplayedSpent: number; // This is the key field for unplayed spending
  potentialGameplayHours: number;
  cleanScore: number;
  recentlyPlayedCount: number;
}

export const useDashboardData = () => {
  const { user } = useAuth();
  const { isDemo, demoData } = useDemoMode();
  const { data: unplayedData, isLoading: unplayedLoading } = useUnplayedData();
  const { data: spendingData, isLoading: spendingLoading } = useEnhancedSpendingData();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.dashboardData(user?.id),
    queryFn: async (): Promise<DashboardData> => {
      // In demo mode, return demo data
      if (isDemo) {
        return {
          unplayedGames: demoData.unplayedGames,
          totalGames: demoData.totalGames,
          dustScore: demoData.dustScore,
          totalSpent: demoData.totalSpent,
          unplayedSpent: demoData.totalSpent, // Use same value for demo
          potentialGameplayHours: demoData.potentialGameplayHours,
          cleanScore: demoData.cleanScore,
          recentlyPlayedCount: demoData.recentlyPlayedCount,
        };
      }

      // For authenticated users, combine unplayed data with enhanced spending data
      if (!unplayedData || !spendingData) {
        // Return default values if data is not ready
        return {
          unplayedGames: 0,
          totalGames: 0,
          dustScore: 0,
          totalSpent: 0,
          unplayedSpent: 0,
          potentialGameplayHours: 0,
          cleanScore: 0,
          recentlyPlayedCount: 0,
        };
      }

      console.log('Dashboard data compilation:', {
        unplayedGames: unplayedData.unplayedGames,
        unplayedSpent: spendingData.totalSpent,
        totalSpent: unplayedData.totalSpent,
        spendingConfidence: spendingData.confidence
      });

      return {
        unplayedGames: unplayedData.unplayedGames,
        totalGames: unplayedData.totalGames,
        dustScore: unplayedData.dustScore,
        totalSpent: unplayedData.totalSpent, // Total library value
        unplayedSpent: spendingData.totalSpent, // Enhanced calculation for unplayed only
        potentialGameplayHours: unplayedData.potentialGameplayHours,
        cleanScore: unplayedData.cleanScore,
        recentlyPlayedCount: unplayedData.recentlyPlayedCount,
      };
    },
    enabled: isDemo || (!!user && !unplayedLoading && !spendingLoading),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Calculate last refreshed time from spending data if available
  const lastRefreshed = spendingData?.refreshedAt ? new Date(spendingData.refreshedAt) : null;

  return {
    data: data || {
      unplayedGames: 0,
      totalGames: 0,
      dustScore: 0,
      totalSpent: 0,
      unplayedSpent: 0,
      potentialGameplayHours: 0,
      cleanScore: 0,
      recentlyPlayedCount: 0,
    },
    isLoading: isLoading || unplayedLoading || spendingLoading,
    error,
    refetch,
    lastRefreshed,
  };
};
