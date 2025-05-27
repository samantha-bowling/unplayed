
import { CleanScoreTier, CleanScoreBreakdown } from '@/types/unplayed-data.types';

// Clean Score tiers configuration
export const CLEAN_SCORE_TIERS: CleanScoreTier[] = [
  { name: 'Pristine Collection', color: '#4ade80', range: [90, 100] },
  { name: 'Dust-Free Shelf', color: '#22d3ee', range: [75, 89] },
  { name: 'Reasonably Clean', color: '#60a5fa', range: [50, 74] },
  { name: 'Needs a Wipe', color: '#f59e0b', range: [25, 49] },
  { name: 'Filthy Casual', color: '#f87171', range: [0, 24] }
];

/**
 * Efficiently calculates clean score metrics in a single pass
 */
export const calculateCleanScore = (
  playedGames: number, 
  totalGames: number,
  totalPlaytime: number,
  averageExpectedPlaytime: number = 12.5,
  recentlyPlayedGames: number
): { 
  cleanScore: number, 
  breakdown: CleanScoreBreakdown, 
  tier: CleanScoreTier 
} => {
  // Handle small libraries with bonus
  if (totalGames < 5) {
    const smallLibraryBonus = 1.2;
    totalGames = Math.max(5, totalGames);
    playedGames = Math.min(playedGames * smallLibraryBonus, totalGames);
  }
  
  const completionRate = totalGames > 0 ? playedGames / totalGames : 0;
  
  let engagementFactor = 0;
  if (totalGames > 0) {
    const expectedTotalPlaytime = averageExpectedPlaytime * totalGames;
    engagementFactor = expectedTotalPlaytime > 0 
      ? Math.min(totalPlaytime / expectedTotalPlaytime, 1) 
      : 0;
  }
  
  const recencyFactor = totalGames > 0 ? Math.min(recentlyPlayedGames / totalGames, 1) : 0;
  
  const cleanScore = Math.round(
    (completionRate * 0.4 + engagementFactor * 0.3 + recencyFactor * 0.3) * 100
  );
  
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
};
