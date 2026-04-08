
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/use-query-keys';

/**
 * Checks if the user's game_dust_breakdowns are stale compared to user_games,
 * and auto-triggers a refresh if needed.
 */
export const useDustStalenessCheck = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const hasChecked = useRef(false);

  useEffect(() => {
    if (!user || hasChecked.current) return;
    hasChecked.current = true;

    const checkAndRefresh = async () => {
      try {
        // Get the latest last_calculated from game_dust_breakdowns
        const { data: breakdownRow } = await supabase
          .from('game_dust_breakdowns')
          .select('last_calculated')
          .eq('user_id', user.id)
          .order('last_calculated', { ascending: false })
          .limit(1)
          .single();

        // Get the latest updated_at from user_games
        const { data: gameRow } = await supabase
          .from('user_games')
          .select('updated_at')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();

        const breakdownTime = breakdownRow?.last_calculated
          ? new Date(breakdownRow.last_calculated).getTime()
          : 0;
        const gameTime = gameRow?.updated_at
          ? new Date(gameRow.updated_at).getTime()
          : 0;

        // If breakdowns are missing or older than the latest game update, refresh
        const isStale = !breakdownRow || (gameTime > breakdownTime);

        if (isStale) {
          console.log('[DustStaleness] Breakdowns are stale, auto-refreshing...');
          setIsAutoRefreshing(true);

          await supabase.rpc('refresh_user_dust_breakdowns', {
            p_user_id: user.id,
          });

          // Invalidate and refetch dust breakdown queries
          await queryClient.invalidateQueries({
            queryKey: queryKeys.dustBreakdowns(user.id),
          });

          console.log('[DustStaleness] Auto-refresh complete');
        }
      } catch (err) {
        console.error('[DustStaleness] Error during staleness check:', err);
      } finally {
        setIsAutoRefreshing(false);
      }
    };

    checkAndRefresh();
  }, [user, queryClient]);

  return { isAutoRefreshing };
};
