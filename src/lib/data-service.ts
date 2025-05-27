
import { UnplayedDataType } from '@/types/unplayed-data.types';
import { normalizeDemoGames } from '@/utils/normalize-games';
import { DEMO_DATA } from './demo-data';

/**
 * Central service for getting normalized game data
 * Maintains strict separation between demo and live data
 */
export const getUnplayedDataService = {
  /**
   * Returns normalized demo data for use in components
   * Always returns consistent, instant data for demo mode
   */
  getDemoData(): UnplayedDataType {
    return normalizeDemoGames(DEMO_DATA);
  },
  
  /**
   * Validates that a data structure conforms to UnplayedDataType requirements
   * @returns true if valid, false if missing required fields
   */
  validateDataStructure(data: any): boolean {
    // Check for required fields
    if (!data) return false;
    if (!data.gamesList || !Array.isArray(data.gamesList)) return false;
    
    // Check for required numeric fields
    if (typeof data.unplayedGames !== 'number') return false;
    if (typeof data.totalGames !== 'number') return false;
    if (typeof data.dustScore !== 'number') return false;
    
    // Basic structure is valid
    return true;
  },
  
  /**
   * Logs inconsistencies in data structures
   * Helps debug demo vs live data issues
   */
  logDataInconsistency(data: any, component: string): void {
    if (!this.validateDataStructure(data)) {
      console.warn(`[DataService] Invalid UnplayedDataType structure detected in ${component}`, {
        missingFields: {
          gamesList: !data?.gamesList,
          unplayedGames: typeof data?.unplayedGames !== 'number',
          totalGames: typeof data?.totalGames !== 'number',
          dustScore: typeof data?.dustScore !== 'number',
        },
        data
      });
    }
  },
  
  /**
   * Ensures demo data never gets mixed with live API calls
   * @param isDemo - Whether we're in demo mode
   * @param data - The data to validate
   */
  ensureDataSourceSeparation(isDemo: boolean, data: any): boolean {
    if (isDemo) {
      // In demo mode, data should come from DEMO_DATA transformations only
      return data && !data._isLiveData;
    } else {
      // In live mode, data should come from API calls
      return data && data._isLiveData !== false;
    }
  },
  
  /**
   * Creates a demo-safe copy of data to prevent mutations
   */
  createDemoSafeCopy(data: any): any {
    return JSON.parse(JSON.stringify(data));
  }
};
