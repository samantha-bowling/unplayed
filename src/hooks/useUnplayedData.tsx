
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';
import { UnplayedDataType } from '@/types/unplayed-data.types';
import { transformUserGameData } from '@/utils/transformUnplayedData';
import { normalizeDemoGames } from '@/utils/normalize-games';
import { useProfile } from '@/hooks/use-profile';
import { queryKeys } from './use-query-keys';
import { useMemo } from 'react';

// Type guard to ensure data is an array
const isValidUserGamesArray = (data: any): data is any[] => {
  return Array.isArray(data) && data.every(game => 
    game && 
    typeof game === 'object' && 
    typeof game.game_id === 'number'
  );
};

/**
 * Unified hook that provides unplayed game data with optimized performance
 * Maintains clean separation between demo and live data
 */
export const useUnplayedData = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { isDemo, demoData } = useDemoMode();
  
  // Memoize the enabled condition to prevent unnecessary re-renders
  const isQueryEnabled = useMemo(() => 
    !!user && !isDemo && !!profile?.steam_id, 
    [user, isDemo, profile?.steam_id]
  );
  
  // Query for real data with optimized key structure and error handling
  const { 
    data: userGamesData, 
    isLoading: isLoadingUserGames, 
    error: userGamesError,
    refetch: refetchUserGames,
  } = useQuery({
    queryKey: queryKeys.unplayedData(user?.id),
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      console.log('Fetching unplayed data for user:', user.id);
      
      try {
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
          console.error('Error fetching user games:', userGamesError);
          throw userGamesError;
        }

        // Validate the returned data
        if (!isValidUserGamesArray(userGamesData)) {
          console.error('Invalid data structure returned from query:', userGamesData);
          console.warn('Expected array, received:', typeof userGamesData);
          // Return empty array instead of throwing to prevent app crash
          return [];
        }

        console.log(`Found ${userGamesData.length} games for user ${user.id}`);
        
        if (userGamesData.length > 0) {
          const totalDustScore = userGamesData.reduce((sum, g) => sum + (g.dust_score || 0), 0);
          console.log('Total dust score:', totalDustScore);
        }
        
        return userGamesData;
      } catch (error) {
        console.error('Query function error:', error);
        // Return empty array instead of throwing to prevent app crash
        return [];
      }
    },
    enabled: isQueryEnabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false, // Reduced frequency for better performance
    refetchInterval: 15 * 60 * 1000, // Increased to 15 minutes
  });

  // Memoize game IDs to prevent unnecessary estimate queries with validation
  const gameIds = useMemo(() => {
    if (!isValidUserGamesArray(userGamesData)) {
      console.warn('userGamesData is not a valid array in gameIds memo:', userGamesData);
      return [];
    }
    return userGamesData.map(game => game.game_id).filter(id => typeof id === 'number');
  }, [userGamesData]);

  // Query for game time estimates with optimized caching
  const {
    data: gameEstimatesData,
    isLoading: isLoadingEstimates,
  } = useQuery({
    queryKey: queryKeys.gameEstimates(user?.id),
    queryFn: async () => {
      if (gameIds.length === 0) return {};
      
      try {
        const { data: estimatesData, error: estimatesError } = await supabase
          .from('game_estimates')
          .select('*')
          .in('game_id', gameIds);
        
        if (estimatesError) {
          console.error('Error fetching estimates:', estimatesError);
          return {};
        }
        
        // Use Object.fromEntries for better performance
        return Object.fromEntries(
          estimatesData?.map(estimate => [estimate.game_id, estimate]) || []
        );
      } catch (error) {
        console.error('Game estimates query error:', error);
        return {};
      }
    },
    enabled: gameIds.length > 0 && !!user && !isDemo,
    staleTime: 30 * 60 * 1000, // 30 minutes for estimates (they change less frequently)
  });

  // Memoize demo data processing to prevent unnecessary recalculations
  const normalizedDemoData = useMemo(() => {
    if (!isDemo) return null;
    console.log('Using demo data:', demoData);
    return normalizeDemoGames(JSON.parse(JSON.stringify(demoData)));
  }, [isDemo, demoData]);

  // Memoize the transformed data to prevent unnecessary recalculations with validation
  const transformedData = useMemo(() => {
    if (isDemo && normalizedDemoData) {
      return normalizedDemoData;
    }
    
    // Ensure we have valid data before transforming
    if (!isValidUserGamesArray(userGamesData)) {
      console.warn('Invalid userGamesData, using demo data fallback:', userGamesData);
      return normalizeDemoGames(demoData);
    }
    
    return transformUserGameData(userGamesData, gameEstimatesData || {});
  }, [userGamesData, gameEstimatesData, demoData, isDemo, normalizedDemoData]);

  // Memoize last refreshed calculation
  const lastRefreshed = useMemo(() => 
    profile?.last_sync ? new Date(profile.last_sync) : null,
    [profile?.last_sync]
  );

  // Calculate loading state
  const isLoading = isDemo ? false : (isLoadingUserGames || isLoadingEstimates);
  const error = isDemo ? null : userGamesError;

  // Log transformed data for debugging (only in development)
  if (process.env.NODE_ENV === 'development' && isValidUserGamesArray(userGamesData)) {
    console.log('Transformed data gamesList sample:', 
      transformedData.gamesList?.length ? transformedData.gamesList.slice(0, 3) : 'No games in list');
    console.log('Transformed data total dust score:', transformedData.dustScore);
  }

  return {
    data: transformedData,
    isLoading,
    error,
    lastRefreshed,
    refetch: isDemo ? () => Promise.resolve() : refetchUserGames
  };
};

export default useUnplayedData;
