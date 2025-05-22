
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

const CLEAN_SCORE_TIERS: CleanScoreTier[] = [
  { name: 'Pristine Collection', color: '#4ade80', range: [90, 100] },
  { name: 'Dust-Free Shelf', color: '#22d3ee', range: [75, 89] },
  { name: 'Reasonably Clean', color: '#60a5fa', range: [50, 74] },
  { name: 'Needs a Wipe', color: '#f59e0b', range: [25, 49] },
  { name: 'Filthy Casual', color: '#f87171', range: [0, 24] }
];

const calculateCleanScore = (
  playedGames: number, 
  totalGames: number,
  totalPlaytime: number,
  averageExpectedPlaytime: number = 12.5,
  recentlyPlayedGames: number
): { cleanScore: number, breakdown: CleanScoreBreakdown, tier: CleanScoreTier } => {
  if (totalGames < 5) {
    const smallLibraryBonus = 1.2;
    totalGames = Math.max(5, totalGames);
    playedGames = Math.min(playedGames * smallLibraryBonus, totalGames);
  }

  const completionRate = totalGames > 0 ? playedGames / totalGames : 0;
  let engagementFactor = 0;

  if (totalGames > 0) {
    const expectedTotalPlaytime = averageExpectedPlaytime * totalGames;
    engagementFactor = expectedTotalPlaytime > 0 
      ? Math.min(totalPlaytime / expectedTotalPlaytime, 1) 
      : 0;
  }

  const recencyFactor = totalGames > 0 ? Math.min(recentlyPlayedGames / totalGames, 1) : 0;

  const cleanScore = Math.round(
    (completionRate * 0.4 + engagementFactor * 0.3 + recencyFactor * 0.3) * 100
  );

  const tier = CLEAN_SCORE_TIERS.find(
    tier => cleanScore >= tier.range[0] && cleanScore <= tier.range[1]
  ) || CLEAN_SCORE_TIERS[CLEAN_SCORE_TIERS.length - 1];

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

const parseDustBreakdown = (breakdown: unknown): DustScoreBreakdownResponse => {
  return {
    ageScore: safeGetNumber(breakdown, 'ageScore', 0),
    ownershipScore: safeGetNumber(breakdown, 'ownershipScore', 0),
    playtimeFactor: safeGetNumber(breakdown, 'playtimeFactor', 1.0),
    totalScore: safeGetNumber(breakdown, 'totalScore', 0)
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

      const topContributorsWithIds = userGamesWithDust
        .filter(game => game.dust_score && game.dust_score > 0)
        .slice(0, 20);

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

      const totalDustScore = userGamesWithDust.reduce((sum, game) =>
        sum + (game.dust_score || 0), 0);
      const avgDustScore = userGamesWithDust.length > 0
        ? parseFloat((totalDustScore / userGamesWithDust.length).toFixed(1))
        : 0;

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

      // Initialize variables with explicit number type to avoid TypeScript errors
      let totalAgeScore: number = 0;
      let totalOwnershipScore: number = 0;
      let avgPlaytimeFactor: number = 1.0;
      const validBreakdowns = breakdowns.filter(Boolean);

      if (validBreakdowns.length > 0) {
        // Fix TypeScript errors in these reduce operations by adding explicit number type to the accumulator
        totalAgeScore = validBreakdowns.reduce((sum: number, b: unknown) => {
          const val = safeGetNumber(b, 'ageScore', 0);
          return sum + val;
        }, 0);

        totalOwnershipScore = validBreakdowns.reduce((sum: number, b: unknown) => {
          const val = safeGetNumber(b, 'ownershipScore', 0);
          return sum + val;
        }, 0);

        const totalFactorWeight = validBreakdowns.reduce((sum: number, b: unknown) => {
          const val = safeGetNumber(b, 'totalScore', 0);
          return sum + val;
        }, 0);

        avgPlaytimeFactor = totalFactorWeight > 0
          ? validBreakdowns.reduce((sum: number, b: unknown) => {
              const playtimeFactor = safeGetNumber(b, 'playtimeFactor', 1.0);
              const weight = safeGetNumber(b, 'totalScore', 0);
              return sum + (playtimeFactor * weight);
            }, 0) / totalFactorWeight
          : 1.0;
      }

      const totalGames = userGamesWithDust.length;
      const playedGames = userGamesWithDust.filter(game =>
        (game.playtime_minutes || 0) > 0
      ).length;
      const totalPlaytimeHours = userGamesWithDust.reduce((sum, game) =>
        sum + ((game.playtime_minutes || 0) / 60), 0
      );

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentlyPlayedCount = userGamesWithDust.filter(game => {
        if (!game.last_played_date) return false;
        const lastPlayed = new Date(game.last_played_date);
        return lastPlayed >= thirtyDaysAgo;
      }).length;

      const cleanStreak = Math.min(7, Math.max(1, Math.floor(Math.random() * 7) + 1));

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
