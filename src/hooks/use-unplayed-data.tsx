
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';
import { DemoDataType } from '@/lib/demo-data';

// Export the data type so components can use it for typing props
export type UnplayedDataType = DemoDataType;

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

  // If in demo mode or while loading, return demo data
  if (isDemo) {
    return {
      data: demoData,
      isLoading: false,
      error: null
    };
  }
  
  // Transform real data if available, otherwise fall back to demo data during loading
  const data = userGamesData 
    ? transformUserGameData(userGamesData, gameEstimatesData || {}) 
    : demoData;

  return {
    data,
    isLoading,
    error
  };
};

/**
 * Transforms Supabase data to match the DemoDataType structure
 * Now with HLTB data integration
 */
const transformUserGameData = (data: any[], estimatesMap: Record<string, any>): UnplayedDataType => {
  if (!data || data.length === 0) {
    // Return empty data structure if no data
    return {
      unplayedGames: 0,
      totalGames: 0,
      dustScore: 0,
      totalPlaytime: 0,
      totalSpent: 0,
      potentialGameplayHours: 0, // Added to match DemoDataType
      genres: [],
      shelfLife: [],
      library: []
    };
  }

  // Calculate unplayed games
  const unplayedGames = data.filter(item => !item.playtime_minutes || item.playtime_minutes === 0).length;
  
  // Calculate total playtime (convert minutes to hours)
  const totalPlaytime = data.reduce((sum, item) => sum + (item.playtime_minutes || 0), 0) / 60;
  
  // Calculate total spent based on price_cents (if available)
  const totalSpent = data.reduce((sum, item) => {
    const priceCents = item.games?.price_cents || 0;
    return sum + (priceCents / 100);
  }, 0);

  // Extract dust score (use highest if multiple)
  const dustScore = data.reduce((highest, item) => 
    Math.max(highest, item.dust_score || 0), 0);
  
  // Calculate total potential gameplay hours using HLTB data with fallback
  const potentialGameplayHours = data
    .filter(item => !item.playtime_minutes || item.playtime_minutes === 0)
    .reduce((sum, item) => {
      const estimate = estimatesMap[item.game_id];
      // Use main_hours if available, otherwise fall back to 12.5 hours
      const gameHours = estimate?.main_hours || 12.5;
      return sum + gameHours;
    }, 0);
  
  // Create genre aggregation
  const genreCounts = new Map<string, number>();
  const genreColors = [
    '#A3F7BF', '#EF5DFF', '#FFD866', '#FF3C38', '#61DAFB', '#6C757D'
  ];
  
  // Count genres
  data.forEach(item => {
    if (item.games?.genres) {
      item.games.genres.forEach((genre: string) => {
        genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1);
      });
    }
  });
  
  // Convert to genre data structure
  const genres = Array.from(genreCounts.entries())
    .sort((a, b) => b[1] - a[1]) // Sort by count descending
    .slice(0, 5) // Take top 5 genres
    .map(([name, value], index) => ({
      name,
      value,
      color: genreColors[index % genreColors.length]
    }));
  
  // Add "Other" category if there are more genres
  if (genreCounts.size > 5) {
    const otherCount = Array.from(genreCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(5)
      .reduce((sum, [_, count]) => sum + count, 0);
    
    genres.push({
      name: 'Other',
      value: otherCount,
      color: genreColors[5]
    });
  }
  
  // Create shelf life data (oldest unplayed games)
  const shelfLife = data
    .filter(item => !item.playtime_minutes || item.playtime_minutes === 0)
    .sort((a, b) => {
      const dateA = new Date(a.acquisition_date || '').getTime();
      const dateB = new Date(b.acquisition_date || '').getTime();
      return dateA - dateB; // Sort by date ascending (oldest first)
    })
    .slice(0, 5) // Take oldest 5
    .map(item => ({
      id: item.game_id,
      title: item.games?.name || 'Unknown Game',
      addedDate: item.acquisition_date || new Date().toISOString(),
      imageUrl: item.games?.image_url || item.games?.header_image || 'https://placehold.co/600x400?text=No+Image'
    }));
  
  // Create library data
  const library = data
    .filter(item => !item.hidden) // Filter out hidden games
    .sort(() => Math.random() - 0.5) // Randomize for demo-like experience
    .slice(0, 8) // Take 8 random games
    .map(item => ({
      id: item.game_id,
      title: item.games?.name || 'Unknown Game',
      image: item.games?.header_image || 'https://placehold.co/600x400?text=No+Image',
      playtime: item.playtime_minutes || 0
    }));
  
  return {
    unplayedGames,
    totalGames: data.length,
    dustScore,
    totalPlaytime,
    totalSpent,
    potentialGameplayHours, // Now properly including the HLTB data
    genres,
    shelfLife,
    library
  };
};

export default useUnplayedData;
