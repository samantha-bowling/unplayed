
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';
import { UnplayedDataType } from '@/types/unplayed-data.types';
import { transformUserGameData } from '@/utils/transformUnplayedData';
import { normalizeDemoGames } from '@/utils/normalize-games';
import { useProfile } from '@/hooks/use-profile';
import { queryKeys } from './use-query-keys';
import { useMemo } from 'react';
import { fetchAllUserGames } from '@/utils/fetch-all-user-games';

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
  
  // Query for real data
  const { 
    data: userGamesData, 
    isLoading: isLoadingUserGames, 
    error: userGamesError,
    refetch: refetchUserGames,
  } = useQuery({
    queryKey: queryKeys.unplayedData(user?.id),
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      const data = await fetchAllUserGames(
        user.id,
        `
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
        `,
        { column: 'dust_score', ascending: false }
      );
      
      return data;
    },
    enabled: isQueryEnabled,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchInterval: 15 * 60 * 1000,
  });

  // Memoize demo data processing to prevent unnecessary recalculations
  const normalizedDemoData = useMemo(() => {
    if (!isDemo) return null;
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

  const isLoading = isDemo ? false : isLoadingUserGames;
  const error = isDemo ? null : userGamesError;

  return {
    data: transformedData,
    isLoading,
    error,
    lastRefreshed,
    refetch: isDemo ? () => Promise.resolve() : refetchUserGames
  };
};

export default useUnplayedData;
