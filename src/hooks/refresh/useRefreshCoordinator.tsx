
import { useLibraryImport } from './useLibraryImport';
import { useDashboardRefresh } from './useDashboardRefresh';
import { usePriceRefresh } from './usePriceRefresh';

/**
 * Lightweight coordinator that combines all refresh operations
 * This replaces the monolithic useRefreshManager with a cleaner modular approach
 */
export const useRefreshCoordinator = () => {
  const libraryImport = useLibraryImport();
  const dashboardRefresh = useDashboardRefresh();
  const priceRefresh = usePriceRefresh();

  // Combined refresh states for UI convenience
  const refreshStates = {
    isImporting: libraryImport.isImporting,
    isRefreshingDashboard: dashboardRefresh.isRefreshingDashboard,
    isRefreshingPrices: priceRefresh.isRefreshingPrices,
  };

  // Combined timestamps for UI convenience
  const timestamps = {
    lastImport: libraryImport.lastImport,
    lastDashboardRefresh: dashboardRefresh.lastDashboardRefresh,
    lastPriceRefresh: priceRefresh.lastPriceRefresh,
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
    // Operations
    importLibrary: libraryImport.importLibrary,
    refreshDashboard: dashboardRefresh.refreshDashboard,
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
