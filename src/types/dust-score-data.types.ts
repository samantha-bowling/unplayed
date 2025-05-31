
import { 
  DustScoreBreakdown, 
  CleanScoreBreakdown,
  LegacyCleanScoreBreakdown,
  CleanScoreTier,
  CleanStreakMetadata,
  GameDustData 
} from './unplayed-data.types';

/**
 * Complete dust score data structure with all properties expected by components
 */
export interface DustScoreData {
  // Core dust score data
  dustScore: number;
  dustScoreBreakdown: DustScoreBreakdown;
  averageDustScore?: number;
  topDustContributors: GameDustData[];
  
  // Clean score data (new 4-factor system for authenticated users)
  cleanScore: number;
  cleanScoreBreakdown?: CleanScoreBreakdown;
  cleanTier: CleanScoreTier;
  cleanStreak: number;
  cleanStreakMetadata?: CleanStreakMetadata;
  
  // Legacy clean score support for demo mode and fallbacks
  legacyCleanScoreBreakdown?: LegacyCleanScoreBreakdown;
  
  // Additional metrics
  totalGames: number;
  unplayedGames: number;
  recentlyPlayedCount: number;
  recentlyPlayedUnplayed?: number;
  
  // Legacy support
  avgDustScore?: number; // Alias for averageDustScore
}

/**
 * Response format from dust score calculation functions
 */
export interface DustScoreCalculationResponse {
  data: DustScoreData;
  isLoading: boolean;
  error: Error | null;
  refetch?: () => Promise<DustScoreData>;
}
