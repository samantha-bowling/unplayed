import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';
import { useUserMetrics } from '@/hooks/use-user-metrics';
import { useSpendingMetrics } from '@/hooks/useSpendingMetrics';
import { useGenreStats } from '@/hooks/use-genre-stats';
import { useShelfLifeData } from '@/hooks/use-shelf-life-data';
import { queryKeys } from '@/hooks/use-query-keys';
import { calculateCleanScore } from '@/utils/clean-score-utils';
import { processGenres } from '@/utils/genre-processing';

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
  const { data: userMetrics, isLoading: userMetricsLoading } = useUserMetrics();
  const { data: spendingMetrics, isLoading: spendingLoading } = useSpendingMetrics();
  const { data: genreStats, isLoading: genreStatsLoading } = useGenreStats();
  const { data: shelfLifeData, isLoading: shelfLifeLoading } = useShelfLifeData();

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

      // For authenticated users, use userMetrics as primary source
      if (!userMetrics || !spendingMetrics) {
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

      // Process and consolidate genre stats using the utility
      let transformedGenres = [];
      if (genreStats && genreStats.length > 0) {
        const genreCounts = new Map<string, number>();
        genreStats.forEach(stat => {
          genreCounts.set(stat.genreName, stat.gameCount);
        });
        transformedGenres = processGenres(genreCounts);
      }

      // Transform shelf life data to the expected format
      const transformedShelfLife = (shelfLifeData || []).map(game => ({
        id: game.gameId,
        name: game.gameName,
        release_date: game.releaseDate,
        years_old: game.yearsOld,
        playtime_minutes: game.playtimeMinutes,
        rank: game.rank,
        image_url: game.imageUrl
      }));

      console.log('Dashboard data compilation (using userMetrics):', {
        unplayedGames: userMetrics.unplayedGames,
        totalGames: userMetrics.totalGames,
        cleanScore: userMetrics.cleanScore,
        dustScore: userMetrics.totalDustScore / Math.max(1, userMetrics.totalGames),
        totalPlaytime: userMetrics.totalPlaytimeHours,
        recentlyPlayedCount: userMetrics.recentlyPlayedCount,
        genresCount: transformedGenres.length,
        shelfLifeCount: transformedShelfLife.length,
        source: 'userMetrics'
      });

      return {
        unplayedGames: userMetrics.unplayedGames,
        totalGames: userMetrics.totalGames,
        dustScore: userMetrics.totalDustScore / Math.max(1, userMetrics.totalGames), // Average dust score
        totalSpent: spendingMetrics.totalSpentDollars,
        unplayedSpent: spendingMetrics.unplayedSpentDollars,
        potentialGameplayHours: 0, // Not available in userMetrics, would need separate calculation
        cleanScore: userMetrics.cleanScore,
        recentlyPlayedCount: userMetrics.recentlyPlayedCount,
        totalPlaytime: userMetrics.totalPlaytimeHours,
        genres: transformedGenres,
        shelfLife: transformedShelfLife,
      };
    },
    enabled: isDemo || (!!user && !userMetricsLoading && !spendingLoading && !genreStatsLoading && !shelfLifeLoading),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Calculate last refreshed time from user metrics if available
  const lastRefreshed = userMetrics?.lastCalculated ? new Date(userMetrics.lastCalculated) : null;

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
    isLoading: isLoading || userMetricsLoading || spendingLoading || genreStatsLoading || shelfLifeLoading,
    error,
    refetch,
    lastRefreshed,
  };
};
