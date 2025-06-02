
import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { callSupabaseFunction } from '@/utils/supabase-functions';
import { useOptimizedCacheManagement } from '@/hooks/use-query-keys-optimized';
import { queryKeys } from '@/hooks/use-query-keys';

interface RefreshTimestamps {
  lastImport?: Date;
  lastDashboardRefresh?: Date;
  lastPriceRefresh?: Date;
}

interface RefreshStates {
  isImporting: boolean;
  isRefreshingDashboard: boolean;
  isRefreshingPrices: boolean;
}

const COOLDOWN_PERIODS = {
  import: 2 * 60 * 1000, // 2 minutes
  dashboard: 1 * 60 * 1000, // 1 minute
  prices: 5 * 60 * 1000, // 5 minutes
};

export const useRefreshManager = () => {
  const { user } = useAuth();
  const { isDemo } = useDemoMode();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { queryKeys: optimizedKeys, utils } = useOptimizedCacheManagement();

  const [refreshStates, setRefreshStates] = useState<RefreshStates>({
    isImporting: false,
    isRefreshingDashboard: false,
    isRefreshingPrices: false,
  });

  const [timestamps, setTimestamps] = useState<RefreshTimestamps>({});

  // Check if operation is allowed based on cooldown
  const canPerformOperation = useCallback((operation: keyof typeof COOLDOWN_PERIODS) => {
    if (isDemo) return false;
    if (!user) return false;

    const lastTimestamp = timestamps[`last${operation.charAt(0).toUpperCase()}${operation.slice(1)}` as keyof RefreshTimestamps];
    if (!lastTimestamp) return true;

    const timeSinceLastOperation = Date.now() - lastTimestamp.getTime();
    return timeSinceLastOperation >= COOLDOWN_PERIODS[operation];
  }, [timestamps, user, isDemo]);

  // Get remaining cooldown time
  const getRemainingCooldown = useCallback((operation: keyof typeof COOLDOWN_PERIODS) => {
    const lastTimestamp = timestamps[`last${operation.charAt(0).toUpperCase()}${operation.slice(1)}` as keyof RefreshTimestamps];
    if (!lastTimestamp) return 0;

    const timeSinceLastOperation = Date.now() - lastTimestamp.getTime();
    const remaining = COOLDOWN_PERIODS[operation] - timeSinceLastOperation;
    return Math.max(0, Math.ceil(remaining / 1000));
  }, [timestamps]);

  // 1. Import Library (only new games after first import)
  const importLibrary = useCallback(async (steamId: string) => {
    if (!canPerformOperation('import')) {
      const remaining = getRemainingCooldown('import');
      toast({
        title: "Import on cooldown",
        description: `Please wait ${remaining} seconds before importing again.`,
        variant: "destructive"
      });
      return;
    }

    setRefreshStates(prev => ({ ...prev, isImporting: true }));

    try {
      console.log('🚀 Starting smart library import...');
      
      const data = await callSupabaseFunction('import-library', {
        steamId: steamId,
      });

      if (data.success) {
        setTimestamps(prev => ({ ...prev, lastImport: new Date() }));
        
        toast({
          title: `Import ${data.status === 'complete' ? 'completed' : 'started'}`,
          description: data.status === 'complete' 
            ? `Successfully imported ${data.imported || 0} new games and updated ${data.updated || 0} existing games.`
            : `Found ${data.totalGames || 0} games. Processing ${data.newGamesFound || 0} new games in background.`
        });

        // Invalidate relevant caches after import
        if (user?.id) {
          const keysToInvalidate = [
            queryKeys.unplayedGames(user.id),
            queryKeys.library(user.id),
            optimizedKeys.unplayed.data(user.id),
          ];
          
          keysToInvalidate.forEach(key => {
            queryClient.invalidateQueries({ queryKey: key });
          });
        }

        return data;
      } else {
        throw new Error(data.error || 'Import failed');
      }
    } catch (error) {
      console.error('Import failed:', error);
      toast({
        title: "Import failed",
        description: error.message || "Please try again later.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setRefreshStates(prev => ({ ...prev, isImporting: false }));
    }
  }, [user?.id, canPerformOperation, getRemainingCooldown, toast, queryClient]);

  // 2. Refresh Dashboard (recalculate metrics only)
  const refreshDashboard = useCallback(async () => {
    if (!canPerformOperation('dashboard')) {
      const remaining = getRemainingCooldown('dashboard');
      toast({
        title: "Dashboard refresh on cooldown",
        description: `Please wait ${remaining} seconds before refreshing again.`,
        variant: "destructive"
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Authentication required",
        description: "Please log in to refresh your dashboard.",
        variant: "destructive"
      });
      return;
    }

    setRefreshStates(prev => ({ ...prev, isRefreshingDashboard: true }));

    try {
      console.log('📊 Starting dashboard metrics refresh...');

      // Step 1: Refresh backend metrics calculation
      const { data, error } = await supabase.functions.invoke('calculate-user-metrics', {
        body: { user_id: user.id }
      });

      if (error) throw error;

      if (data?.success) {
        setTimestamps(prev => ({ ...prev, lastDashboardRefresh: new Date() }));

        // Step 2: Invalidate Phase 2 metrics caches after backend calculation
        setTimeout(() => {
          const phase2Keys = optimizedKeys.helpers.phase2Metrics(user.id);
          phase2Keys.forEach(key => {
            queryClient.invalidateQueries({ queryKey: key });
          });

          // Also invalidate legacy keys
          const legacyPhase2Keys = queryKeys.helpers.phase2Metrics(user.id);
          legacyPhase2Keys.forEach(key => {
            queryClient.invalidateQueries({ queryKey: key });
          });

          toast({
            title: "Dashboard refreshed successfully",
            description: `Updated metrics for ${data.metrics?.totalGames || 0} games.`
          });
        }, 1000);

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
      setRefreshStates(prev => ({ ...prev, isRefreshingDashboard: false }));
    }
  }, [user?.id, canPerformOperation, getRemainingCooldown, toast, queryClient, optimizedKeys]);

  // 3. Refresh Prices (Steam store API only)
  const refreshPrices = useCallback(async () => {
    if (!canPerformOperation('prices')) {
      const remaining = getRemainingCooldown('prices');
      toast({
        title: "Price refresh on cooldown",
        description: `Please wait ${remaining} seconds before refreshing prices again.`,
        variant: "destructive"
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Authentication required",
        description: "Please log in to refresh prices.",
        variant: "destructive"
      });
      return;
    }

    setRefreshStates(prev => ({ ...prev, isRefreshingPrices: true }));

    try {
      console.log('💰 Starting price refresh...');

      // Call price refresh function (this should be a separate edge function)
      const { data, error } = await supabase.functions.invoke('refresh-user-prices', {
        body: { user_id: user.id }
      });

      if (error) throw error;

      if (data?.success) {
        setTimestamps(prev => ({ ...prev, lastPriceRefresh: new Date() }));

        // Invalidate spending-related caches
        const spendingKeys = [
          queryKeys.spendingMetrics(user.id),
          queryKeys.spendingData(user.id),
          optimizedKeys.metrics.spending(user.id),
        ];

        spendingKeys.forEach(key => {
          queryClient.invalidateQueries({ queryKey: key });
        });

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
      setRefreshStates(prev => ({ ...prev, isRefreshingPrices: false }));
    }
  }, [user?.id, canPerformOperation, getRemainingCooldown, toast, queryClient]);

  return {
    // Operations
    importLibrary,
    refreshDashboard,
    refreshPrices,
    
    // States
    refreshStates,
    timestamps,
    
    // Utilities
    canPerformOperation,
    getRemainingCooldown,
  };
};
