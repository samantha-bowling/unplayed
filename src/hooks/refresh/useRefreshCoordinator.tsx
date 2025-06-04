
import { useLibraryImport } from './useLibraryImport';
import { useDashboardRefresh } from './useDashboardRefresh';
import { usePriceRefresh } from './usePriceRefresh';
import { useState, useEffect, useCallback } from 'react';

/**
 * Lightweight coordinator that combines all refresh operations
 * This replaces the monolithic useRefreshManager with a cleaner modular approach
 */
export const useRefreshCoordinator = () => {
  const libraryImport = useLibraryImport();
  const dashboardRefresh = useDashboardRefresh();
  const priceRefresh = usePriceRefresh();

  // Persistent timestamps using localStorage
  const [persistentTimestamps, setPersistentTimestamps] = useState({
    lastImport: null as Date | null,
    lastDashboardRefresh: null as Date | null,
  });

  // Load timestamps from localStorage on mount
  useEffect(() => {
    const savedImport = localStorage.getItem('unplayed_last_import');
    const savedDashboard = localStorage.getItem('unplayed_last_dashboard_refresh');
    
    setPersistentTimestamps({
      lastImport: savedImport ? new Date(savedImport) : null,
      lastDashboardRefresh: savedDashboard ? new Date(savedDashboard) : null,
    });
  }, []);

  // Save timestamp to localStorage
  const saveTimestamp = useCallback((key: string, timestamp: Date) => {
    localStorage.setItem(key, timestamp.toISOString());
    setPersistentTimestamps(prev => ({
      ...prev,
      [key === 'unplayed_last_import' ? 'lastImport' : 'lastDashboardRefresh']: timestamp
    }));
  }, []);

  // Enhanced import function that saves timestamp
  const enhancedImportLibrary = useCallback(async (steamId: string) => {
    const result = await libraryImport.importLibrary(steamId);
    if (result?.success) {
      const now = new Date();
      saveTimestamp('unplayed_last_import', now);
    }
    return result;
  }, [libraryImport.importLibrary, saveTimestamp]);

  // Enhanced dashboard refresh that saves timestamp
  const enhancedRefreshDashboard = useCallback(async () => {
    const result = await dashboardRefresh.refreshDashboard();
    if (result?.success) {
      const now = new Date();
      saveTimestamp('unplayed_last_dashboard_refresh', now);
    }
    return result;
  }, [dashboardRefresh.refreshDashboard, saveTimestamp]);

  // Combined refresh states for UI convenience
  const refreshStates = {
    isImporting: libraryImport.isImporting,
    isRefreshingDashboard: dashboardRefresh.isRefreshingDashboard,
    isRefreshingPrices: priceRefresh.isRefreshingPrices,
  };

  // Use persistent timestamps instead of hook timestamps
  const timestamps = {
    lastImport: persistentTimestamps.lastImport,
    lastDashboardRefresh: persistentTimestamps.lastDashboardRefresh,
    lastPriceRefresh: priceRefresh.lastPriceRefresh, // This one doesn't need persistence
  };

  // Combined capability checks
  const capabilities = {
    canImport: libraryImport.canImport,
    canRefreshDashboard: dashboardRefresh.canRefreshDashboard,
    canRefreshPrices: priceRefresh.canRefreshPrices,
  };

  // Combined cooldown functions
  const getCooldowns = {
    getImportCooldown: libraryImport.getRemainingCooldown,
    getDashboardCooldown: dashboardRefresh.getRemainingCooldown,
    getPricesCooldown: priceRefresh.getRemainingCooldown,
  };

  return {
    // Operations with persistent timestamp saving
    importLibrary: enhancedImportLibrary,
    refreshDashboard: enhancedRefreshDashboard,
    refreshPrices: priceRefresh.refreshPrices,
    
    // States (for backward compatibility)
    refreshStates,
    timestamps,
    
    // Capabilities
    capabilities,
    
    // Cooldowns
    getCooldowns,
    
    // Individual hook access if needed
    libraryImport,
    dashboardRefresh,
    priceRefresh,
  };
};
