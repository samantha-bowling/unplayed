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
 * Fetches all necessary stats for a user's profile.
 *
 * Owner path (isOwner=true) is byte-identical to the pre-hardening behavior:
 * reads directly from `user_metrics` and `game_dust_breakdowns`.
 *
 * Visitor path (isOwner=false) calls the gated RPCs `get_public_user_metrics`
 * and `get_public_dustiest_game`, which strip financial fields and game counts
 * and only return data when the target profile is public.
 */
export function useProfileStats(userId: string | undefined, isOwner: boolean = true) {
  return useQuery({
    queryKey: ['profile-stats', userId, isOwner],
    queryFn: async (): Promise<ProfileStats> => {
      if (!userId) throw new Error('User ID required');

      if (isOwner) {
        // === OWNER PATH (unchanged from pre-hardening) ===
        const [metricsResult, genreStatsResult, dustiestGameResult, topPlayedGameResult, leaderboardResult] =
          await Promise.all([
            supabase
              .from('user_metrics')
              .select('*')
              .eq('user_id', userId)
              .maybeSingle(),

            supabase
              .from('user_genre_stats')
              .select('genre_name, game_count, percentage')
              .eq('user_id', userId)
              .order('game_count', { ascending: false })
              .limit(5),

            supabase
              .from('game_dust_breakdowns')
              .select('game_name, current_dust_score, header_image')
              .eq('user_id', userId)
              .order('current_dust_score', { ascending: false })
              .limit(1)
              .maybeSingle(),

            supabase
              .from('user_games')
              .select('playtime_minutes, game_id, games(name)')
              .eq('user_id', userId)
              .order('playtime_minutes', { ascending: false })
              .limit(1)
              .maybeSingle(),

            supabase
              .from('leaderboard_snapshots')
              .select('ranking')
              .eq('user_id', userId)
              .order('snapshot_date', { ascending: false })
              .limit(1)
              .maybeSingle(),
          ]);

        if (metricsResult.error) throw metricsResult.error;
        if (genreStatsResult.error) throw genreStatsResult.error;
        if (dustiestGameResult.error) throw dustiestGameResult.error;
        if (topPlayedGameResult.error) throw topPlayedGameResult.error;
        if (leaderboardResult.error) throw leaderboardResult.error;

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
      }

      // === VISITOR PATH (public profiles only) ===
      // Routes restricted reads through SECURITY DEFINER RPCs that strip
      // financial fields, game counts, and per-game library data.
      const [metricsResult, genreStatsResult, dustiestGameResult, topPlayedGameResult, leaderboardResult] =
        await Promise.all([
          supabase.rpc('get_public_user_metrics', { p_user_id: userId }),

          supabase
            .from('user_genre_stats')
            .select('genre_name, game_count, percentage')
            .eq('user_id', userId)
            .order('game_count', { ascending: false })
            .limit(5),

          supabase.rpc('get_public_dustiest_game', { p_user_id: userId }),

          supabase
            .from('user_games')
            .select('playtime_minutes, game_id, games(name)')
            .eq('user_id', userId)
            .order('playtime_minutes', { ascending: false })
            .limit(1)
            .maybeSingle(),

          supabase
            .from('leaderboard_snapshots')
            .select('ranking')
            .eq('user_id', userId)
            .order('snapshot_date', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

      if (metricsResult.error) throw metricsResult.error;
      if (genreStatsResult.error) throw genreStatsResult.error;
      if (dustiestGameResult.error) throw dustiestGameResult.error;
      if (topPlayedGameResult.error) throw topPlayedGameResult.error;
      if (leaderboardResult.error) throw leaderboardResult.error;

      const safeMetricsRow = Array.isArray(metricsResult.data) ? metricsResult.data[0] : null;
      const metrics = safeMetricsRow
        ? {
            // Safe fields from RPC
            total_dust_score: safeMetricsRow.total_dust_score ?? 0,
            clean_score: safeMetricsRow.clean_score ?? 0,
            clean_score_tier: safeMetricsRow.clean_score_tier ?? 'dusty',
            clean_streak: safeMetricsRow.clean_streak ?? 0,
            total_playtime_hours: Number(safeMetricsRow.total_playtime_hours ?? 0),
            recently_played_count: safeMetricsRow.recently_played_count ?? 0,
            // Restricted fields — never exposed to visitors
            total_games: 0,
            played_games: 0,
            unplayed_games: 0,
            total_library_value_cents: 0,
          }
        : null;

      const dustiestGameRow = Array.isArray(dustiestGameResult.data) ? dustiestGameResult.data[0] : null;
      const dustiestGame = dustiestGameRow
        ? {
            game_name: dustiestGameRow.game_name,
            current_dust_score: dustiestGameRow.current_dust_score,
            header_image: dustiestGameRow.header_image ?? undefined,
          }
        : null;

      const topPlayedGame = topPlayedGameResult.data
        ? {
            game_name: (topPlayedGameResult.data.games as any)?.name || 'Unknown',
            playtime_hours: (topPlayedGameResult.data.playtime_minutes || 0) / 60,
          }
        : null;

      return {
        metrics,
        genreStats: genreStatsResult.data || [],
        dustiestGame,
        topPlayedGame,
        leaderboardRank: leaderboardResult.data?.ranking || null,
      };
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
