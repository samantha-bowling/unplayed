
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
  unplayedSpent: number;
  potentialGameplayHours: number;
  cleanScore: number;
  recentlyPlayedCount: number;
  totalPlaytime: number;
  genres: Array<{ name: string; value: number; color: string }>;
  shelfLife: Array<{ name: string; value: number }>;
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
          unplayedSpent: demoData.totalSpent,
          potentialGameplayHours: demoData.potentialGameplayHours,
          cleanScore: demoData.cleanScore,
          recentlyPlayedCount: demoData.recentlyPlayedCount,
          totalPlaytime: demoData.totalPlaytime || 0,
          genres: demoData.genres || [],
          shelfLife: demoData.shelfLife || [],
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
          totalPlaytime: 0,
          genres: [],
          shelfLife: [],
        };
      }

      console.log('Dashboard data compilation:', {
        unplayedGames: unplayedData.unplayedGames,
        unplayedSpent: spendingData.totalSpent,
        totalSpent: unplayedData.totalSpent,
        totalPlaytime: unplayedData.totalPlaytime,
        spendingConfidence: spendingData.confidence,
        genres: unplayedData.genres?.length || 0,
        shelfLife: unplayedData.shelfLife?.length || 0
      });

      return {
        unplayedGames: unplayedData.unplayedGames,
        totalGames: unplayedData.totalGames,
        dustScore: unplayedData.dustScore,
        totalSpent: unplayedData.totalSpent,
        unplayedSpent: spendingData.totalSpent,
        potentialGameplayHours: unplayedData.potentialGameplayHours,
        cleanScore: unplayedData.cleanScore,
        recentlyPlayedCount: unplayedData.recentlyPlayedCount,
        totalPlaytime: unplayedData.totalPlaytime,
        genres: unplayedData.genres || [],
        shelfLife: unplayedData.shelfLife || [],
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
      totalPlaytime: 0,
      genres: [],
      shelfLife: [],
    },
    isLoading: isLoading || unplayedLoading || spendingLoading,
    error,
    refetch,
    lastRefreshed,
  };
};
