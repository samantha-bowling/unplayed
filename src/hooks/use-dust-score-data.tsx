
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
import { safeGetNumber } from '@/utils/safe-json';
import { 
  CLEAN_SCORE_TIERS, 
  calculateCleanScore, 
  processDustBreakdown, 
  processDustBreakdowns 
} from '@/utils/dust-score-utils';

const parseDustBreakdown = (breakdown: unknown): DustScoreBreakdownResponse => {
  const processed = processDustBreakdown(breakdown);
  return {
    ageScore: processed.ageScore,
    ownershipScore: processed.ownershipScore,
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

      // Get top contributors
      const topContributorsWithIds = userGamesWithDust
        .filter(game => game.dust_score && game.dust_score > 0)
        .slice(0, 20);

      // Fetch breakdowns for top contributors
      const breakdowns = await Promise.all(
        topContributorsWithIds.map(async (game) => {
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
        })
      );

      // Calculate dust metrics
      const totalDustScore = userGamesWithDust.reduce((sum, game) =>
        sum + (game.dust_score || 0), 0);
      const avgDustScore = userGamesWithDust.length > 0
        ? parseFloat((totalDustScore / userGamesWithDust.length).toFixed(1))
        : 0;

      // Process contributors with type-safe breakdown handling
      const topContributors: GameDustData[] = topContributorsWithIds.map((game, index) => {
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

      // Process dust breakdowns with our type-safe utility
      const { totalAgeScore, totalOwnershipScore, avgPlaytimeFactor } = processDustBreakdowns(breakdowns);

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
      const { cleanScore, breakdown: cleanScoreBreakdown, tier: cleanTier } =
        calculateCleanScore(playedGames, totalGames, totalPlaytimeHours, 12.5, recentlyPlayedCount);

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

  // Demo mode data preparation
  const demoDustBreakdown: DustScoreBreakdown = {
    ageScore: 45,
    ownershipScore: 180,
    playtimeFactor: 1.0
  };

  const demoTopContributors: GameDustData[] = demoData.library.map((game, index) => ({
    id: game.id,
    name: game.name,
    dustScore: 95 - index * 5,
    addedDate: new Date(Date.now() - (index + 1) * 30 * 24 * 60 * 60 * 1000).toISOString(),
    releaseDate: new Date(Date.now() - (index + 5) * 90 * 24 * 60 * 60 * 1000).toISOString(),
    playtimeMinutes: 0,
    image: game.image
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
