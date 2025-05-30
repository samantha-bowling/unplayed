
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface RefreshStatus {
  canRefresh: boolean;
  remainingSeconds: number;
  lastRefresh: string | null;
}

interface RefreshLog {
  id: string;
  refresh_type: 'manual' | 'background';
  games_requested: number;
  games_updated: number;
  status: 'pending' | 'completed' | 'failed' | 'rate_limited';
  created_at: string;
  completed_at: string | null;
  error_message: string | null;
}

export const usePriceRefreshRateLimit = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [countdown, setCountdown] = useState(0);

  // Query to check if user can refresh prices
  const { data: refreshStatus, isLoading: isCheckingStatus } = useQuery({
    queryKey: ['price-refresh-status', user?.id],
    queryFn: async (): Promise<RefreshStatus> => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .rpc('can_user_refresh_prices', { p_user_id: user.id });
      
      if (error) throw error;
      return data as unknown as RefreshStatus;
    },
    enabled: !!user,
    refetchInterval: countdown > 0 ? 1000 : false, // Refetch every second when on cooldown
  });

  // Query to get recent refresh logs
  const { data: recentRefreshes } = useQuery({
    queryKey: ['price-refresh-logs', user?.id],
    queryFn: async (): Promise<RefreshLog[]> => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('user_price_refresh_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data as unknown as RefreshLog[];
    },
    enabled: !!user,
  });

  // Create refresh log mutation
  const createRefreshLog = useMutation({
    mutationFn: async (params: { 
      refreshType: 'manual' | 'background';
      gamesRequested: number;
    }) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('user_price_refresh_logs')
        .insert({
          user_id: user.id,
          refresh_type: params.refreshType,
          games_requested: params.gamesRequested,
          status: 'pending' as const
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-refresh-status'] });
      queryClient.invalidateQueries({ queryKey: ['price-refresh-logs'] });
    },
  });

  // Update refresh log mutation
  const updateRefreshLog = useMutation({
    mutationFn: async (params: {
      logId: string;
      gamesUpdated: number;
      status: 'completed' | 'failed';
      errorMessage?: string;
    }) => {
      const { error } = await supabase
        .from('user_price_refresh_logs')
        .update({
          games_updated: params.gamesUpdated,
          status: params.status,
          completed_at: new Date().toISOString(),
          error_message: params.errorMessage || null
        })
        .eq('id', params.logId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-refresh-logs'] });
    },
  });

  // Track user price requests
  const trackPriceRequest = useCallback(async (appIds: number[]) => {
    if (!user || !appIds.length) return;
    
    try {
      const { error } = await supabase
        .rpc('track_user_price_request', { p_app_ids: appIds });
      
      if (error) {
        console.error('Error tracking price request:', error);
      }
    } catch (error) {
      console.error('Error tracking price request:', error);
    }
  }, [user]);

  // Update countdown timer
  useEffect(() => {
    if (refreshStatus?.remainingSeconds && refreshStatus.remainingSeconds > 0) {
      setCountdown(refreshStatus.remainingSeconds);
      
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    } else {
      setCountdown(0);
    }
  }, [refreshStatus?.remainingSeconds]);

  // Format countdown display
  const formatCountdown = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  // Show rate limit notification
  const showRateLimitNotification = useCallback(() => {
    if (countdown > 0) {
      toast.warning('Price refresh on cooldown', {
        description: `Please wait ${formatCountdown(countdown)} before refreshing again.`,
      });
    }
  }, [countdown, formatCountdown]);

  return {
    // Status
    canRefresh: refreshStatus?.canRefresh ?? false,
    isOnCooldown: countdown > 0,
    countdown,
    lastRefresh: refreshStatus?.lastRefresh,
    isCheckingStatus,
    
    // Recent activity
    recentRefreshes,
    
    // Actions
    createRefreshLog: createRefreshLog.mutateAsync,
    updateRefreshLog: updateRefreshLog.mutateAsync,
    trackPriceRequest,
    showRateLimitNotification,
    
    // Utils
    formatCountdown,
    isCreatingLog: createRefreshLog.isPending,
    isUpdatingLog: updateRefreshLog.isPending,
  };
};

export default usePriceRefreshRateLimit;
