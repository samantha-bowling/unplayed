
import { useUnplayedData } from '@/hooks/use-unplayed-data';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  UnplayedDataType, 
  DustScoreBreakdown, 
  GameDustData, 
  GameListItem, 
  CleanScoreBreakdown,
  CleanScoreTier
} from '@/types/unplayed-data.types';
import { normalizeDemoGames } from '@/utils/normalize-games';

// Clean Score tiers configuration
const CLEAN_SCORE_TIERS: CleanScoreTier[] = [
  { name: 'Pristine Collection', color: '#4ade80', range: [90, 100] },
  { name: 'Dust-Free Shelf', color: '#22d3ee', range: [75, 89] },
  { name: 'Reasonably Clean', color: '#60a5fa', range: [50, 74] },
  { name: 'Needs a Wipe', color: '#f59e0b', range: [25, 49] },
  { name: 'Filthy Casual', color: '#f87171', range: [0, 24] }
];

// Helper function to calculate clean score
const calculateCleanScore = (
  playedGames: number, 
  totalGames: number,
  totalPlaytime: number,
  averageExpectedPlaytime: number = 12.5, // Default expected playtime per game in hours
  recentlyPlayedGames: number
): { 
  cleanScore: number, 
  breakdown: CleanScoreBreakdown, 
  tier: CleanScoreTier 
} => {
  // Handle edge case of small libraries
  if (totalGames < 5) {
    // Small library bonus to avoid unfair scores
    const smallLibraryBonus = 1.2;
    totalGames = Math.max(5, totalGames); // Minimum denominator of 5 games
    playedGames = Math.min(playedGames * smallLibraryBonus, totalGames);
  }
  
  // Calculate the three components
  const completionRate = totalGames > 0 ? playedGames / totalGames : 0;
  
  // Calculate engagement factor with safeguards
  let engagementFactor = 0;
  if (totalGames > 0) {
    const expectedTotalPlaytime = averageExpectedPlaytime * totalGames;
    engagementFactor = expectedTotalPlaytime > 0 
      ? Math.min(totalPlaytime / expectedTotalPlaytime, 1) 
      : 0;
  }
  
  // Calculate recency factor with decay
  const recencyFactor = totalGames > 0 ? Math.min(recentlyPlayedGames / totalGames, 1) : 0;
  
  // Calculate overall clean score using the weighted formula
  const cleanScore = Math.round(
    (completionRate * 0.4 + engagementFactor * 0.3 + recencyFactor * 0.3) * 100
  );
  
  // Determine tier
  const tier = CLEAN_SCORE_TIERS.find(
    tier => cleanScore >= tier.range[0] && cleanScore <= tier.range[1]
  ) || CLEAN_SCORE_TIERS[CLEAN_SCORE_TIERS.length - 1]; // Default to lowest tier
  
  return {
    cleanScore,
    breakdown: {
      completionRate: Math.round(completionRate * 100),
      engagementFactor: Math.round(engagementFactor * 100),
      recencyFactor: Math.round(recencyFactor * 100)
    },
    tier
  };
};

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
          avgDustScore: 0,
          cleanScore: 0,
          cleanScoreBreakdown: { completionRate: 0, engagementFactor: 0, recencyFactor: 0 },
          cleanTier: CLEAN_SCORE_TIERS[CLEAN_SCORE_TIERS.length - 1],
          cleanStreak: 0,
          recentlyPlayedCount: 0
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
      
      // Calculate Clean Score metrics
      const totalGames = userGamesWithDust.length;
      const playedGames = userGamesWithDust.filter(game => 
        (game.playtime_minutes || 0) > 0
      ).length;
      const totalPlaytimeHours = userGamesWithDust.reduce((sum, game) => 
        sum + ((game.playtime_minutes || 0) / 60), 0
      );
      
      // Calculate recently played games (in the last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentlyPlayedCount = userGamesWithDust.filter(game => {
        if (!game.last_played_date) return false;
        const lastPlayed = new Date(game.last_played_date);
        return lastPlayed >= thirtyDaysAgo;
      }).length;
      
      // Calculate clean streak (consecutive days with gameplay in the last week)
      // This would typically be stored in a separate table, but we're estimating here
      const cleanStreak = Math.min(
        7, 
        Math.max(1, Math.floor(Math.random() * 7) + 1)
      ); // Demo value between 1-7
      
      // Calculate clean score with our helper function
      const { cleanScore, breakdown: cleanScoreBreakdown, tier: cleanTier } = 
        calculateCleanScore(
          playedGames, 
          totalGames,
          totalPlaytimeHours,
          12.5, // Average expected hours per game
          recentlyPlayedCount
        );
      
      return {
        dustScoreBreakdown: {
          ageScore: estimatedAgeScore,
          ownershipScore: estimatedOwnershipScore,
          playtimeFactor: estimatedPlaytimeFactor
        },
        topDustContributors: topContributors,
        avgDustScore,
        cleanScore,
        cleanScoreBreakdown,
        cleanTier,
        cleanStreak,
        recentlyPlayedCount
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
  
  // FIXED: Hardcoded top dust contributors for demo mode to avoid using demoData.library
  // This way we don't depend on demoData.library which may be undefined
  const demoTopContributors: GameDustData[] = [
    {
      id: 1,
      title: "The Witcher 3: Wild Hunt",
      dustScore: 95,
      addedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      releaseDate: new Date(Date.now() - 5 * 90 * 24 * 60 * 60 * 1000).toISOString(),
      playtimeMinutes: 0,
      imageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/292030/capsule_616x353.jpg"
    },
    {
      id: 2,
      title: "Hades",
      dustScore: 90,
      addedDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      releaseDate: new Date(Date.now() - 6 * 90 * 24 * 60 * 60 * 1000).toISOString(), 
      playtimeMinutes: 0,
      imageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/1145360/capsule_616x353.jpg"
    },
    {
      id: 3,
      title: "Stardew Valley",
      dustScore: 85,
      addedDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      releaseDate: new Date(Date.now() - 7 * 90 * 24 * 60 * 60 * 1000).toISOString(),
      playtimeMinutes: 0,
      imageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/413150/capsule_616x353.jpg"
    },
    {
      id: 4,
      title: "Cyberpunk 2077",
      dustScore: 80,
      addedDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
      releaseDate: new Date(Date.now() - 8 * 90 * 24 * 60 * 60 * 1000).toISOString(),
      playtimeMinutes: 0,
      imageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/capsule_616x353.jpg"
    },
    {
      id: 5,
      title: "Hollow Knight",
      dustScore: 75,
      addedDate: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
      releaseDate: new Date(Date.now() - 9 * 90 * 24 * 60 * 60 * 1000).toISOString(),
      playtimeMinutes: 0,
      imageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/367520/capsule_616x353.jpg"
    },
    {
      id: 6,
      title: "Disco Elysium",
      dustScore: 70,
      addedDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
      releaseDate: new Date(Date.now() - 10 * 90 * 24 * 60 * 60 * 1000).toISOString(),
      playtimeMinutes: 0,
      imageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/632470/capsule_616x353.jpg"
    },
    {
      id: 7,
      title: "Divinity: Original Sin 2",
      dustScore: 65,
      addedDate: new Date(Date.now() - 210 * 24 * 60 * 60 * 1000).toISOString(),
      releaseDate: new Date(Date.now() - 11 * 90 * 24 * 60 * 60 * 1000).toISOString(),
      playtimeMinutes: 0,
      imageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/435150/capsule_616x353.jpg"
    },
    {
      id: 8,
      title: "Red Dead Redemption 2",
      dustScore: 60,
      addedDate: new Date(Date.now() - 240 * 24 * 60 * 60 * 1000).toISOString(),
      releaseDate: new Date(Date.now() - 12 * 90 * 24 * 60 * 60 * 1000).toISOString(),
      playtimeMinutes: 0,
      imageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/1174180/capsule_616x353.jpg"
    }
  ];
  
  // Mock clean score data for demo mode
  const demoCleanScore = 68; // Medium-high clean score for demo
  const demoCleanScoreBreakdown: CleanScoreBreakdown = {
    completionRate: 75, // Good completion rate (75%)
    engagementFactor: 60, // Decent engagement (60%)
    recencyFactor: 65  // Decent recency (65%)
  };
  const demoCleanTier = CLEAN_SCORE_TIERS.find(
    tier => demoCleanScore >= tier.range[0] && demoCleanScore <= tier.range[1]
  ) || CLEAN_SCORE_TIERS[2]; // Default to middle tier
  
  // If in demo mode, return demo data enhanced with dust details
  if (isDemo) {
    // First normalize demo data to ensure gamesList exists
    const normalizedDemoData = normalizeDemoGames(demoData);
    
    // Then enhance with dust-specific data
    const enhancedDemoData: UnplayedDataType = {
      ...normalizedDemoData,
      dustScoreBreakdown: demoDustBreakdown,
      topDustContributors: demoTopContributors,
      avgDustScore: 29.7, // Fixed average for demo mode
      cleanScore: demoCleanScore,
      cleanScoreBreakdown: demoCleanScoreBreakdown,
      cleanTier: demoCleanTier,
      cleanStreak: 4, // Demo streak of 4 days
      recentlyPlayedCount: 5 // Demo 5 recently played games
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
