
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';
import { processShelfLife } from '@/utils/shelf-life-processing';
import { queryKeys } from '@/hooks/use-query-keys';

export interface UnifiedLibraryStats {
  // Raw database statistics (authoritative source)
  totalGamesInDB: number;
  unplayedGamesInDB: number;
  playedGamesInDB: number;
  totalDustScoreInDB: number;
  totalPlaytimeInDB: number;
  
  // Filtered display statistics (for components that need metadata filtering)
  totalGames: number;
  unplayedGames: number;
  playedGames: number;
  totalDustScore: number;
  totalPlaytime: number;
  
  // Additional metrics
  recentlyPlayedCount: number;
  metadataCompletionPercentage: number;
  shelfLife: any[];
}

export const useUnifiedLibraryData = () => {
  const { user } = useAuth();
  const { isDemo, demoData } = useDemoMode();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.unifiedLibraryData(user?.id),
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      console.log('useUnifiedLibraryData - Fetching unified library data for user:', user.id);

      const { data: userGames, error } = await supabase
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
            price_cents,
            genres,
            categories
          )
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error('useUnifiedLibraryData - Database error:', error);
        throw error;
      }

      if (!userGames) {
        console.log('useUnifiedLibraryData - No games found for user');
        return [];
      }

      console.log('useUnifiedLibraryData - Raw data received:', {
        totalRecords: userGames.length,
        sampleRecord: userGames[0] ? {
          id: userGames[0].id,
          game_id: userGames[0].game_id,
          playtime: userGames[0].playtime_minutes,
          hasGameData: !!userGames[0].games,
          gameName: userGames[0].games?.name
        } : null
      });

      return userGames;
    },
    enabled: !!user && !isDemo,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Calculate comprehensive statistics
  const stats: UnifiedLibraryStats | null = data ? (() => {
    // RAW DATABASE STATISTICS (authoritative source)
    const totalGamesInDB = data.length;
    const unplayedGamesInDB = data.filter(item => !item.playtime_minutes || item.playtime_minutes === 0).length;
    const playedGamesInDB = totalGamesInDB - unplayedGamesInDB;
    const totalDustScoreInDB = data.reduce((sum, item) => sum + (item.dust_score || 0), 0);
    const totalPlaytimeInDB = data.reduce((sum, item) => sum + (item.playtime_minutes || 0), 0);

    // FILTERED DISPLAY STATISTICS (games with complete metadata)
    const gamesWithMetadata = data.filter(item => item.games?.name);
    const totalGames = gamesWithMetadata.length;
    const unplayedGames = gamesWithMetadata.filter(item => !item.playtime_minutes || item.playtime_minutes === 0).length;
    const playedGames = totalGames - unplayedGames;
    const totalDustScore = gamesWithMetadata.reduce((sum, item) => sum + (item.dust_score || 0), 0);
    const totalPlaytime = gamesWithMetadata.reduce((sum, item) => sum + (item.playtime_minutes || 0), 0);

    // Recently played count
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentlyPlayedCount = data.filter(item => {
      if (!item.last_played_date) return false;
      const lastPlayed = new Date(item.last_played_date);
      return lastPlayed >= thirtyDaysAgo;
    }).length;

    // Metadata completion percentage
    const metadataCompletionPercentage = totalGamesInDB > 0 ? 
      (gamesWithMetadata.length / totalGamesInDB) * 100 : 0;

    // Process shelf life data
    const unplayedItems = data.filter(item => (!item.playtime_minutes || item.playtime_minutes === 0) && item.games?.name);
    const shelfLife = processShelfLife(unplayedItems);

    const calculatedStats = {
      // Raw database statistics (authoritative)
      totalGamesInDB,
      unplayedGamesInDB,
      playedGamesInDB,
      totalDustScoreInDB,
      totalPlaytimeInDB,
      
      // Filtered display statistics
      totalGames,
      unplayedGames,
      playedGames,
      totalDustScore,
      totalPlaytime,
      
      // Additional metrics
      recentlyPlayedCount,
      metadataCompletionPercentage,
      shelfLife
    };

    console.log('useUnifiedLibraryData - Calculated comprehensive stats:', {
      rawDB: {
        totalGames: totalGamesInDB,
        unplayed: unplayedGamesInDB,
        dustScore: totalDustScoreInDB,
        playtime: totalPlaytimeInDB
      },
      filtered: {
        totalGames,
        unplayed: unplayedGames,
        dustScore: totalDustScore,
        playtime: totalPlaytime
      },
      metadata: {
        completionPercentage: metadataCompletionPercentage.toFixed(1) + '%',
        missingMetadata: totalGamesInDB - gamesWithMetadata.length
      },
      shelfLife: {
        totalItems: shelfLife.length,
        oldestGame: shelfLife[0]?.name || 'None'
      }
    });

    return calculatedStats;
  })() : null;

  // Handle demo mode
  if (isDemo) {
    const demoStats: UnifiedLibraryStats = {
      totalGamesInDB: demoData.library.length,
      unplayedGamesInDB: demoData.library.filter(game => game.playtime === 0).length,
      playedGamesInDB: demoData.library.filter(game => game.playtime > 0).length,
      totalDustScoreInDB: demoData.library.reduce((sum, game) => sum + (game.dustScore || 0), 0),
      totalPlaytimeInDB: demoData.library.reduce((sum, game) => sum + game.playtime, 0),
      totalGames: demoData.library.length,
      unplayedGames: demoData.library.filter(game => game.playtime === 0).length,
      playedGames: demoData.library.filter(game => game.playtime > 0).length,
      totalDustScore: demoData.library.reduce((sum, game) => sum + (game.dustScore || 0), 0),
      totalPlaytime: demoData.library.reduce((sum, game) => sum + game.playtime, 0),
      recentlyPlayedCount: 3,
      metadataCompletionPercentage: 100,
      shelfLife: demoData.library.filter(game => game.playtime === 0).slice(0, 10)
    };

    return {
      data: demoData.library.map(game => ({
        id: `demo-${game.id}`,
        game_id: game.id,
        playtime_minutes: game.playtime,
        hidden: false,
        dust_score: game.dustScore || 0,
        last_played_date: null,
        acquisition_date: null,
        notes: null,
        games: {
          id: game.id,
          name: game.name,
          image_url: game.image,
          header_image: game.image,
          release_date: null,
          metacritic_score: null,
          price_cents: null,
          genres: [],
          categories: []
        }
      })),
      stats: demoStats,
      isLoading: false,
      error: null,
      refetch: async () => demoData.library
    };
  }

  return {
    data: data || [],
    stats,
    isLoading,
    error,
    refetch
  };
};
