
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';
import { UnplayedDataType, GameListItem } from '@/types/unplayed-data.types';
import { transformUserGameData } from '@/utils/transform-unplayed-data';

/**
 * Helper function to normalize demo game data to match the real data structure
 */
const normalizeDemoGames = (demoData) => {
  // Map the library array to match our GameListItem structure
  const gamesList: GameListItem[] = demoData.library.map(game => ({
    id: game.id,
    title: game.title,
    playtimeMinutes: game.playtime,
    imageUrl: game.image,
    // Add some mock price data for consistency
    price: Math.floor(Math.random() * 60) + 5, // Random price between $5-$65
    releaseDate: null
  }));
  
  return {
    ...demoData,
    gamesList
  };
};

/**
 * Custom hook to provide unplayed game data, either from real API calls or demo data
 */
export const useUnplayedData = () => {
  const { user } = useAuth();
  const { isDemo, demoData } = useDemoMode();
  
  // Query for real data when authenticated and not in demo mode
  const { 
    data: userGamesData, 
    isLoading: isLoadingUserGames, 
    error: userGamesError 
  } = useQuery({
    queryKey: ['unplayedData', user?.id, isDemo],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      // Fetch user games data from Supabase
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
        .eq('user_id', user.id);
      
      if (userGamesError) throw userGamesError;

      return userGamesData;
    },
    enabled: !!user && !isDemo,
  });

  // Query for game time estimates when authenticated and not in demo mode
  const {
    data: gameEstimatesData,
    isLoading: isLoadingEstimates,
  } = useQuery({
    queryKey: ['gameEstimates', userGamesData, isDemo],
    queryFn: async () => {
      if (!userGamesData || userGamesData.length === 0) return {};
      
      // Get all game_ids from the user's library
      const gameIds = userGamesData.map(game => game.game_id);
      
      // Fetch game estimates data from Supabase
      const { data: estimatesData, error: estimatesError } = await supabase
        .from('game_estimates')
        .select('*')
        .in('game_id', gameIds);
      
      if (estimatesError) throw estimatesError;
      
      // Convert to a map for easier lookup
      const estimatesMap = {};
      estimatesData?.forEach(estimate => {
        estimatesMap[estimate.game_id] = estimate;
      });
      
      return estimatesMap;
    },
    enabled: !!userGamesData && userGamesData.length > 0 && !!user && !isDemo,
  });
  
  // Combine the loading states
  const isLoading = isLoadingUserGames || isLoadingEstimates;
  const error = userGamesError;

  // If in demo mode or while loading, return normalized demo data
  if (isDemo) {
    return {
      data: normalizeDemoGames(demoData),
      isLoading: false,
      error: null
    };
  }
  
  // Transform real data if available, otherwise fall back to normalized demo data during loading
  const data = userGamesData 
    ? transformUserGameData(userGamesData, gameEstimatesData || {}) 
    : normalizeDemoGames(demoData);

  return {
    data,
    isLoading,
    error
  };
};

export default useUnplayedData;
