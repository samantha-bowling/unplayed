import { useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';
import { useUserMetrics } from '@/hooks/use-user-metrics';
import { useUnifiedSpendingDataV2 } from '@/hooks/useUnifiedSpendingDataV2';
import { useGenreStats } from '@/hooks/use-genre-stats';
import { useShelfLifeData } from '@/hooks/use-shelf-life-data';
import { processGenres } from '@/utils/genre-processing';
import { getBestGameImage } from '@/utils/image-utils';

export interface DashboardData {
  unplayedGames: number;
  totalGames: number;
  dustScore: number;
  totalSpent: number;
  unplayedSpent: number;
  
  cleanScore: number;
  recentlyPlayedCount: number;
  totalPlaytime: number;
  genres: Array<{ name: string; value: number; color: string }>;
  shelfLife: Array<any>;
}

const EMPTY_DASHBOARD_DATA: DashboardData = {
  unplayedGames: 0,
  totalGames: 0,
  dustScore: 0,
  totalSpent: 0,
  unplayedSpent: 0,
  cleanScore: 0,
  recentlyPlayedCount: 0,
  totalPlaytime: 0,
  genres: [],
  shelfLife: [],
};

export const useDashboardData = () => {
  const { user } = useAuth();
  const { isDemo, demoData } = useDemoMode();
  const {
    data: userMetrics,
    isLoading: userMetricsLoading,
    error: userMetricsError,
    refetch: refetchUserMetrics,
  } = useUserMetrics();
  const {
    data: spendingData,
    isLoading: spendingLoading,
    error: spendingError,
    refetch: refetchSpendingData,
  } = useUnifiedSpendingDataV2();
  const {
    data: genreStats,
    isLoading: genreStatsLoading,
    error: genreStatsError,
  } = useGenreStats();
  const {
    data: shelfLifeData,
    isLoading: shelfLifeLoading,
    error: shelfLifeError,
    refetch: refetchShelfLifeData,
  } = useShelfLifeData();

  const data = useMemo<DashboardData>(() => {
    if (isDemo) {
      return {
        unplayedGames: demoData.unplayedGames,
        totalGames: demoData.totalGames,
        dustScore: demoData.dustScore,
        totalSpent: demoData.totalSpent,
        unplayedSpent: demoData.unplayedSpent ?? demoData.totalSpent,
        cleanScore: demoData.cleanScore || 0,
        recentlyPlayedCount: demoData.recentlyPlayedCount || 0,
        totalPlaytime: demoData.totalPlaytime || 0,
        genres: Array.isArray(demoData.genres) ? demoData.genres : [],
        shelfLife: Array.isArray(demoData.shelfLife) ? demoData.shelfLife : [],
      };
    }

    if (!user || !userMetrics) {
      return EMPTY_DASHBOARD_DATA;
    }

    let transformedGenres: DashboardData['genres'] = [];
    if (Array.isArray(genreStats) && genreStats.length > 0) {
      const genreCounts = new Map<string, number>();
      genreStats.forEach((stat) => {
        genreCounts.set(stat.genre_name, stat.game_count);
      });
      transformedGenres = processGenres(genreCounts);
    }

    const transformedShelfLife = Array.isArray(shelfLifeData)
      ? shelfLifeData.map((game) => ({
          id: game.gameId,
          name: game.gameName,
          addedDate: null,
          releaseDate: game.releaseDate,
          image: getBestGameImage(null, game.imageUrl, game.gameId),
        }))
      : [];

    return {
      unplayedGames: userMetrics.unplayedGames,
      totalGames: userMetrics.totalGames,
      dustScore: userMetrics.totalDustScore / Math.max(1, userMetrics.totalGames),
      totalSpent: spendingData.totalLibraryValue,
      unplayedSpent: spendingData.unplayedSpent,
      cleanScore: userMetrics.cleanScore,
      recentlyPlayedCount: userMetrics.recentlyPlayedCount,
      totalPlaytime: userMetrics.totalPlaytimeHours,
      genres: transformedGenres,
      shelfLife: transformedShelfLife,
    };
  }, [demoData, genreStats, isDemo, shelfLifeData, spendingData, user, userMetrics]);

  const refetch = useCallback(async () => {
    if (isDemo || !user) {
      return [];
    }

    return Promise.allSettled([
      refetchUserMetrics(),
      refetchSpendingData(),
      refetchShelfLifeData(),
    ]);
  }, [isDemo, refetchShelfLifeData, refetchSpendingData, refetchUserMetrics, user]);

  const isLoading = isDemo
    ? false
    : !!user && (userMetricsLoading || spendingLoading || genreStatsLoading || shelfLifeLoading);

  const error = userMetricsError || spendingError || genreStatsError || shelfLifeError || null;

  // Calculate last refreshed time from user metrics if available
  const lastRefreshed = userMetrics?.lastCalculated ? new Date(userMetrics.lastCalculated) : null;

  return {
    data,
    isLoading,
    error,
    refetch,
    lastRefreshed,
  };
};
