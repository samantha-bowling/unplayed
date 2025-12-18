
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { queryKeys } from '@/hooks/use-query-keys';
import { calculateSpendingMetricsDirect } from '@/hooks/useDirectRpcSpending';

export interface UnifiedSpendingData {
  // Total library spending
  totalLibraryValue: number;
  totalLibrarySaved: number | null;
  
  // Unplayed spending (main focus)
  unplayedSpent: number;
  unplayedSaved: number | null;
  
  // Game counts
  totalGames: number;
  unplayedGames: number;
  freeGames: number;
  paidGames: number;
  
  // Data quality
  gamesWithPriceData: number;
  gamesMissingPriceData: number;
  confidence: 'low' | 'medium' | 'high';
  dataQualityPercentage: number;
  
  // Metadata
  currency: string;
  lastCalculated: string | null;
}

interface UseUnifiedSpendingDataV2Options {
  enabled?: boolean;
}

export const useUnifiedSpendingDataV2 = (options: UseUnifiedSpendingDataV2Options = {}) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.spendingMetrics(user?.id),
    queryFn: async (): Promise<UnifiedSpendingData> => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('Fetching unified spending data from user_spending_metrics...');

      // Fetch data from user_spending_metrics table (our single source of truth)
      const { data: metrics, error: metricsError } = await supabase
        .from('user_spending_metrics')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (metricsError) {
        console.error('Error fetching spending metrics:', metricsError);
        throw new Error(`Failed to fetch spending metrics: ${metricsError.message}`);
      }

      if (!metrics) {
        throw new Error('No spending metrics found for user');
      }

      // Calculate derived values
      const dataQualityPercentage = metrics.total_games > 0 
        ? (metrics.games_with_price_data / metrics.total_games) * 100 
        : 0;

      const confidence: 'low' | 'medium' | 'high' = 
        metrics.confidence_score >= 0.8 ? 'high' :
        metrics.confidence_score >= 0.5 ? 'medium' : 'low';

      const result: UnifiedSpendingData = {
        // Total library values
        totalLibraryValue: metrics.total_spent_cents / 100,
        totalLibrarySaved: metrics.total_saved_cents ? metrics.total_saved_cents / 100 : null,
        
        // Unplayed values (main focus)
        unplayedSpent: metrics.unplayed_spent_cents / 100,
        unplayedSaved: metrics.unplayed_saved_cents ? metrics.unplayed_saved_cents / 100 : null,
        
        // Game counts
        totalGames: metrics.total_games,
        unplayedGames: metrics.unplayed_games,
        freeGames: metrics.free_games,
        paidGames: metrics.paid_games,
        
        // Data quality
        gamesWithPriceData: metrics.games_with_price_data,
        gamesMissingPriceData: metrics.games_missing_price_data,
        confidence,
        dataQualityPercentage,
        
        // Metadata
        currency: metrics.currency,
        lastCalculated: metrics.last_calculated,
      };

      console.log('Unified spending data loaded:', {
        unplayedSpent: result.unplayedSpent,
        totalLibraryValue: result.totalLibraryValue,
        confidence: result.confidence,
        dataQuality: result.dataQualityPercentage,
        lastCalculated: result.lastCalculated,
      });

      return result;
    },
    enabled: !!user && (options.enabled !== false),
    staleTime: 4 * 60 * 60 * 1000, // 4 hours (extended for edge function optimization)
    retry: 2,
  });

  // Unified refresh function that recalculates spending metrics using direct RPC
  const refreshSpendingData = async () => {
    try {
      toast({
        title: "Refreshing spending data",
        description: "Recalculating your spending metrics..."
      });

      console.log('Calling direct RPC for spending metrics...');

      // Use direct RPC call with automatic fallback to edge function
      const result = await calculateSpendingMetricsDirect(user?.id || '');

      if (!result.success) {
        throw new Error(result.error || 'Failed to calculate spending metrics');
      }

      // Refetch the query to update the UI with new data
      await refetch();
      
      toast({
        title: "Spending data refreshed",
        description: "Your spending metrics have been updated successfully."
      });

      console.log('Spending data refresh completed successfully');
    } catch (error) {
      console.error('Error refreshing spending data:', error);
      toast({
        title: "Error refreshing spending data",
        description: "There was a problem updating your spending metrics. Please try again later.",
        variant: "destructive"
      });
    }
  };

  // Provide fallback data structure
  const defaultData: UnifiedSpendingData = {
    totalLibraryValue: 0,
    totalLibrarySaved: null,
    unplayedSpent: 0,
    unplayedSaved: null,
    totalGames: 0,
    unplayedGames: 0,
    freeGames: 0,
    paidGames: 0,
    gamesWithPriceData: 0,
    gamesMissingPriceData: 0,
    confidence: 'low',
    dataQualityPercentage: 0,
    currency: 'USD',
    lastCalculated: null,
  };

  return {
    data: data || defaultData,
    isLoading,
    error,
    refreshSpendingData,
    refetch
  };
};

export default useUnifiedSpendingDataV2;
