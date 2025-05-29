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
  CleanScoreBreakdown,
  CleanScoreTier,
  DustScoreBreakdownResponse
} from '@/types/unplayed-data.types';
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

const useDustScoreData = () => {
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
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

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
            release_date,
            metacritic_score,
            price_cents,
            genres
          )
        `)
        .eq('user_id', user.id)
        .order('dust_score', { ascending: false });

      if (error) throw error;

      if (!userGamesWithDust || userGamesWithDust.length === 0) {
        return {
          dustScoreBreakdown: { 
            qualityScore: 0, 
            priceScore: 0, 
            ageScore: 0, 
            genreScore: 0, 
            playtimeFactor: 0 
          },
          topDustContributors: [],
          avgDustScore: 0,
          cleanScore: 0,
          cleanScoreBreakdown: { completionRate: 0, engagementFactor: 0, recencyFactor: 0 },
          cleanTier: CLEAN_SCORE_TIERS[CLEAN_SCORE_TIERS.length - 1],
          cleanStreak: 0,
          recentlyPlayedCount: 0
        };
      }

      // Get top contributors
      const topContributorsWithIds = userGamesWithDust
        .filter(game => game.dust_score && game.dust_score > 0)
        .slice(0, 20);

      // For now, create mock breakdowns since we haven't implemented the new database function yet
      // This will be replaced with actual database calls once the new function is deployed
      const breakdowns = topContributorsWithIds.map((game) => {
        const gameData = game.games;
        const qualityScore = gameData?.metacritic_score ? 
          (gameData.metacritic_score >= 80 ? 8 : gameData.metacritic_score >= 60 ? 15 : 25) : 15;
        const priceScore = gameData?.price_cents ? 
          (gameData.price_cents >= 6000 ? 25 : gameData.price_cents >= 2000 ? 15 : 5) : 10;
        const ageScore = gameData?.release_date ? 
          (new Date().getFullYear() - new Date(gameData.release_date).getFullYear() >= 10 ? 20 : 10) : 10;
        const genreScore = gameData?.genres?.length ? 
          (gameData.genres.includes('Racing') || gameData.genres.includes('Sports') ? 15 : 10) : 10;
        const playtimeFactor = game.playtime_minutes === 0 ? 1.0 : 0.3;
        
        return {
          qualityScore,
          priceScore,
          ageScore,
          genreScore,
          playtimeFactor,
          totalScore: Math.round((qualityScore + priceScore + ageScore + genreScore) * playtimeFactor)
        };
      });

      // Calculate dust metrics
      const totalDustScore = userGamesWithDust.reduce((sum, game) =>
        sum + (game.dust_score || 0), 0);
      const avgDustScore = userGamesWithDust.length > 0
        ? parseFloat((totalDustScore / userGamesWithDust.length).toFixed(1))
        : 0;

      // Process contributors with type-safe breakdown handling
      const topContributors: GameDustData[] = topContributorsWithIds.map((game, index) => {
        const breakdownData = breakdowns[index];
        return {
          id: game.game_id,
          name: game.games?.name || 'Unknown Game',
          dustScore: game.dust_score || 0,
          addedDate: game.acquisition_date || new Date().toISOString(),
          releaseDate: game.games?.release_date || null,
          playtimeMinutes: game.playtime_minutes || 0,
          image: game.games?.header_image || game.games?.image_url || null,
          breakdown: {
            qualityScore: breakdownData.qualityScore,
            priceScore: breakdownData.priceScore,
            ageScore: breakdownData.ageScore,
            genreScore: breakdownData.genreScore,
            playtimeFactor: breakdownData.playtimeFactor
          }
        };
      });

      // Process dust breakdowns with our type-safe utility
      const { 
        totalQualityScore, 
        totalPriceScore, 
        totalAgeScore, 
        totalGenreScore, 
        avgPlaytimeFactor 
      } = processDustBreakdowns(breakdowns);

      // Calculate clean score metrics
      const totalGames = userGamesWithDust.length;
      const playedGames = userGamesWithDust.filter(game =>
        (game.playtime_minutes || 0) > 0
      ).length;
      const totalPlaytimeHours = userGamesWithDust.reduce((sum, game) =>
        sum + ((game.playtime_minutes || 0) / 60), 0
      );

      // Count recently played games
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentlyPlayedCount = userGamesWithDust.filter(game => {
        if (!game.last_played_date) return false;
        const lastPlayed = new Date(game.last_played_date);
        return lastPlayed >= thirtyDaysAgo;
      }).length;

      // Generate a random clean streak (1-7) for now
      const cleanStreak = Math.min(7, Math.max(1, Math.floor(Math.random() * 7) + 1));

      // Calculate clean score using our type-safe utility
      const { cleanScore, breakdown: cleanScoreBreakdown, tier: cleanTier, cleanStreak } =
        calculateCleanScore(playedGames, totalGames, totalPlaytimeHours, userGamesWithDust, recentlyPlayedCount);

      return {
        dustScoreBreakdown: {
          qualityScore: totalQualityScore,
          priceScore: totalPriceScore,
          ageScore: totalAgeScore,
          genreScore: totalGenreScore,
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

  // Enhanced demo mode data preparation with new 5-factor system
  const demoDustBreakdown: DustScoreBreakdown = {
    qualityScore: 12,    // Average quality across library
    priceScore: 18,      // Mix of pricing tiers
    ageScore: 15,        // Mix of old and new games
    genreScore: 10,      // Common genres mostly
    playtimeFactor: 0.85 // Some games played
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
      qualityScore: Math.max(5, 25 - index * 3),
      priceScore: Math.max(5, 20 - index * 2),
      ageScore: Math.min(25, 10 + index * 2),
      genreScore: 8 + (index % 3) * 2,
      playtimeFactor: 1.0
    }
  }));

  const demoCleanScore = 68;
  const demoCleanScoreBreakdown: CleanScoreBreakdown = {
    completionRate: 75,
    engagementFactor: 60,
    recencyFactor: 65
  };
  const demoCleanTier = CLEAN_SCORE_TIERS.find(
    tier => demoCleanScore >= tier.range[0] && demoCleanScore <= tier.range[1]
  ) || CLEAN_SCORE_TIERS[2];

  if (isDemo) {
    const normalizedDemoData = normalizeDemoGames(demoData);
    const enhancedDemoData: UnplayedDataType = {
      ...normalizedDemoData,
      dustScoreBreakdown: demoDustBreakdown,
      topDustContributors: demoTopContributors,
      avgDustScore: 29.7,
      cleanScore: demoCleanScore,
      cleanScoreBreakdown: demoCleanScoreBreakdown,
      cleanTier: demoCleanTier,
      cleanStreak: 4,
      recentlyPlayedCount: 5
    };

    return {
      data: enhancedDemoData,
      isLoading: false,
      error: null,
      refetch: () => Promise.resolve(enhancedDemoData)
    };
  }

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
