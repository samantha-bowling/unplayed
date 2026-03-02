
import { useCallback } from 'react';
import { useRefreshCooldown } from './useRefreshCooldown';
import { useRefreshCache } from './useRefreshCache';
import { useRefreshState } from './useRefreshState';
import { useRefreshAuth } from './useRefreshAuth';
import { toast } from 'sonner';
import { calculateUserMetricsDirect } from '@/hooks/useDirectRpcMetrics';

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

      // Use direct RPC call with automatic fallback to edge function
      const result = await calculateUserMetricsDirect(user.id);

      if (!result.success) {
        throw new Error(result.error || 'Failed to refresh dashboard metrics');
      }

      markOperationPerformed('dashboard');

      // Invalidate Phase 2 metrics caches after backend calculation
      invalidateCacheDelayed('phase2-metrics', 1000);

      toast("Dashboard refreshed successfully", {
        description: `Updated metrics for ${result.metrics?.totalGames || 0} games.`
      });

      return result;
    } catch (error) {
      console.error('Dashboard refresh failed:', error);
      toast.error("Dashboard refresh failed", {
        description: "There was a problem updating your metrics. Please try again later.",
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
