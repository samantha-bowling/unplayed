
import { useUnplayedData } from '@/hooks/use-unplayed-data';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';
import { supabase } from '@/integrations/supabase/client';
import { UnplayedDataType, DustScoreBreakdown, GameDustData } from '@/types/unplayed-data.types';

/**
 * Custom hook to provide detailed dust score data
 */
const useDustScoreData = () => {
  const { user } = useAuth();
  const { isDemo, demoData } = useDemoMode();
  const { data: basicData, isLoading: isBasicDataLoading, error: basicDataError } = useUnplayedData();
  
  // Query for detailed dust data when not in demo mode
  const { 
    data: detailedDustData, 
    isLoading: isDetailedDataLoading, 
    error: detailedDataError 
  } = useQuery({
    queryKey: ['detailedDustData', user?.id, isDemo],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      // Fetch user games with dust scores from Supabase
      const { data: userGamesWithDust, error } = await supabase
        .from('user_games')
        .select(`
          id,
          game_id,
          playtime_minutes,
          acquisition_date,
          last_played_date,
          dust_score,
          games:game_id(
            id, 
            name, 
            image_url,
            header_image,
            release_date
          )
        `)
        .eq('user_id', user.id)
        .order('dust_score', { ascending: false });
      
      if (error) throw error;
      
      if (!userGamesWithDust || userGamesWithDust.length === 0) {
        return {
          dustScoreBreakdown: { ageScore: 0, ownershipScore: 0, playtimeFactor: 0 },
          topDustContributors: [],
          avgDustScore: 0
        };
      }
      
      // Calculate average dust score
      const totalDustScore = userGamesWithDust.reduce((sum, game) => 
        sum + (game.dust_score || 0), 0);
      const avgDustScore = userGamesWithDust.length > 0 
        ? parseFloat((totalDustScore / userGamesWithDust.length).toFixed(1)) 
        : 0;
      
      // Extract top dust contributors
      const topContributors: GameDustData[] = userGamesWithDust
        .filter(game => game.dust_score && game.dust_score > 0)
        .slice(0, 20)
        .map(game => ({
          id: game.game_id,
          title: game.games?.name || 'Unknown Game',
          dustScore: game.dust_score || 0,
          addedDate: game.acquisition_date || new Date().toISOString(),
          releaseDate: game.games?.release_date || null,
          playtimeMinutes: game.playtime_minutes || 0,
          imageUrl: game.games?.header_image || game.games?.image_url || null
        }));
      
      // For the demo breakdown, we'll estimate the composition based on the PostgreSQL function
      // In a real implementation, we'd need to fetch these values from the database
      // This is a simplified estimate based on the algorithm
      const totalScore = totalDustScore;
      const estimatedAgeScore = Math.round(totalScore * 0.15); // ~15% from game age
      const estimatedOwnershipScore = Math.round(totalScore * 0.65); // ~65% from ownership time
      const estimatedPlaytimeFactor = 1.0; // Average multiplier for all games
      
      return {
        dustScoreBreakdown: {
          ageScore: estimatedAgeScore,
          ownershipScore: estimatedOwnershipScore,
          playtimeFactor: estimatedPlaytimeFactor
        },
        topDustContributors: topContributors,
        avgDustScore
      };
    },
    enabled: !!user && !isDemo,
  });
  
  const isLoading = isBasicDataLoading || isDetailedDataLoading;
  const error = basicDataError || detailedDataError;
  
  // Demo data with mocked dust breakdown
  const demoDustBreakdown: DustScoreBreakdown = {
    ageScore: 45, // Age contributes about 45 points
    ownershipScore: 180, // Ownership time contributes about 180 points
    playtimeFactor: 1.0, // Full factor because games are unplayed
  };
  
  // Demo top dust contributors
  const demoTopContributors: GameDustData[] = demoData.library.map((game, index) => ({
    id: game.id,
    title: game.title,
    dustScore: 95 - index * 5, // Decreasing scores for demo
    addedDate: new Date(Date.now() - (index + 1) * 30 * 24 * 60 * 60 * 1000).toISOString(), // Staggered dates
    releaseDate: new Date(Date.now() - (index + 5) * 90 * 24 * 60 * 60 * 1000).toISOString(), // Earlier release dates
    playtimeMinutes: 0,
    imageUrl: game.image
  }));
  
  // If in demo mode, return demo data enhanced with dust details
  if (isDemo) {
    const enhancedDemoData: UnplayedDataType = {
      ...demoData,
      dustScoreBreakdown: demoDustBreakdown,
      topDustContributors: demoTopContributors,
      avgDustScore: 29.7 // Fixed average for demo mode
    };
    
    return {
      data: enhancedDemoData,
      isLoading: false,
      error: null
    };
  }
  
  // Combine basic and detailed data for authenticated users
  const combinedData: UnplayedDataType = {
    ...basicData,
    ...(detailedDustData || {}),
  };
  
  return {
    data: combinedData,
    isLoading,
    error
  };
};

export default useDustScoreData;
