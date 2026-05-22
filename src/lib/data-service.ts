
import { UnplayedDataType } from '@/types/unplayed-data.types';
import { normalizeDemoGames } from '@/utils/normalize-games';
import { DEMO_DATA } from './demo-data';
import { devLog, devWarn } from '../lib/dev-log';

/**
 * Enhanced central service for unified data operations
 * Maintains strict separation between demo and live data with improved error handling
 */
export const getUnplayedDataService = {
  /**
   * Returns normalized demo data for use in components
   * Always returns consistent, instant data for demo mode
   */
  getDemoData(): UnplayedDataType {
    try {
      return normalizeDemoGames(DEMO_DATA);
    } catch (error) {
      devWarn('[DataService] Error normalizing demo data, using fallback', error);
      return this.getFallbackData();
    }
  },
  
  /**
   * Creates a fallback data structure when demo data fails
   */
  getFallbackData(): UnplayedDataType {
    return {
      unplayedGames: 0,
      totalGames: 0,
      dustScore: 0,
      totalPlaytime: 0,
      totalSpent: 0,
      unplayedSpent: 0,
      genres: [],
      shelfLife: [],
      library: [],
      gamesList: [],
      cleanScore: 0,
      cleanScoreBreakdown: {
        completionRate: 0,
        engagementFactor: 0,
        recencyFactor: 0
      },
      cleanTier: {
        name: 'Clean Slate',
        color: '#4ade80',
        range: [0, 100]
      },
      cleanStreak: 0,
      recentlyPlayedCount: 0
    };
  },
  
  /**
   * Validates that a data structure conforms to UnplayedDataType requirements
   */
  validateDataStructure(data: any): boolean {
    if (!data) return false;
    if (!data.gamesList || !Array.isArray(data.gamesList)) return false;
    if (typeof data.unplayedGames !== 'number') return false;
    if (typeof data.totalGames !== 'number') return false;
    if (typeof data.dustScore !== 'number') return false;
    return true;
  },
  
  /**
   * Enhanced error handling for data inconsistencies
   */
  handleDataError(error: any, component: string, isDemo: boolean): UnplayedDataType {
    console.error(`[DataService] Data error in ${component}:`, error);
    
    if (isDemo) {
      // For demo mode, always provide working data
      devLog('[DataService] Demo mode: providing fallback data');
      return this.getFallbackData();
    } else {
      // For live mode, provide fallback but also surface the error
      devWarn('[DataService] Live mode: data error occurred, using fallback');
      return this.getFallbackData();
    }
  },
  
  /**
   * Ensures demo data never gets mixed with live API calls
   */
  ensureDataSourceSeparation(isDemo: boolean, data: any): boolean {
    if (isDemo) {
      // In demo mode, data should never have live data markers
      return data && !data._isLiveData;
    } else {
      // In live mode, we accept any valid data structure
      return this.validateDataStructure(data);
    }
  },
  
  /**
   * Creates a demo-safe copy of data to prevent mutations
   */
  createDemoSafeCopy(data: any): any {
    try {
      return JSON.parse(JSON.stringify(data));
    } catch (error) {
      devWarn('[DataService] Failed to create safe copy, returning original data');
      return data;
    }
  },
  
  /**
   * Enhanced logging for debugging demo vs live data flow
   */
  logDataFlow(component: string, isDemo: boolean, dataSize: number): void {
    if (process.env.NODE_ENV === 'development') {
      devLog(`[DataService] ${component}: ${isDemo ? 'Demo' : 'Live'} data (${dataSize} items)`);
    }
  }
};
