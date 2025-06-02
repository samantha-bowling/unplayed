
import { useCallback } from 'react';
import { useRefreshCooldown } from './useRefreshCooldown';
import { useRefreshCache } from './useRefreshCache';
import { useRefreshState } from './useRefreshState';
import { useRefreshAuth } from './useRefreshAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useDashboardRefresh = () => {
  const { 
    canPerformOperation, 
    markOperationPerformed, 
    showCooldownToast,
    getRemainingCooldown,
    timestamps 
  } = useRefreshCooldown();
  
  const { invalidateCacheDelayed } = useRefreshCache();
  const { setOperationLoading, isOperationLoading } = useRefreshState(['dashboard']);
  const { validateUserOperation, user } = useRefreshAuth();
  const { toast } = useToast();

  const refreshDashboard = useCallback(async () => {
    // Validate user can perform operation
    if (!validateUserOperation('Refresh Dashboard')) {
      return;
    }

    // Check cooldown
    if (!canPerformOperation('dashboard')) {
      showCooldownToast('Dashboard refresh');
      return;
    }

    setOperationLoading('dashboard', true);

    try {
      console.log('📊 Starting dashboard metrics refresh...');

      // Step 1: Refresh backend metrics calculation
      const { data, error } = await supabase.functions.invoke('calculate-user-metrics', {
        body: { user_id: user.id }
      });

      if (error) throw error;

      if (data?.success) {
        markOperationPerformed('dashboard');

        // Step 2: Invalidate Phase 2 metrics caches after backend calculation
        invalidateCacheDelayed('phase2-metrics', 1000);

        toast({
          title: "Dashboard refreshed successfully",
          description: `Updated metrics for ${data.metrics?.totalGames || 0} games.`
        });

        return data;
      } else {
        throw new Error(data?.error || 'Failed to refresh dashboard metrics');
      }
    } catch (error) {
      console.error('Dashboard refresh failed:', error);
      toast({
        title: "Dashboard refresh failed",
        description: "There was a problem updating your metrics. Please try again later.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setOperationLoading('dashboard', false);
    }
  }, [validateUserOperation, canPerformOperation, showCooldownToast, setOperationLoading, markOperationPerformed, invalidateCacheDelayed, toast, user]);

  return {
    refreshDashboard,
    isRefreshingDashboard: isOperationLoading('dashboard'),
    canRefreshDashboard: canPerformOperation('dashboard'),
    getRemainingCooldown: () => getRemainingCooldown('dashboard'),
    lastDashboardRefresh: timestamps.dashboard,
  };
};
