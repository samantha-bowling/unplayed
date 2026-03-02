import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { queryKeys } from '@/hooks/use-query-keys';

export interface SpendingMetrics {
  totalSpentCents: number;
  unplayedSpentCents: number;
  totalSavedCents?: number;
  unplayedSavedCents?: number;
  totalGames: number;
  unplayedGames: number;
  freeGames: number;
  paidGames: number;
  gamesWithPriceData: number;
  gamesMissingPriceData: number;
  confidenceScore: number;
  currency: string;
  lastCalculated: string;
  
  // Derived values for convenience
  totalSpentDollars: number;
  unplayedSpentDollars: number;
  dataQualityPercentage: number;
  confidence: 'low' | 'medium' | 'high';
}

interface UseSpendingMetricsOptions {
  forceRefresh?: boolean;
}

export const useSpendingMetrics = (options: UseSpendingMetricsOptions = {}) => {
  const { user } = useAuth();
  const { isDemo, demoData } = useDemoMode();
  

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.spendingMetrics(user?.id),
    queryFn: async (): Promise<SpendingMetrics> => {
      if (isDemo) {
        // Return demo data in the expected format
        return {
          totalSpentCents: demoData.totalSpent * 100,
          unplayedSpentCents: demoData.totalSpent * 100,
          totalSavedCents: undefined,
          unplayedSavedCents: undefined,
          totalGames: demoData.totalGames,
          unplayedGames: demoData.unplayedGames,
          freeGames: 15,
          paidGames: demoData.totalGames - 15,
          gamesWithPriceData: demoData.totalGames,
          gamesMissingPriceData: 0,
          confidenceScore: 0.95,
          currency: 'USD',
          lastCalculated: new Date().toISOString(),
          totalSpentDollars: demoData.totalSpent,
          unplayedSpentDollars: demoData.totalSpent,
          dataQualityPercentage: 100,
          confidence: 'high'
        };
      }

      if (!user) {
        throw new Error('User not authenticated');
      }

      // First try to fetch cached data from the database
      const { data: cachedMetrics, error: fetchError } = await supabase
        .from('user_spending_metrics')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // If we have recent cached data and not forcing refresh, use it
      if (cachedMetrics && !options.forceRefresh) {
        const lastCalculated = new Date(cachedMetrics.last_calculated);
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        
        if (lastCalculated > oneHourAgo) {
          return transformMetricsData(cachedMetrics);
        }
      }

      // Otherwise, call the edge function to calculate fresh metrics
      console.log('Calling edge function to calculate spending metrics...');
      
      const { data: functionResult, error: functionError } = await supabase.functions.invoke(
        'calculate-user-spending',
        {
          body: {
            user_id: user.id,
            force_refresh: options.forceRefresh || false
          }
        }
      );

      if (functionError) {
        console.error('Error calling spending calculation function:', functionError);
        throw functionError;
      }

      if (!functionResult?.success) {
        throw new Error(functionResult?.error || 'Failed to calculate spending metrics');
      }

      return transformMetricsFromFunction(functionResult.metrics);
    },
    enabled: !!user || isDemo,
    staleTime: 60 * 60 * 1000, // 1 hour
    retry: 2,
  });

  // Function to refresh spending metrics
  const refreshMetrics = async () => {
    if (isDemo) {
      toast("Demo Mode", {
        description: "Spending data refresh is not available in demo mode."
      });
      return;
    }

    try {
      toast("Refreshing spending data", {
        description: "Calculating your latest spending metrics..."
      });

      const { data: functionResult, error } = await supabase.functions.invoke(
        'calculate-user-spending',
        {
          body: {
            user_id: user?.id,
            force_refresh: true
          }
        }
      );

      if (error) throw error;

      if (functionResult?.success) {
        // Refetch the query to update the UI
        await refetch();
        
        toast("Spending data refreshed", {
          description: "Your spending metrics have been updated successfully."
        });
      } else {
        throw new Error(functionResult?.error || 'Failed to refresh spending metrics');
      }
    } catch (error) {
      console.error('Error refreshing spending metrics:', error);
      toast.error("Error refreshing spending data", {
        description: "There was a problem updating your spending metrics. Please try again later.",
      });
    }
  };

  return {
    data,
    isLoading,
    error,
    refreshMetrics,
    refetch
  };
};

// Helper function to transform database metrics to our interface
function transformMetricsData(dbMetrics: any): SpendingMetrics {
  const dataQualityPercentage = dbMetrics.total_games > 0 
    ? (dbMetrics.games_with_price_data / dbMetrics.total_games) * 100 
    : 0;

  return {
    totalSpentCents: dbMetrics.total_spent_cents,
    unplayedSpentCents: dbMetrics.unplayed_spent_cents,
    totalSavedCents: dbMetrics.total_saved_cents,
    unplayedSavedCents: dbMetrics.unplayed_saved_cents,
    totalGames: dbMetrics.total_games,
    unplayedGames: dbMetrics.unplayed_games,
    freeGames: dbMetrics.free_games,
    paidGames: dbMetrics.paid_games,
    gamesWithPriceData: dbMetrics.games_with_price_data,
    gamesMissingPriceData: dbMetrics.games_missing_price_data,
    confidenceScore: parseFloat(dbMetrics.confidence_score),
    currency: dbMetrics.currency,
    lastCalculated: dbMetrics.last_calculated,
    totalSpentDollars: dbMetrics.total_spent_cents / 100,
    unplayedSpentDollars: dbMetrics.unplayed_spent_cents / 100,
    dataQualityPercentage,
    confidence: getConfidenceLevel(parseFloat(dbMetrics.confidence_score))
  };
}

// Helper function to transform function result to our interface
function transformMetricsFromFunction(metrics: any): SpendingMetrics {
  const dataQualityPercentage = metrics.total_games > 0 
    ? (metrics.games_with_price_data / metrics.total_games) * 100 
    : 0;

  return {
    totalSpentCents: metrics.total_spent_cents,
    unplayedSpentCents: metrics.unplayed_spent_cents,
    totalSavedCents: metrics.total_saved_cents,
    unplayedSavedCents: metrics.unplayed_saved_cents,
    totalGames: metrics.total_games,
    unplayedGames: metrics.unplayed_games,
    freeGames: metrics.free_games,
    paidGames: metrics.paid_games,
    gamesWithPriceData: metrics.games_with_price_data,
    gamesMissingPriceData: metrics.games_missing_price_data,
    confidenceScore: metrics.confidence_score,
    currency: metrics.currency,
    lastCalculated: new Date().toISOString(),
    totalSpentDollars: metrics.total_spent_dollars,
    unplayedSpentDollars: metrics.unplayed_spent_dollars,
    dataQualityPercentage,
    confidence: getConfidenceLevel(metrics.confidence_score)
  };
}

function getConfidenceLevel(score: number): 'low' | 'medium' | 'high' {
  if (score >= 0.8) return 'high';
  if (score >= 0.5) return 'medium';
  return 'low';
}

export default useSpendingMetrics;
