
import { useCallback } from 'react';
import { useRefreshCooldown } from './useRefreshCooldown';
import { useRefreshCache } from './useRefreshCache';
import { useRefreshState } from './useRefreshState';
import { useRefreshAuth } from './useRefreshAuth';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { devLog } from '../../lib/dev-log';

export const usePriceRefresh = () => {
  const { 
    canPerformOperation, 
    markOperationPerformed, 
    showCooldownToast,
    getRemainingCooldown,
    timestamps 
  } = useRefreshCooldown();
  
  const { invalidateCache } = useRefreshCache();
  const { setOperationLoading, isOperationLoading } = useRefreshState(['prices']);
  const { validateUserOperation, user } = useRefreshAuth();
  

  const refreshPrices = useCallback(async () => {
    // Validate user can perform operation
    if (!validateUserOperation('Refresh Prices')) {
      return;
    }

    // Check cooldown
    if (!canPerformOperation('prices')) {
      showCooldownToast('Price refresh');
      return;
    }

    setOperationLoading('prices', true);

    try {
      devLog('💰 Starting price refresh...');

      // Call price refresh function
      const { data, error } = await supabase.functions.invoke('refresh-user-prices', {
        body: { user_id: user.id }
      });

      if (error) throw error;

      if (data?.success) {
        markOperationPerformed('prices');

        // Invalidate spending-related caches immediately
        invalidateCache('spending');

        toast("Prices refreshed successfully", {
          description: `Updated prices for ${data.updatedGames || 0} games.`
        });

        return data;
      } else {
        throw new Error(data?.error || 'Failed to refresh prices');
      }
    } catch (error) {
      console.error('Price refresh failed:', error);
      toast.error("Price refresh failed", {
        description: "There was a problem updating your game prices. Please try again later.",
      });
      throw error;
    } finally {
      setOperationLoading('prices', false);
    }
  }, [validateUserOperation, canPerformOperation, showCooldownToast, setOperationLoading, markOperationPerformed, invalidateCache, toast, user]);

  return {
    refreshPrices,
    isRefreshingPrices: isOperationLoading('prices'),
    canRefreshPrices: canPerformOperation('prices'),
    getRemainingCooldown: () => getRemainingCooldown('prices'),
    lastPriceRefresh: timestamps.prices,
  };
};
