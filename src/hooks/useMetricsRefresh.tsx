
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useMetricsRefresh = () => {
  const { user } = useAuth();
  const { isDemo } = useDemoMode();
  const { toast } = useToast();
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
