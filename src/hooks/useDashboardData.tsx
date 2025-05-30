
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';
import { useUnifiedLibraryData } from '@/hooks/useUnifiedLibraryData';
import { useEnhancedSpendingData } from '@/hooks/use-spending-data-enhanced';
import { queryKeys } from '@/hooks/use-query-keys';
import { calculateCleanScore } from '@/utils/clean-score-utils';

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
  shelfLife: Array<any>;
}

export const useDashboardData = () => {
  const { user } = useAuth();
  const { isDemo, demoData } = useDemoMode();
  
  // Use unified library data for authenticated users
  const { data: unifiedData, stats: unifiedStats, isLoading: unifiedLoading } = useUnifiedLibraryData();
  const { data: spendingData, isLoading: spendingLoading } = useEnhancedSpendingData();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.unplayedData(user?.id),
    queryFn: async (): Promise<DashboardData> => {
      // In demo mode, return demo data with all required fields
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

      // For authenticated users, use the unified data source
      if (!unifiedStats || !spendingData) {
        console.log('Dashboard: Waiting for unified data or spending data');
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

      // Calculate clean score using the unified stats
      const totalPlaytimeHours = unifiedStats.totalPlaytime / 60;
      
      const { cleanScore } = calculateCleanScore(
        unifiedStats.playedGames,
        unifiedStats.totalGames,
        totalPlaytimeHours,
        [], // gamesList not needed for clean score calculation
        unifiedStats.recentlyPlayedCount
      );

      console.log('Dashboard data from unified source:', {
        unplayedGames: unifiedStats.unplayedGames,
        totalGames: unifiedStats.totalGames,
        dustScore: unifiedStats.totalDustScore,
        unplayedSpent: spendingData.totalSpent,
        cleanScore: cleanScore,
        spendingConfidence: spendingData.confidence
      });

      return {
        unplayedGames: unifiedStats.unplayedGames,
        totalGames: unifiedStats.totalGames,
        dustScore: unifiedStats.totalDustScore,
        totalSpent: spendingData.totalSpent, // Use spending data for total spent
        unplayedSpent: spendingData.totalSpent, // Use spending data for unplayed spent
        potentialGameplayHours: 0, // TODO: Calculate from game estimates
        cleanScore: cleanScore,
        recentlyPlayedCount: unifiedStats.recentlyPlayedCount,
        totalPlaytime: totalPlaytimeHours,
        genres: [], // TODO: Calculate from unified data
        shelfLife: [], // TODO: Calculate from unified data
      };
    },
    enabled: isDemo || (!!user && !unifiedLoading && !spendingLoading),
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
    isLoading: isLoading || unifiedLoading || spendingLoading,
    error,
    refetch,
    lastRefreshed,
  };
};
