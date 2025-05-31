import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';
import { useUnplayedData } from '@/hooks/useUnplayedData';
import { useSpendingMetrics } from '@/hooks/useSpendingMetrics';
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
  const { data: unplayedData, isLoading: unplayedLoading } = useUnplayedData();
  const { data: spendingMetrics, isLoading: spendingLoading } = useSpendingMetrics();

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

      // For authenticated users, combine unplayed data with spending metrics
      if (!unplayedData || !spendingMetrics) {
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

      // Calculate clean score using the latest calculation from clean-score-utils
      const playedGames = unplayedData.totalGames - unplayedData.unplayedGames;
      const totalPlaytimeHours = unplayedData.totalPlaytime;
      const gamesList = unplayedData.gamesList || [];
      
      const { cleanScore } = calculateCleanScore(
        playedGames,
        unplayedData.totalGames,
        totalPlaytimeHours,
        gamesList,
        unplayedData.recentlyPlayedCount
      );

      console.log('Dashboard data compilation:', {
        unplayedGames: unplayedData.unplayedGames,
        unplayedSpent: spendingMetrics.unplayedSpentDollars,
        totalSpent: spendingMetrics.totalSpentDollars,
        totalPlaytime: unplayedData.totalPlaytime,
        dustScore: unplayedData.dustScore,
        dustScoreSource: 'unplayedData.dustScore',
        cleanScore: cleanScore,
        spendingConfidence: spendingMetrics.confidence
      });

      return {
        unplayedGames: unplayedData.unplayedGames,
        totalGames: unplayedData.totalGames,
        dustScore: unplayedData.dustScore, // Use actual dust score from unplayed data
        totalSpent: spendingMetrics.totalSpentDollars,
        unplayedSpent: spendingMetrics.unplayedSpentDollars,
        potentialGameplayHours: unplayedData.potentialGameplayHours,
        cleanScore: cleanScore, // Use calculated clean score
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
  const lastRefreshed = spendingMetrics?.lastCalculated ? new Date(spendingMetrics.lastCalculated) : null;

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
