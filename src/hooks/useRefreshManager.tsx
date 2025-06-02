
import { useRefreshCoordinator } from './refresh/useRefreshCoordinator';

/**
 * Backward compatibility wrapper for useRefreshManager
 * Uses the new modular refresh system internally
 */
export const useRefreshManager = () => {
  const coordinator = useRefreshCoordinator();

  // Maintain the exact same API as before for backward compatibility
  const canPerformOperation = (operation: 'import' | 'dashboard' | 'prices') => {
    switch (operation) {
      case 'import':
        return coordinator.capabilities.canImport;
      case 'dashboard':
        return coordinator.capabilities.canRefreshDashboard;
      case 'prices':
        return coordinator.capabilities.canRefreshPrices;
      default:
        return false;
    }
  };

  const getRemainingCooldown = (operation: 'import' | 'dashboard' | 'prices') => {
    switch (operation) {
      case 'import':
        return coordinator.getCooldowns.getImportCooldown();
      case 'dashboard':
        return coordinator.getCooldowns.getDashboardCooldown();
      case 'prices':
        return coordinator.getCooldowns.getPricesCooldown();
      default:
        return 0;
    }
  };

  return {
    // Operations
    importLibrary: coordinator.importLibrary,
    refreshDashboard: coordinator.refreshDashboard,
    refreshPrices: coordinator.refreshPrices,
    
    // States
    refreshStates: coordinator.refreshStates,
    timestamps: coordinator.timestamps,
    
    // Utilities (backward compatibility)
    canPerformOperation,
    getRemainingCooldown,
  };
};
