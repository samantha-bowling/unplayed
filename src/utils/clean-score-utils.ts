import { GameListItem } from '@/types/unplayed-data.types';

export interface CleanScoreBreakdown {
  diversityScore: number;     // Game genre diversity (25% weight)
  recencyScore: number;       // Recent activity engagement (30% weight) 
  backlogConversionScore: number; // Backlog completion rate (25% weight)
  sessionDepthScore: number;  // Average session depth (20% weight)
}

export interface CleanScoreTier {
  name: string;
  color: string;
  range: [number, number];
}

export const CLEAN_SCORE_TIERS: CleanScoreTier[] = [
  {
    name: 'Pristine Collection',
    color: '#4ade80',
    range: [90, 100]
  },
  {
    name: 'Dust-Free Shelf',
    color: '#22d3ee',
    range: [75, 89]
  },
  {
    name: 'Reasonably Clean',
    color: '#60a5fa',
    range: [50, 74]
  },
  {
    name: 'Needs a Wipe',
    color: '#f59e0b',
    range: [25, 49]
  },
  {
    name: 'Filthy Casual',
    color: '#f87171',
    range: [0, 24]
  }
];

// Calculate clean score based on completion rate, engagement, and recent activity
export const calculateCleanScore = (
  playedGames: number,
  totalGames: number,
  totalPlaytimeHours: number,
  gamesList: GameListItem[],
  recentlyPlayedCount: number = 0
): {
  cleanScore: number;
  breakdown: CleanScoreBreakdown;
  tier: CleanScoreTier;
  cleanStreak: number;
} => {
  if (totalGames === 0) {
    return {
      cleanScore: 100,
      breakdown: {
        diversityScore: 100,
        recencyScore: 100,
        backlogConversionScore: 100,
        sessionDepthScore: 100
      },
      tier: CLEAN_SCORE_TIERS[0],
      cleanStreak: 0
    };
  }

  // Calculate completion rate (40% weight)
  const completionRate = Math.min((playedGames / totalGames) * 100, 100);

  // Calculate engagement factor (30% weight)
  const averagePlaytimePerGame = totalGames > 0 ? totalPlaytimeHours / totalGames : 0;
  const engagementFactor = Math.min(averagePlaytimePerGame * 10, 100); // Scale engagement

  // Calculate recency factor (30% weight) - based on recently played count
  const recentActivityRatio = totalGames > 0 ? (recentlyPlayedCount / totalGames) * 100 : 0;
  const recencyFactor = Math.min(recentActivityRatio * 5, 100); // Scale recency

  // Weighted calculation
  const cleanScore = Math.round(
    (completionRate * 0.4) + 
    (engagementFactor * 0.3) + 
    (recencyFactor * 0.3)
  );

  // Map to new breakdown structure but calculate based on legacy factors
  const breakdown: CleanScoreBreakdown = {
    diversityScore: Math.round(completionRate * 0.8), // Map completion to diversity
    recencyScore: Math.round(recencyFactor),
    backlogConversionScore: Math.round(completionRate),
    sessionDepthScore: Math.round(engagementFactor)
  };

  // Find appropriate tier
  const tier = CLEAN_SCORE_TIERS.find(
    tier => cleanScore >= tier.range[0] && cleanScore <= tier.range[1]
  ) || CLEAN_SCORE_TIERS[CLEAN_SCORE_TIERS.length - 1];

  // Simple clean streak calculation (placeholder)
  const cleanStreak = Math.floor(cleanScore / 10);

  return {
    cleanScore,
    breakdown,
    tier,
    cleanStreak
  };
};

// Legacy calculation for fallback scenarios
export const calculateLegacyCleanScore = (
  playedGames: number,
  totalGames: number,
  totalPlaytimeHours: number,
  recentlyPlayedCount: number = 0
): {
  cleanScore: number;
  breakdown: {
    completionRate: number;
    engagementFactor: number;
    recencyFactor: number;
  };
  tier: CleanScoreTier;
  cleanStreak: number;
} => {
  if (totalGames === 0) {
    return {
      cleanScore: 100,
      breakdown: {
        completionRate: 100,
        engagementFactor: 100,
        recencyFactor: 100
      },
      tier: CLEAN_SCORE_TIERS[0],
      cleanStreak: 0
    };
  }

  // Calculate completion rate (40% weight)
  const completionRate = Math.min((playedGames / totalGames) * 100, 100);

  // Calculate engagement factor (30% weight)
  const averagePlaytimePerGame = totalGames > 0 ? totalPlaytimeHours / totalGames : 0;
  const engagementFactor = Math.min(averagePlaytimePerGame * 10, 100);

  // Calculate recency factor (30% weight)
  const recentActivityRatio = totalGames > 0 ? (recentlyPlayedCount / totalGames) * 100 : 0;
  const recencyFactor = Math.min(recentActivityRatio * 5, 100);

  // Weighted calculation
  const cleanScore = Math.round(
    (completionRate * 0.4) + 
    (engagementFactor * 0.3) + 
    (recencyFactor * 0.3)
  );

  const breakdown = {
    completionRate,
    engagementFactor,
    recencyFactor
  };

  // Find appropriate tier
  const tier = CLEAN_SCORE_TIERS.find(
    tier => cleanScore >= tier.range[0] && cleanScore <= tier.range[1]
  ) || CLEAN_SCORE_TIERS[CLEAN_SCORE_TIERS.length - 1];

  // Simple clean streak calculation
  const cleanStreak = Math.floor(cleanScore / 10);

  return {
    cleanScore,
    breakdown,
    tier,
    cleanStreak
  };
};
