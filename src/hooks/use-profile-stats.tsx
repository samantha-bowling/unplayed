import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type ProfileStats = {
  metrics: {
    total_games: number;
    played_games: number;
    unplayed_games: number;
    total_dust_score: number;
    clean_score: number;
    clean_score_tier: string;
    clean_streak: number;
    total_library_value_cents: number;
    total_playtime_hours: number;
    recently_played_count: number;
  } | null;
  genreStats: Array<{
    genre_name: string;
    game_count: number;
    percentage: number;
  }>;
  dustiestGame: {
    game_name: string;
    current_dust_score: number;
    header_image?: string;
  } | null;
  topPlayedGame: {
    game_name: string;
    playtime_hours: number;
  } | null;
  leaderboardRank: number | null;
};

/**
 * Fetches all necessary stats for a user's profile
 * Uses batched Promise.all for efficiency
 */
export function useProfileStats(userId: string | undefined) {
  return useQuery({
    queryKey: ['profile-stats', userId],
    queryFn: async (): Promise<ProfileStats> => {
      if (!userId) throw new Error('User ID required');

      // Batch all queries in parallel for efficiency
      const [metricsResult, genreStatsResult, dustiestGameResult, topPlayedGameResult, leaderboardResult] = 
        await Promise.all([
          // User metrics
          supabase
            .from('user_metrics')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle(),
          
          // Genre stats (top 5)
          supabase
            .from('user_genre_stats')
            .select('genre_name, game_count, percentage')
            .eq('user_id', userId)
            .order('game_count', { ascending: false })
            .limit(5),
          
          // Dustiest game
          supabase
            .from('game_dust_breakdowns')
            .select('game_name, current_dust_score, header_image')
            .eq('user_id', userId)
            .order('current_dust_score', { ascending: false })
            .limit(1)
            .maybeSingle(),
          
          // Top played game
          supabase
            .from('user_games')
            .select('playtime_minutes, game_id, games(name)')
            .eq('user_id', userId)
            .order('playtime_minutes', { ascending: false })
            .limit(1)
            .maybeSingle(),
          
          // Leaderboard rank
          supabase
            .from('leaderboard_snapshots')
            .select('ranking')
            .eq('user_id', userId)
            .order('snapshot_date', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

      // Handle errors
      if (metricsResult.error) throw metricsResult.error;
      if (genreStatsResult.error) throw genreStatsResult.error;
      if (dustiestGameResult.error) throw dustiestGameResult.error;
      if (topPlayedGameResult.error) throw topPlayedGameResult.error;
      if (leaderboardResult.error) throw leaderboardResult.error;

      // Process top played game data
      const topPlayedGame = topPlayedGameResult.data
        ? {
            game_name: (topPlayedGameResult.data.games as any)?.name || 'Unknown',
            playtime_hours: (topPlayedGameResult.data.playtime_minutes || 0) / 60,
          }
        : null;

      return {
        metrics: metricsResult.data,
        genreStats: genreStatsResult.data || [],
        dustiestGame: dustiestGameResult.data,
        topPlayedGame,
        leaderboardRank: leaderboardResult.data?.ranking || null,
      };
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
