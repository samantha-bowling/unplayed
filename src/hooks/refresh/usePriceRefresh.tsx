
import { useCallback } from 'react';
import { useRefreshCooldown } from './useRefreshCooldown';
import { useRefreshCache } from './useRefreshCache';
import { useRefreshState } from './useRefreshState';
import { useRefreshAuth } from './useRefreshAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
  const { toast } = useToast();

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
      console.log('💰 Starting price refresh...');

      // Call price refresh function
      const { data, error } = await supabase.functions.invoke('refresh-user-prices', {
        body: { user_id: user.id }
      });

      if (error) throw error;

      if (data?.success) {
        markOperationPerformed('prices');

        // Invalidate spending-related caches immediately
        invalidateCache('spending');

        toast({
          title: "Prices refreshed successfully",
          description: `Updated prices for ${data.updatedGames || 0} games.`
        });

        return data;
      } else {
        throw new Error(data?.error || 'Failed to refresh prices');
      }
    } catch (error) {
      console.error('Price refresh failed:', error);
      toast({
        title: "Price refresh failed",
        description: "There was a problem updating your game prices. Please try again later.",
        variant: "destructive"
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
