
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

export interface FetchStatsOptions {
  fetchOnMount?: boolean;
  refetchInterval?: number | null;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export function useAdminStats<T>(
  fetchFunction: () => Promise<T>,
  options: FetchStatsOptions = {}
) {
  const { 
    fetchOnMount = true, 
    refetchInterval = null,
    onSuccess,
    onError
  } = options;
  
  const [stats, setStats] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchFunction();
      setStats(data);
      setLastFetched(new Date());
      
      if (onSuccess) onSuccess(data);
      return data;
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("Failed to load statistics");
      
      if (onError) onError(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchFunction, onSuccess, onError]);

  // Initial fetch
  useEffect(() => {
    if (fetchOnMount) {
      fetchStats();
    }
  }, [fetchOnMount, fetchStats]);

  // Set up refetch interval if specified
  useEffect(() => {
    if (!refetchInterval) return;
    
    const intervalId = setInterval(() => {
      fetchStats();
    }, refetchInterval);
    
    return () => clearInterval(intervalId);
  }, [refetchInterval, fetchStats]);

  return {
    stats,
    isLoading,
    fetchStats,
    lastFetched
  };
}
