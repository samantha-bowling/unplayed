
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';
import { UnplayedDataType } from '@/types/unplayed-data.types';
import { transformUserGameData } from '@/utils/transformUnplayedData';
import { normalizeDemoGames } from '@/utils/normalize-games';
import { useProfile } from '@/hooks/use-profile';
import { optimizedQueryKeys } from './use-query-keys-optimized';
import { useMemo } from 'react';

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
  
  // Query for real data with optimized key structure
  const { 
    data: userGamesData, 
    isLoading: isLoadingUserGames, 
    error: userGamesError,
    refetch: refetchUserGames,
  } = useQuery({
    queryKey: optimizedQueryKeys.unplayed.data(user?.id, profile?.steam_id),
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      console.log('Fetching unplayed data for user:', user.id);
      
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

      console.log(`Found ${userGamesData?.length || 0} games for user ${user.id}`);
      
      if (userGamesData && userGamesData.length > 0) {
        const totalDustScore = userGamesData.reduce((sum, g) => sum + (g.dust_score || 0), 0);
        console.log('Total dust score:', totalDustScore);
      }
      
      return userGamesData;
    },
    enabled: isQueryEnabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false, // Reduced frequency for better performance
    refetchInterval: 15 * 60 * 1000, // Increased to 15 minutes
  });

  // Memoize demo data processing to prevent unnecessary recalculations
  const normalizedDemoData = useMemo(() => {
    if (!isDemo) return null;
    console.log('Using demo data:', demoData);
    return normalizeDemoGames(JSON.parse(JSON.stringify(demoData)));
  }, [isDemo, demoData]);

  // Memoize the transformed data to prevent unnecessary recalculations
  const transformedData = useMemo(() => {
    if (isDemo && normalizedDemoData) {
      return normalizedDemoData;
    }
    
    if (!userGamesData) {
      return normalizeDemoGames(demoData);
    }
    
    return transformUserGameData(userGamesData);
  }, [userGamesData, demoData, isDemo, normalizedDemoData]);

  // Memoize last refreshed calculation
  const lastRefreshed = useMemo(() => 
    profile?.last_sync ? new Date(profile.last_sync) : null,
    [profile?.last_sync]
  );

  // Calculate loading state
  const isLoading = isDemo ? false : isLoadingUserGames;
  const error = isDemo ? null : userGamesError;

  // Log transformed data for debugging (only in development)
  if (process.env.NODE_ENV === 'development' && userGamesData) {
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
