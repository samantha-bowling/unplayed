
import { UnplayedDataType } from '@/types/unplayed-data.types';
import { normalizeDemoGames } from '@/utils/normalize-games';
import { DEMO_DATA } from './demo-data';

/**
 * Central service for getting normalized game data
 */
export const getUnplayedDataService = {
  /**
   * Returns normalized demo data for use in components
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
    
    // Basic structure is valid
    return true;
  },
  
  /**
   * Logs inconsistencies in data structures
   */
  logDataInconsistency(data: any, component: string): void {
    if (!this.validateDataStructure(data)) {
      console.warn(`[DataService] Invalid UnplayedDataType structure detected in ${component}`, {
        missingFields: {
          gamesList: !data?.gamesList,
        },
        data
      });
    }
  }
};
