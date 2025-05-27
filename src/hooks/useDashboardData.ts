
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';
import { useProfile } from '@/hooks/use-profile';
import { UnplayedDataType } from '@/types/unplayed-data.types';
import { transformUserGameData } from '@/utils/transformUnplayedData';
import { normalizeDemoGames } from '@/utils/normalize-games';
import { optimizedQueryKeys } from './use-query-keys-optimized';
import { useMemo } from 'react';

/**
 * Creates a safe fallback data structure to ensure components never receive undefined
 */
const createFallbackData = (): UnplayedDataType => ({
  unplayedGames: 0,
  totalGames: 0,
  dustScore: 0,
  totalPlaytime: 0,
  totalSpent: 0,
  potentialGameplayHours: 0,
  genres: [],
  shelfLife: [],
  library: [],
  gamesList: [],
  cleanScore: 0,
  cleanScoreBreakdown: {
    completionRate: 0,
    engagementFactor: 0,
    recencyFactor: 0
  },
  cleanTier: {
    name: 'Clean Slate',
    color: '#4ade80',
    range: [0, 100]
  },
  cleanStreak: 0,
  recentlyPlayedCount: 0
});

/**
 * Unified hook that provides all dashboard data in a single optimized query
 * Replaces individual hooks for better performance and reduced API calls
 */
export const useDashboardData = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { isDemo, demoData } = useDemoMode();
  
  // Memoize the enabled condition to prevent unnecessary re-renders
  const isQueryEnabled = useMemo(() => 
    !!user && !isDemo && !!profile?.steam_id, 
    [user, isDemo, profile?.steam_id]
  );
  
  // Single query for all dashboard data
  const { 
    data: dashboardData, 
    isLoading: isLoadingDashboard, 
    error: dashboardError,
    refetch: refetchDashboard,
  } = useQuery({
    queryKey: optimizedQueryKeys.unplayed.data(user?.id, profile?.steam_id),
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      console.log('Fetching unified dashboard data for user:', user.id);
      
      // Fetch user games with all necessary data for dashboard
      const { data: userGamesData, error: userGamesError } = await supabase
        .from('user_games')
        .select(`
          id,
          game_id,
          playtime_minutes,
          hidden,
          dust_score,
          last_played_date,
          acquisition_date,
          notes,
          games:game_id(
            id, 
            name, 
            image_url,
            header_image,
            release_date,
            metacritic_score,
            genres,
            categories,
            price_cents
          )
        `)
        .eq('user_id', user.id)
        .order('dust_score', { ascending: false });
      
      if (userGamesError) {
        console.error('Error fetching dashboard data:', userGamesError);
        throw userGamesError;
      }

      console.log(`Found ${userGamesData?.length || 0} games for dashboard`);
      
      return userGamesData || [];
    },
    enabled: isQueryEnabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchInterval: 15 * 60 * 1000, // 15 minutes
  });

  // Memoize game IDs to prevent unnecessary estimate queries
  const gameIds = useMemo(() => 
    dashboardData?.map(game => game.game_id) || [], 
    [dashboardData]
  );

  // Query for game time estimates
  const {
    data: gameEstimatesData,
    isLoading: isLoadingEstimates,
  } = useQuery({
    queryKey: optimizedQueryKeys.estimates.byGameIds(gameIds),
    queryFn: async () => {
      if (gameIds.length === 0) return {};
      
      const { data: estimatesData, error: estimatesError } = await supabase
        .from('game_estimates')
        .select('*')
        .in('game_id', gameIds);
      
      if (estimatesError) throw estimatesError;
      
      return Object.fromEntries(
        estimatesData?.map(estimate => [estimate.game_id, estimate]) || []
      );
    },
    enabled: gameIds.length > 0 && !!user && !isDemo,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  // Memoize demo data processing
  const normalizedDemoData = useMemo(() => {
    if (!isDemo) return null;
    console.log('Using unified demo data for dashboard');
    try {
      return normalizeDemoGames(JSON.parse(JSON.stringify(demoData)));
    } catch (error) {
      console.error('Error normalizing demo data:', error);
      return createFallbackData();
    }
  }, [isDemo, demoData]);

  // Memoize the transformed dashboard data with enhanced error handling
  const transformedData = useMemo(() => {
    try {
      if (isDemo) {
        return normalizedDemoData || createFallbackData();
      }
      
      if (!dashboardData) {
        // Return fallback data while loading or if no data
        return createFallbackData();
      }
      
      const result = transformUserGameData(dashboardData, gameEstimatesData || {});
      
      // Ensure all required properties exist with fallbacks
      return {
        ...createFallbackData(),
        ...result,
        // Ensure arrays are never undefined
        genres: result.genres || [],
        shelfLife: result.shelfLife || [],
        library: result.library || [],
        gamesList: result.gamesList || [],
        // Ensure objects are never undefined
        cleanScoreBreakdown: result.cleanScoreBreakdown || createFallbackData().cleanScoreBreakdown,
        cleanTier: result.cleanTier || createFallbackData().cleanTier
      };
    } catch (error) {
      console.error('Error transforming dashboard data:', error);
      return createFallbackData();
    }
  }, [dashboardData, gameEstimatesData, isDemo, normalizedDemoData]);

  // Memoize last refreshed calculation
  const lastRefreshed = useMemo(() => 
    profile?.last_sync ? new Date(profile.last_sync) : null,
    [profile?.last_sync]
  );

  // Calculate loading state - only show loading for live data
  const isLoading = isDemo ? false : (isLoadingDashboard || isLoadingEstimates);
  const error = isDemo ? null : dashboardError;

  return {
    data: transformedData,
    isLoading,
    error,
    lastRefreshed,
    refetch: isDemo ? () => Promise.resolve() : refetchDashboard
  };
};

export default useDashboardData;
