
import { useMemo } from 'react';
import { useUnifiedLibraryData } from '@/hooks/useUnifiedLibraryData';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  UnplayedDataType, 
  GameDustData
} from '@/types/unplayed-data.types';
import { queryKeys } from '@/hooks/use-query-keys';
import { 
  CLEAN_SCORE_TIERS, 
  calculateCleanScore 
} from '@/utils/clean-score-utils';

const useDustScoreData = () => {
  const { user } = useAuth();
  const { isDemo, demoData } = useDemoMode();

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
          unplayedGames: 0,
          totalGames: 0,
          dustScore: 0,
          totalPlaytime: 0,
          totalSpent: 0,
          unplayedSpent: 0,
          potentialGameplayHours: 0,
          gamesList: [],
          library: [],
          shelfLife: [],
          genres: [],
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
          recentlyPlayedCount: 0,
          cleanStreakMetadata: {
            gracePeriodUsed: false,
            streakQuality: 'bronze' as const
          }
        } as UnplayedDataType;
      }

      // Calculate basic metrics
      const totalGames = userGamesWithDust.length;
      const playedGames = userGamesWithDust.filter(game => (game.playtime_minutes || 0) > 0).length;
      const unplayedGameCount = totalGames - playedGames;
      
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

      const totalDustScore = userGamesWithDust.reduce((sum, game) => sum + (game.dust_score || 0), 0);
      const avgDustScore = totalGames > 0 ? parseFloat((totalDustScore / totalGames).toFixed(1)) : 0;

      // Calculate clean score
      const gamesList = userGamesWithDust.map(game => ({
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

      const { cleanScore, breakdown: cleanScoreBreakdown, tier: cleanTier, cleanStreak, streakMetadata } =
        calculateCleanScore(playedGames, totalGames, totalPlaytimeHours, gamesList, recentlyPlayedCount);

      // Process top contributors
      const topContributors: GameDustData[] = userGamesWithDust
        .filter(game => game.dust_score && game.dust_score > 0)
        .slice(0, 20)
        .map(game => ({
          id: game.game_id,
          name: game.games?.name || 'Unknown Game',
          dustScore: game.dust_score || 0,
          addedDate: game.acquisition_date || new Date().toISOString(),
          releaseDate: game.games?.release_date || null,
          playtimeMinutes: game.playtime_minutes || 0,
          image: game.games?.header_image || game.games?.image_url || null,
          breakdown: {
            qualityScore: 15,
            priceScore: 15,
            ageScore: 15,
            genreScore: 10,
            playtimeFactor: 0.85
          }
        }));

      return {
        unplayedGames: unplayedGameCount,
        totalGames: totalGames,
        dustScore: totalDustScore,
        totalPlaytime: totalPlaytimeHours,
        totalSpent: 0,
        unplayedSpent: 0,
        potentialGameplayHours: 0,
        gamesList: gamesList,
        library: [],
        shelfLife: [],
        genres: [],
        dustScoreBreakdown: {
          qualityScore: 12,
          priceScore: 18,
          ageScore: 15,
          genreScore: 10,
          playtimeFactor: 0.85
        },
        topDustContributors: topContributors,
        avgDustScore: avgDustScore,
        cleanScore: cleanScore,
        cleanScoreBreakdown: cleanScoreBreakdown,
        cleanTier: cleanTier,
        cleanStreak: cleanStreak,
        recentlyPlayedCount: recentlyPlayedCount,
        cleanStreakMetadata: streakMetadata || {
          gracePeriodUsed: false,
          streakQuality: 'bronze' as const
        }
      } as UnplayedDataType;
    },
    enabled: !!user && !isDemo,
  });

  // Simple demo mode - hardcoded values that match UnplayedDataType
  if (isDemo) {
    const simpleDemoData: UnplayedDataType = {
      unplayedGames: 15,
      totalGames: 25,
      dustScore: 595,
      totalPlaytime: 120,
      totalSpent: 450,
      unplayedSpent: 280,
      potentialGameplayHours: 800,
      gamesList: [],
      library: demoData.library,
      shelfLife: [],
      genres: [],
      dustScoreBreakdown: {
        qualityScore: 12,
        priceScore: 18,
        ageScore: 15,
        genreScore: 10,
        playtimeFactor: 0.85
      },
      topDustContributors: [],
      avgDustScore: 29.7,
      cleanScore: 68,
      cleanScoreBreakdown: {
        completionRate: 75,
        engagementFactor: 60,
        recencyFactor: 65
      },
      cleanTier: CLEAN_SCORE_TIERS[2],
      cleanStreak: 4,
      recentlyPlayedCount: 5,
      cleanStreakMetadata: {
        gracePeriodUsed: false,
        streakQuality: 'silver'
      }
    };

    return {
      data: simpleDemoData,
      isLoading: false,
      error: null,
      refetch: async () => simpleDemoData
    };
  }

  return {
    data: detailedDustData,
    isLoading: isDetailedDataLoading,
    error: detailedDataError,
    refetch: refetchDetailedData
  };
};

export default useDustScoreData;
