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
  CleanScoreTier,
  DustScoreBreakdownResponse
} from '@/types/unplayed-data.types';
import { normalizeDemoGames } from '@/utils/normalize-games';
import { queryKeys } from '@/hooks/use-query-keys';

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
 * Safely parses dust score breakdown from JSON response
 * @param breakdown The raw response from the Supabase function
 * @returns A properly typed DustScoreBreakdown object with fallback values
 */
const parseDustBreakdown = (breakdown: unknown): DustScoreBreakdownResponse => {
  if (!breakdown || typeof breakdown !== 'object') {
    return {
      ageScore: 0,
      ownershipScore: 0,
      playtimeFactor: 1.0,
      totalScore: 0
    };
  }
  
  // Safe casting to allow property access
  const data = breakdown as Record<string, unknown>;
  
  // Safely extract values with type checking
  return {
    ageScore: typeof data.ageScore === 'number' ? data.ageScore : 0,
    ownershipScore: typeof data.ownershipScore === 'number' ? data.ownershipScore : 0,
    playtimeFactor: typeof data.playtimeFactor === 'number' ? data.playtimeFactor : 1.0,
    totalScore: typeof data.totalScore === 'number' ? data.totalScore : 0
  };
};

/**
 * Custom hook to provide detailed dust score data
 * @returns Object containing data, loading state, error, and refetch function
 */
const useDustScoreData = () => {
  const { user } = useAuth();
  const { isDemo, demoData } = useDemoMode();
  const { 
    data: basicData, 
    isLoading: isBasicDataLoading, 
    error: basicDataError,
    refetch: refetchBasicData 
  } = useUnplayedData();
  
  // Query for detailed dust data when not in demo mode
  const { 
    data: detailedDustData, 
    isLoading: isDetailedDataLoading, 
    error: detailedDataError,
    refetch: refetchDetailedData
  } = useQuery({
    queryKey: queryKeys.detailedDustData(user?.id),
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
      
      // Get dust breakdowns for top contributors
      const topContributorsWithIds = userGamesWithDust
        .filter(game => game.dust_score && game.dust_score > 0)
        .slice(0, 20);
        
      // Fetch dust breakdowns for top contributors using our new DB function
      const breakdownPromises = topContributorsWithIds.map(async (game) => {
        try {
          const { data: breakdown, error: breakdownError } = await supabase
            .rpc('get_user_game_dust_breakdown', { p_user_game_id: game.id });
            
          if (breakdownError) {
            console.error("Error fetching breakdown:", breakdownError);
            return null;
          }
          
          return breakdown;
        } catch (err) {
          console.error("Exception in breakdown fetch:", err);
          return null;
        }
      });
      
      const breakdowns = await Promise.all(breakdownPromises);
      
      // Calculate average dust score
      const totalDustScore = userGamesWithDust.reduce((sum, game) => 
        sum + (game.dust_score || 0), 0);
      const avgDustScore = userGamesWithDust.length > 0 
        ? parseFloat((totalDustScore / userGamesWithDust.length).toFixed(1)) 
        : 0;
      
      // Extract top dust contributors with safe parsing
      const topContributors: GameDustData[] = topContributorsWithIds
        .map((game, index) => {
          // Safely parse breakdown data
          const breakdownData = parseDustBreakdown(breakdowns[index]);
          
          return {
            id: game.game_id,
            name: game.games?.name || 'Unknown Game',
            dustScore: game.dust_score || 0,
            addedDate: game.acquisition_date || new Date().toISOString(),
            releaseDate: game.games?.release_date || null,
            playtimeMinutes: game.playtime_minutes || 0,
            image: game.games?.header_image || game.games?.image_url || null,
            breakdown: {
              ageScore: breakdownData.ageScore,
              ownershipScore: breakdownData.ownershipScore,
              playtimeFactor: breakdownData.playtimeFactor
            }
          };
        });
        
      // Calculate aggregate dust score breakdown with safe parsing
      let totalAgeScore = 0;
      let totalOwnershipScore = 0;
      let avgPlaytimeFactor = 0;
      
      const validBreakdowns = breakdowns.filter(Boolean);
      
      if (validBreakdowns.length > 0) {
        totalAgeScore = validBreakdowns.reduce((sum, b) => {
          const parsedData = parseDustBreakdown(b);
          return sum + parsedData.ageScore;
        }, 0);
        
        totalOwnershipScore = validBreakdowns.reduce((sum, b) => {
          const parsedData = parseDustBreakdown(b);
          return sum + parsedData.ownershipScore;
        }, 0);
        
        // Calculate weighted average playtime factor
        const totalFactorWeight = validBreakdowns.reduce((sum, b) => {
          const parsedData = parseDustBreakdown(b);
          return sum + parsedData.totalScore;
        }, 0);
        
        avgPlaytimeFactor = totalFactorWeight > 0 
          ? validBreakdowns.reduce((sum, b) => {
              const parsedData = parseDustBreakdown(b);
              return sum + (parsedData.playtimeFactor * parsedData.totalScore);
            }, 0) / totalFactorWeight
          : 1.0;
      } else {
        // Fallback if no breakdowns are available
        avgPlaytimeFactor = 1.0;
      }
      
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
          ageScore: totalAgeScore,
          ownershipScore: totalOwnershipScore,
          playtimeFactor: avgPlaytimeFactor
        },
        topDustContributors: topContributors,
        avgDustScore,
        cleanScore,
        cleanScoreBreakdown,
        cleanTier,
        cleanStreak,
        recentlyPlayedCount,
        totalGames,
        unplayedGames: totalGames - playedGames
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
    name: game.name,
    dustScore: 95 - index * 5, // Decreasing scores for demo
    addedDate: new Date(Date.now() - (index + 1) * 30 * 24 * 60 * 60 * 1000).toISOString(), // Staggered dates
    releaseDate: new Date(Date.now() - (index + 5) * 90 * 24 * 60 * 60 * 1000).toISOString(), // Earlier release dates
    playtimeMinutes: 0,
    image: game.image
  }));
  
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
      error: null,
      // Add a mock refetch function for consistency in demo mode
      refetch: () => Promise.resolve(enhancedDemoData)
    };
  }
  
  // Combine basic and detailed data for authenticated users
  const combinedData: UnplayedDataType = {
    ...basicData,
    ...(detailedDustData || {}),
  };
  
  // Create a combined refetch function that refreshes both queries
  const refetch = async () => {
    console.log('Refetching dust score data');
    // Start with refetching the basic data
    if (refetchBasicData) {
      await refetchBasicData();
    }
    
    // Then refetch the detailed data if available
    if (refetchDetailedData) {
      await refetchDetailedData();
    }
    
    // Return the combined data
    return combinedData;
  };
  
  return {
    data: isDemo 
      ? normalizeDemoGames(demoData) 
      : { ...basicData, ...detailedDustData },
    isLoading: isBasicDataLoading || isDetailedDataLoading,
    error: basicDataError || detailedDataError,
    refetch: async () => {
      if (refetchBasicData) await refetchBasicData();
      if (refetchDetailedData) await refetchDetailedData();
    }
  };
};

export default useDustScoreData;
