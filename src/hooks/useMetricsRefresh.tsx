
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/use-query-keys';
import { calculateUserMetricsDirect } from '@/hooks/useDirectRpcMetrics';
import { devLog, devWarn } from '../lib/dev-log';

export const useMetricsRefresh = () => {
  const { user } = useAuth();
  const { isDemo } = useDemoMode();
  
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshUserMetrics = async () => {
    if (!user || isDemo) {
      toast.error("Cannot refresh metrics", {
        description: isDemo ? "Metrics refresh is not available in demo mode." : "User not authenticated.",
      });
      return;
    }

    try {
      setIsRefreshing(true);
      
      devLog('Refreshing user metrics for user:', user.id);
      
      // Use direct RPC call with automatic fallback to edge function
      const result = await calculateUserMetricsDirect(user.id);

      if (!result.success) {
        throw new Error(result.error || 'Failed to refresh user metrics');
      }

      // Refresh game_dust_breakdowns to stay in sync
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        await supabase.rpc('refresh_user_dust_breakdowns', { p_user_id: user.id });
        devLog('Dust breakdowns refreshed successfully');
      } catch (breakdownError) {
        devWarn('Failed to refresh dust breakdowns (non-critical):', breakdownError);
      }

      // Invalidate Phase 2 metrics cache after successful backend refresh
      const phase2Keys = queryKeys.helpers.phase2Metrics(user.id);
      phase2Keys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      
      toast("Metrics refreshed successfully", {
        description: `Updated metrics for ${result.metrics?.totalGames || 0} games.`
      });
      
      devLog('User metrics refresh completed:', result);
      return result;
    } catch (error) {
      console.error('Error refreshing user metrics:', error);
      toast.error("Failed to refresh metrics", {
        description: "There was a problem updating your metrics. Please try again later.",
      });
      throw error;
    } finally {
      setIsRefreshing(false);
    }
  };

  return {
    refreshUserMetrics,
    isRefreshing
  };
};
