
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/use-query-keys';

export const useMetricsRefresh = () => {
  const { user } = useAuth();
  const { isDemo } = useDemoMode();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshUserMetrics = async () => {
    if (!user || isDemo) {
      toast({
        title: "Cannot refresh metrics",
        description: isDemo ? "Metrics refresh is not available in demo mode." : "User not authenticated.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsRefreshing(true);
      
      console.log('Refreshing user metrics for user:', user.id);
      
      const { data, error } = await supabase.functions.invoke('calculate-user-metrics', {
        body: { user_id: user.id }
      });

      if (error) {
        console.error('Error refreshing user metrics:', error);
        throw error;
      }

      if (data?.success) {
        // Invalidate Phase 2 metrics cache after successful backend refresh
        const phase2Keys = queryKeys.helpers.phase2Metrics(user.id);
        phase2Keys.forEach(key => {
          queryClient.invalidateQueries({ queryKey: key });
        });
        
        toast({
          title: "Metrics refreshed successfully",
          description: `Updated metrics for ${data.metrics?.totalGames || 0} games.`
        });
        
        console.log('User metrics refresh completed:', data);
        return data;
      } else {
        throw new Error(data?.error || 'Failed to refresh user metrics');
      }
    } catch (error) {
      console.error('Error refreshing user metrics:', error);
      toast({
        title: "Failed to refresh metrics",
        description: "There was a problem updating your metrics. Please try again later.",
        variant: "destructive"
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
