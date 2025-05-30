
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';
import { useMemo } from 'react';
import { queryKeys } from './use-query-keys';

export interface UnifiedGameData {
  id: string;
  game_id: number;
  playtime_minutes: number | null;
  hidden: boolean | null;
  dust_score: number | null;
  last_played_date: string | null;
  acquisition_date: string | null;
  notes: string | null;
  games: {
    id: number;
    name: string;
    image_url: string | null;
    header_image: string | null;
    release_date: string | null;
    metacritic_score: number | null;
    genres: string[] | null;
    categories: string[] | null;
    price_cents: number | null;
  };
}

export interface UnifiedLibraryStats {
  totalGames: number;
  unplayedGames: number;
  playedGames: number;
  totalDustScore: number;
  totalPlaytime: number;
  recentlyPlayedCount: number;
  shelfLife?: any[];
}

/**
 * Unified hook that provides consistent game data across all components
 * This ensures dashboard, library overview, and library games all show the same counts
 */
export const useUnifiedLibraryData = () => {
  const { user } = useAuth();
  const { isDemo, demoData } = useDemoMode();
  
  // Main query for all user games - this is the single source of truth
  const { 
    data: rawGameData, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: queryKeys.unifiedLibrary.data(user?.id),
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      console.log('Fetching unified library data for user:', user.id);
      
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
        .eq('user_id', user.id)
        .order('dust_score', { ascending: false });
      
      if (userGamesError) {
        console.error('Error fetching unified library data:', userGamesError);
        throw userGamesError;
      }

      console.log(`Unified library: Found ${userGamesData?.length || 0} total games for user ${user.id}`);
      
      return userGamesData as UnifiedGameData[];
    },
    enabled: !isDemo && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Transform demo data to unified format when in demo mode
  const demoUnifiedData = useMemo((): UnifiedGameData[] => {
    if (!isDemo || !demoData.gamesList) return [];
    
    console.log('Transforming demo data to unified format');
    
    return demoData.gamesList.map((game, index) => ({
      id: `demo-${game.id}`,
      game_id: game.id,
      playtime_minutes: game.playtimeMinutes,
      hidden: false,
      dust_score: game.dustScore || 0,
      last_played_date: game.lastPlayed || null,
      acquisition_date: game.added || null,
      notes: game.notes || null,
      games: {
        id: game.id,
        name: game.name,
        image_url: game.image,
        header_image: game.image,
        release_date: game.releaseDate || null,
        metacritic_score: game.metacritic || null,
        genres: game.genres || [],
        categories: game.categories || [],
        price_cents: typeof game.price === 'number' ? Math.round(game.price * 100) : (game.price_cents || null),
      }
    }));
  }, [isDemo, demoData]);

  // Calculate statistics from the unified data (demo or real)
  const stats = useMemo((): UnifiedLibraryStats => {
    const dataToUse = isDemo ? demoUnifiedData : (rawGameData || []);
    
    if (!dataToUse.length) {
      return {
        totalGames: 0,
        unplayedGames: 0,
        playedGames: 0,
        totalDustScore: 0,
        totalPlaytime: 0,
        recentlyPlayedCount: 0,
        shelfLife: [],
      };
    }

    // Filter out games without valid game data
    const validGames = dataToUse.filter(game => game.games && game.games.name);
    
    const unplayedGames = validGames.filter(game => 
      !game.playtime_minutes || game.playtime_minutes === 0
    );
    
    const playedGames = validGames.filter(game => 
      game.playtime_minutes && game.playtime_minutes > 0
    );

    const totalPlaytime = validGames.reduce((sum, game) => 
      sum + (game.playtime_minutes || 0), 0
    );

    const totalDustScore = validGames.reduce((sum, game) => 
      sum + (game.dust_score || 0), 0
    );

    // Calculate recently played count (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentlyPlayedCount = validGames.filter(game => {
      if (!game.last_played_date) return false;
      const lastPlayedDate = new Date(game.last_played_date);
      return lastPlayedDate >= thirtyDaysAgo;
    }).length;

    // Calculate shelf life - for demo mode, use the existing demo shelf life data
    let shelfLife;
    if (isDemo && demoData.shelfLife) {
      shelfLife = demoData.shelfLife.map(game => ({
        id: game.id,
        name: game.name,
        image: game.image,
        addedDate: game.addedDate,
        releaseDate: game.releaseDate,
        price: 0, // Demo data doesn't have prices in shelf life
        genres: []
      }));
    } else {
      // Calculate shelf life for real data - get oldest unplayed games by RELEASE DATE
      const unplayedGamesList = unplayedGames.filter(game => game.games?.release_date);
      shelfLife = unplayedGamesList
        .sort((a, b) => {
          const dateA = new Date(a.games!.release_date!).getTime();
          const dateB = new Date(b.games!.release_date!).getTime();
          return dateA - dateB;
        })
        .slice(0, 50)
        .map(game => ({
          id: game.game_id,
          name: game.games!.name,
          image: game.games!.image_url || game.games!.header_image,
          addedDate: game.acquisition_date,
          releaseDate: game.games!.release_date,
          price: game.games!.price_cents ? game.games!.price_cents / 100 : 0,
          genres: game.games!.genres || []
        }));
    }

    const result = {
      totalGames: validGames.length,
      unplayedGames: unplayedGames.length,
      playedGames: playedGames.length,
      totalDustScore,
      totalPlaytime,
      recentlyPlayedCount,
      shelfLife,
    };

    console.log('Unified library stats:', result);
    console.log('Demo mode:', isDemo);
    
    return result;
  }, [isDemo, demoUnifiedData, rawGameData, demoData]);

  // Return appropriate data based on demo mode
  const data = isDemo ? demoUnifiedData : (rawGameData || []);
  const loading = isDemo ? false : isLoading;

  return {
    data,
    stats,
    isLoading: loading,
    error,
    refetch,
  };
};
