
import { useUnplayedData } from '@/hooks/useUnplayedData';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  UnplayedDataType, 
  DustScoreBreakdown, 
  GameDustData, 
  GameListItem, 
  LegacyCleanScoreBreakdown,
  CleanScoreTier,
  DustScoreBreakdownResponse
} from '@/types/unplayed-data.types';
import { DustScoreData, DustScoreCalculationResponse } from '@/types/dust-score-data.types';
import { normalizeDemoGames } from '@/utils/normalize-games';
import { queryKeys } from '@/hooks/use-query-keys';
import { safeGetNumber } from '@/utils/safe-json';
import { 
  processDustBreakdown, 
  processDustBreakdowns 
} from '@/utils/dust-score-utils';
import { 
  CLEAN_SCORE_TIERS, 
  calculateCleanScore 
} from '@/utils/clean-score-utils';

const parseDustBreakdown = (breakdown: unknown): DustScoreBreakdownResponse => {
  const processed = processDustBreakdown(breakdown);
  return {
    qualityScore: processed.qualityScore,
    priceScore: processed.priceScore,
    ageScore: processed.ageScore,
    genreScore: processed.genreScore,
    playtimeFactor: processed.playtimeFactor,
    totalScore: processed.totalScore
  };
};

const useDustScoreData = (): DustScoreCalculationResponse => {
  const { user } = useAuth();
  const { isDemo, demoData } = useDemoMode();
  const { 
    data: basicData, 
    isLoading: isBasicDataLoading, 
    error: basicDataError,
    refetch: refetchBasicData 
  } = useUnplayedData();

  const { 
    data: detailedDustData, 
    isLoading: isDetailedDataLoading, 
    error: detailedDataError,
    refetch: refetchDetailedData
  } = useQuery({
    queryKey: queryKeys.detailedDustData(user?.id),
    queryFn: async (): Promise<Partial<DustScoreData>> => {
      if (!user) throw new Error('User not authenticated');

      console.log('Fetching enhanced dust data with 5-factor breakdown for user:', user.id);
      
      // First get the detailed breakdowns from our new table
      const { data: dustBreakdowns, error: breakdownError } = await supabase
        .from('game_dust_breakdowns')
        .select('*')
        .eq('user_id', user.id)
        .order('current_dust_score', { ascending: false });

      if (breakdownError) {
        console.error('Error fetching dust breakdowns:', breakdownError);
        // Don't throw - fallback to user_games query
      }

      // Get user games with dust scores
      const { data: userGamesData, error: userGamesError } = await supabase
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
            release_date,
            metacritic_score,
            price_cents,
            genres
          )
        `)
        .eq('user_id', user.id)
        .order('dust_score', { ascending: false });

      if (userGamesError) throw userGamesError;

      if (!userGamesData || userGamesData.length === 0) {
        return {
          dustScoreBreakdown: { 
            qualityScore: 10, 
            priceScore: 7, 
            ageScore: 15, 
            genreScore: 7, 
            playtimeFactor: 1.0 
          },
          topDustContributors: [],
          averageDustScore: 0,
          cleanScore: 0,
          legacyCleanScoreBreakdown: { completionRate: 0, engagementFactor: 0, recencyFactor: 0 },
          cleanTier: CLEAN_SCORE_TIERS[CLEAN_SCORE_TIERS.length - 1],
          cleanStreak: 0,
          recentlyPlayedCount: 0,
          totalGames: 0,
          unplayedGames: 0
        };
      }

      // Calculate dust metrics
      const totalDustScore = userGamesData.reduce((sum, game) =>
        sum + (game.dust_score || 0), 0);
      const avgDustScore = userGamesData.length > 0
        ? parseFloat((totalDustScore / userGamesData.length).toFixed(1))
        : 0;

      // Process top contributors using breakdowns if available, otherwise create fallback
      const topContributorsWithIds = userGamesData
        .filter(game => game.dust_score && game.dust_score > 0)
        .slice(0, 20);

      const topContributors: GameDustData[] = topContributorsWithIds.map((game) => {
        const gameData = game.games;
        
        // Try to find breakdown data, otherwise create fallback
        const breakdownData = dustBreakdowns?.find(bd => bd.game_id === game.game_id);
        
        let breakdown;
        if (breakdownData) {
          // Use database breakdown with new 5-factor system
          breakdown = {
            qualityScore: (breakdownData as any).quality_score || 10,
            priceScore: (breakdownData as any).price_score || breakdownData.ownership_score || 7,
            ageScore: breakdownData.age_score || 15,
            genreScore: (breakdownData as any).genre_score || 7,
            playtimeFactor: breakdownData.playtime_factor || 1.0
          };
        } else {
          // Create fallback breakdown using our graceful defaults
          const qualityScore = gameData?.metacritic_score ? 
            (gameData.metacritic_score >= 90 ? 20 : 
             gameData.metacritic_score >= 80 ? 17 : 
             gameData.metacritic_score >= 70 ? 14 : 
             gameData.metacritic_score >= 60 ? 10 : 6) : 10;
          
          const priceScore = gameData?.price_cents ? 
            (gameData.price_cents >= 6000 ? 15 : 
             gameData.price_cents >= 4000 ? 12 : 
             gameData.price_cents >= 2000 ? 10 : 
             gameData.price_cents >= 1000 ? 8 : 
             gameData.price_cents > 0 ? 5 : 2) : 7;
          
          const ageScore = gameData?.release_date ? 
            (new Date().getFullYear() - new Date(gameData.release_date).getFullYear() >= 15 ? 30 :
             new Date().getFullYear() - new Date(gameData.release_date).getFullYear() >= 10 ? 25 :
             new Date().getFullYear() - new Date(gameData.release_date).getFullYear() >= 5 ? 20 :
             new Date().getFullYear() - new Date(gameData.release_date).getFullYear() >= 2 ? 15 :
             new Date().getFullYear() - new Date(gameData.release_date).getFullYear() >= 1 ? 10 : 5) : 15;
          
          const genreScore = gameData?.genres?.length ? 
            (gameData.genres.some(g => ['Strategy', 'Simulation', 'RPG'].some(dusty => g.includes(dusty))) ? 10 :
             gameData.genres.some(g => ['Action', 'Arcade', 'Racing', 'Sports'].some(quick => g.includes(quick))) ? 5 : 7) : 7;
          
          const playtimeFactor = game.playtime_minutes === 0 ? 1.0 : 
                                game.playtime_minutes < 30 ? 0.9 :
                                game.playtime_minutes < 120 ? 0.6 :
                                game.playtime_minutes < 360 ? 0.3 : 0.1;
          
          breakdown = {
            qualityScore,
            priceScore,
            ageScore,
            genreScore,
            playtimeFactor
          };
        }
        
        return {
          id: game.game_id,
          name: gameData?.name || 'Unknown Game',
          dustScore: game.dust_score || 0,
          addedDate: game.acquisition_date || new Date().toISOString(),
          releaseDate: gameData?.release_date || null,
          playtimeMinutes: game.playtime_minutes || 0,
          image: gameData?.header_image || gameData?.image_url || null,
          breakdown
        };
      });

      // Calculate aggregate breakdown from all games for overview
      const aggregateBreakdown = topContributors.length > 0 ? {
        qualityScore: Math.round(topContributors.reduce((sum, game) => sum + game.breakdown.qualityScore, 0) / topContributors.length),
        priceScore: Math.round(topContributors.reduce((sum, game) => sum + game.breakdown.priceScore, 0) / topContributors.length),
        ageScore: Math.round(topContributors.reduce((sum, game) => sum + game.breakdown.ageScore, 0) / topContributors.length),
        genreScore: Math.round(topContributors.reduce((sum, game) => sum + game.breakdown.genreScore, 0) / topContributors.length),
        playtimeFactor: Number((topContributors.reduce((sum, game) => sum + game.breakdown.playtimeFactor, 0) / topContributors.length).toFixed(2))
      } : {
        qualityScore: 10,
        priceScore: 7,
        ageScore: 15,
        genreScore: 7,
        playtimeFactor: 1.0
      };

      // Calculate clean score metrics
      const totalGames = userGamesData.length;
      const playedGames = userGamesData.filter(game =>
        (game.playtime_minutes || 0) > 0
      ).length;
      const totalPlaytimeHours = userGamesData.reduce((sum, game) =>
        sum + ((game.playtime_minutes || 0) / 60), 0
      );

      // Count recently played games
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentlyPlayedCount = userGamesData.filter(game => {
        if (!game.last_played_date) return false;
        const lastPlayed = new Date(game.last_played_date);
        return lastPlayed >= thirtyDaysAgo;
      }).length;

      // Calculate clean score using our enhanced calculation
      const gamesList = userGamesData.map(game => ({
        id: game.game_id,
        name: game.games?.name || '',
        playtimeMinutes: game.playtime_minutes || 0,
        lastPlayed: game.last_played_date,
        added: game.acquisition_date,
        image: '',
        price: 0,
        genres: game.games?.genres || [],
        notes: null,
        hidden: false,
        releaseDate: game.games?.release_date,
        metacritic: game.games?.metacritic_score,
        categories: [],
        completionEstimate: null,
        mainStoryEstimate: null,
        averageEstimate: null,
        steamAppid: null,
        howLongToBeatId: null,
      }));

      const { cleanScore, breakdown: legacyCleanScoreBreakdown, tier: cleanTier, cleanStreak } =
        calculateCleanScore(playedGames, totalGames, totalPlaytimeHours, gamesList, recentlyPlayedCount);

      return {
        dustScoreBreakdown: aggregateBreakdown,
        topDustContributors: topContributors,
        averageDustScore: avgDustScore,
        cleanScore,
        legacyCleanScoreBreakdown,
        cleanTier,
        cleanStreak,
        recentlyPlayedCount,
        totalGames,
        unplayedGames: totalGames - playedGames
      };
    },
    enabled: !!user && !isDemo,
  });

  // Enhanced demo mode data preparation with 5-factor system
  const demoDustBreakdown: DustScoreBreakdown = {
    qualityScore: 15,  // Higher quality demo games
    priceScore: 12,    // Moderate price range
    ageScore: 18,      // Older games for demo
    genreScore: 8,     // Mixed genres
    playtimeFactor: 0.85
  };

  const demoTopContributors: GameDustData[] = demoData.library.map((game, index) => ({
    id: game.id,
    name: game.name,
    dustScore: 95 - index * 5,
    addedDate: new Date(Date.now() - (index + 1) * 30 * 24 * 60 * 60 * 1000).toISOString(),
    releaseDate: new Date(Date.now() - (index + 5) * 90 * 24 * 60 * 60 * 1000).toISOString(),
    playtimeMinutes: 0,
    image: game.image,
    breakdown: {
      qualityScore: Math.max(8, 20 - index * 2),  // Higher quality scores for top games
      priceScore: Math.max(5, 15 - index * 1),
      ageScore: Math.min(25, 15 + index * 1),
      genreScore: 6 + (index % 4) * 2,
      playtimeFactor: 1.0
    }
  }));

  const demoCleanScore = 68;
  const demoLegacyCleanScoreBreakdown: LegacyCleanScoreBreakdown = {
    completionRate: 75,
    engagementFactor: 60,
    recencyFactor: 65
  };
  const demoCleanTier = CLEAN_SCORE_TIERS.find(
    tier => demoCleanScore >= tier.range[0] && demoCleanScore <= tier.range[1]
  ) || CLEAN_SCORE_TIERS[2];

  if (isDemo) {
    const enhancedDemoData: DustScoreData = {
      dustScore: 595,
      dustScoreBreakdown: demoDustBreakdown,
      averageDustScore: 29.7,
      avgDustScore: 29.7,
      topDustContributors: demoTopContributors,
      cleanScore: 68,
      legacyCleanScoreBreakdown: {
        completionRate: 75,
        engagementFactor: 60,
        recencyFactor: 65
      },
      cleanTier: CLEAN_SCORE_TIERS.find(
        tier => 68 >= tier.range[0] && 68 <= tier.range[1]
      ) || CLEAN_SCORE_TIERS[2],
      cleanStreak: 4,
      recentlyPlayedCount: 5,
      totalGames: 150,
      unplayedGames: 100,
      recentlyPlayedUnplayed: 3
    };

    return {
      data: enhancedDemoData,
      isLoading: false,
      error: null,
      refetch: async () => enhancedDemoData
    };
  }

  // Combine basic data with detailed dust data
  const combinedData: DustScoreData = {
    dustScore: basicData?.dustScore || 0,
    dustScoreBreakdown: detailedDustData?.dustScoreBreakdown || {
      qualityScore: 10,
      priceScore: 7,
      ageScore: 15,
      genreScore: 7,
      playtimeFactor: 1.0
    },
    averageDustScore: detailedDustData?.averageDustScore || 0,
    avgDustScore: detailedDustData?.averageDustScore || 0,
    topDustContributors: detailedDustData?.topDustContributors || [],
    cleanScore: basicData?.cleanScore || detailedDustData?.cleanScore || 0,
    legacyCleanScoreBreakdown: detailedDustData?.legacyCleanScoreBreakdown || {
      completionRate: 0,
      engagementFactor: 0,
      recencyFactor: 0
    },
    cleanTier: basicData?.cleanTier || detailedDustData?.cleanTier || CLEAN_SCORE_TIERS[CLEAN_SCORE_TIERS.length - 1],
    cleanStreak: detailedDustData?.cleanStreak || 0,
    cleanStreakMetadata: detailedDustData?.cleanStreakMetadata,
    totalGames: basicData?.totalGames || detailedDustData?.totalGames || 0,
    unplayedGames: basicData?.unplayedGames || detailedDustData?.unplayedGames || 0,
    recentlyPlayedCount: detailedDustData?.recentlyPlayedCount || 0,
    recentlyPlayedUnplayed: basicData?.recentlyPlayedUnplayed || detailedDustData?.recentlyPlayedUnplayed
  };

  return {
    data: combinedData,
    isLoading: isBasicDataLoading || isDetailedDataLoading,
    error: basicDataError || detailedDataError,
    refetch: async () => {
      if (refetchBasicData) await refetchBasicData();
      if (refetchDetailedData) await refetchDetailedData();
      return combinedData;
    }
  };
};

export default useDustScoreData;
