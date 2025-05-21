
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';
import { UnplayedDataType } from '@/types/unplayed-data.types';
import { transformUserGameData } from '@/utils/transform-unplayed-data';
import { normalizeDemoGames } from '@/utils/normalize-games';
import { useProfile } from '@/hooks/use-profile';

/**
 * Custom hook to provide unplayed game data, either from real API calls or demo data
 */
export const useUnplayedData = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { isDemo, demoData } = useDemoMode();
  
  // Query for real data when authenticated and not in demo mode
  const { 
    data: userGamesData, 
    isLoading: isLoadingUserGames, 
    error: userGamesError 
  } = useQuery({
    queryKey: ['unplayedData', user?.id, isDemo, profile?.steam_id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
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
      
      if (userGamesError) throw userGamesError;

      return userGamesData;
    },
    enabled: !!user && !isDemo && !!profile?.steam_id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });

  // Query for game time estimates
  const {
    data: gameEstimatesData,
    isLoading: isLoadingEstimates,
  } = useQuery({
    queryKey: ['gameEstimates', user?.id, isDemo, userGamesData?.length],
    queryFn: async () => {
      if (!userGamesData || userGamesData.length === 0) return {};
      
      const gameIds = userGamesData.map(game => game.game_id);
      
      const { data: estimatesData, error: estimatesError } = await supabase
        .from('game_estimates')
        .select('*')
        .in('game_id', gameIds);
      
      if (estimatesError) throw estimatesError;
      
      const estimatesMap: Record<number, any> = {};
      estimatesData?.forEach(estimate => {
        estimatesMap[estimate.game_id] = estimate;
      });
      
      return estimatesMap;
    },
    enabled: !!userGamesData && userGamesData.length > 0 && !!user && !isDemo,
  });

  const isLoading = isLoadingUserGames || isLoadingEstimates;
  const error = userGamesError;

  if (isDemo) {
    return {
      data: normalizeDemoGames(demoData),
      isLoading: false,
      error: null,
      lastRefreshed: null
    };
  }

  const data = userGamesData 
    ? transformUserGameData(userGamesData, gameEstimatesData || {}) 
    : normalizeDemoGames(demoData);

  // Calculate lastRefreshed timestamp from profile's last_sync
  const lastRefreshed = profile?.last_sync ? new Date(profile.last_sync) : null;

  return {
    data,
    isLoading,
    error,
    lastRefreshed,
  };
};

export default useUnplayedData;
