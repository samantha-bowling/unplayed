
import { useUnifiedLibraryData } from './useUnifiedLibraryData';
import { useEnhancedSpendingData } from './use-spending-data-enhanced';

/**
 * Coordinated hook that combines unified library data with enhanced spending calculations
 * Ensures consistent game data across all components
 */
export const useCoordinatedSpendingData = (onlyUnplayed: boolean = true) => {
  // Get the single source of truth for game data
  const { data: unifiedData, isLoading: isUnifiedLoading, refetch: refetchUnified } = useUnifiedLibraryData();
  
  // Pass the unified game data to spending calculations to avoid duplicate fetching
  const { 
    data: spendingData, 
    isLoading: isSpendingLoading, 
    refreshPrices, 
    isRefreshing,
    ...spendingRest 
  } = useEnhancedSpendingData(onlyUnplayed, unifiedData);

  // Coordinated refresh function that updates both data sources
  const refreshAllData = async () => {
    console.log('🔄 [CoordinatedSpendingData] Refreshing all data sources');
    
    // Refresh prices first, then unified data
    if (refreshPrices) {
      await refreshPrices();
    }
    
    if (refetchUnified) {
      await refetchUnified();
    }
  };

  return {
    // Spending data
    data: spendingData,
    isLoading: isUnifiedLoading || isSpendingLoading,
    
    // Refresh functions
    refreshPrices,
    refreshAllData,
    isRefreshing,
    
    // Pass through other spending hook properties
    ...spendingRest
  };
};
