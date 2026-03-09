
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

/**
 * Options for configuring the useAdminStats hook
 */
export interface FetchStatsOptions {
  /** Whether to fetch stats when the component mounts (default: true) */
  fetchOnMount?: boolean;
  /** Interval in milliseconds to automatically refetch stats (null means no auto-refresh) */
  refetchInterval?: number | null;
  /** Callback fired when stats are successfully fetched */
  onSuccess?: (data: any) => void;
  /** Callback fired when an error occurs while fetching stats */
  onError?: (error: any) => void;
}

/**
 * Custom hook for fetching and managing admin statistics
 * 
 * @template T Type of the statistics data
 * @param fetchFunction Async function that fetches statistics
 * @param options Configuration options for the hook
 * @returns Object containing stats, loading state, and fetch function
 * 
 * @example
 * ```tsx
 * // Simple usage
 * const { stats, isLoading, fetchStats } = useAdminStats(fetchQueueStats);
 * 
 * // With options
 * const { stats, isLoading } = useAdminStats(fetchUserStats, {
 *   fetchOnMount: true,
 *   refetchInterval: 60000, // Refresh every minute
 *   onSuccess: (data) => console.log('Stats loaded:', data)
 * });
 * ```
 */
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

  /**
   * Fetch the latest statistics data
   * @returns The fetched data or null if an error occurred
   */
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

  // Initial fetch on mount if enabled
  useEffect(() => {
    if (fetchOnMount) {
      fetchStats();
    }
  }, [fetchOnMount, fetchStats]);

  // Set up automatic refetch interval if specified
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
