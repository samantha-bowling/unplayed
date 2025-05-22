
/**
 * Utility functions for dust score calculations with strong type safety
 */
import { safeGetNumber } from '@/utils/safe-json';
import { DustScoreBreakdown, CleanScoreTier, CleanScoreBreakdown } from '@/types/unplayed-data.types';

/**
 * Process dust breakdown data from Supabase with proper type safety
 */
export function processDustBreakdown(breakdown: unknown): {
  ageScore: number;
  ownershipScore: number;
  playtimeFactor: number;
  totalScore: number;
} {
  const ageScore = safeGetNumber(breakdown, 'ageScore', 0);
  const ownershipScore = safeGetNumber(breakdown, 'ownershipScore', 0);
  const playtimeFactor = safeGetNumber(breakdown, 'playtimeFactor', 1.0);
  const totalScore = safeGetNumber(breakdown, 'totalScore', 0);
  
  return {
    ageScore,
    ownershipScore,
    playtimeFactor,
    totalScore
  };
}

/**
 * Process multiple dust breakdowns with type safety
 */
export function processDustBreakdowns(breakdowns: unknown[]): {
  totalAgeScore: number;
  totalOwnershipScore: number;
  avgPlaytimeFactor: number;
} {
  // Filter out any null/undefined values
  const validBreakdowns = breakdowns.filter(Boolean);
  
  if (validBreakdowns.length === 0) {
    return {
      totalAgeScore: 0,
      totalOwnershipScore: 0,
      avgPlaytimeFactor: 1.0
    };
  }
  
  // Initialize accumulators with explicit number types
  let totalAgeScore = 0;
  let totalOwnershipScore = 0;
  let totalFactorWeight = 0;
  let weightedPlaytimeFactorSum = 0;
  
  // Process each breakdown individually without using reducers
  for (const breakdown of validBreakdowns) {
    const { ageScore, ownershipScore, playtimeFactor, totalScore } = processDustBreakdown(breakdown);
    
    totalAgeScore += ageScore;
    totalOwnershipScore += ownershipScore;
    totalFactorWeight += totalScore;
    weightedPlaytimeFactorSum += (playtimeFactor * totalScore);
  }
  
  // Calculate final average playtime factor
  const avgPlaytimeFactor = totalFactorWeight > 0 
    ? weightedPlaytimeFactorSum / totalFactorWeight 
    : 1.0;
  
  return {
    totalAgeScore,
    totalOwnershipScore,
    avgPlaytimeFactor
  };
}

/**
 * Clean Score tiers definition
 */
export const CLEAN_SCORE_TIERS: CleanScoreTier[] = [
  { name: 'Pristine Collection', color: '#4ade80', range: [90, 100] },
  { name: 'Dust-Free Shelf', color: '#22d3ee', range: [75, 89] },
  { name: 'Reasonably Clean', color: '#60a5fa', range: [50, 74] },
  { name: 'Needs a Wipe', color: '#f59e0b', range: [25, 49] },
  { name: 'Filthy Casual', color: '#f87171', range: [0, 24] }
];

/**
 * Calculate clean score with type safety
 */
export function calculateCleanScore(
  playedGames: number, 
  totalGames: number,
  totalPlaytime: number,
  averageExpectedPlaytime: number = 12.5,
  recentlyPlayedGames: number
): { 
  cleanScore: number, 
  breakdown: CleanScoreBreakdown, 
  tier: CleanScoreTier 
} {
  // Apply smallLibraryBonus for libraries with fewer than 5 games
  let adjustedPlayedGames = playedGames;
  let adjustedTotalGames = totalGames;
  
  if (totalGames < 5) {
    const smallLibraryBonus = 1.2;
    adjustedTotalGames = Math.max(5, totalGames);
    adjustedPlayedGames = Math.min(adjustedPlayedGames * smallLibraryBonus, adjustedTotalGames);
  }

  // Calculate scores with explicit number types
  const completionRate = adjustedTotalGames > 0 ? adjustedPlayedGames / adjustedTotalGames : 0;
  
  // Calculate engagement factor
  let engagementFactor = 0;
  if (adjustedTotalGames > 0) {
    const expectedTotalPlaytime = averageExpectedPlaytime * adjustedTotalGames;
    engagementFactor = expectedTotalPlaytime > 0 
      ? Math.min(totalPlaytime / expectedTotalPlaytime, 1) 
      : 0;
  }

  // Calculate recency factor
  const recencyFactor = adjustedTotalGames > 0 
    ? Math.min(recentlyPlayedGames / adjustedTotalGames, 1) 
    : 0;

  // Calculate final clean score
  const cleanScore = Math.round(
    (completionRate * 0.4 + engagementFactor * 0.3 + recencyFactor * 0.3) * 100
  );

  // Find the appropriate tier
  const tier = CLEAN_SCORE_TIERS.find(
    tier => cleanScore >= tier.range[0] && cleanScore <= tier.range[1]
  ) || CLEAN_SCORE_TIERS[CLEAN_SCORE_TIERS.length - 1];

  return {
    cleanScore,
    breakdown: {
      completionRate: Math.round(completionRate * 100),
      engagementFactor: Math.round(engagementFactor * 100),
      recencyFactor: Math.round(recencyFactor * 100)
    },
    tier
  };
}
