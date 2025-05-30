
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
 * Simplified Clean Streak calculation - just count recent playing days
 */
export const calculateCleanStreak = (gamesList: any[]): {
  streak: number;
  streakQuality: 'bronze' | 'silver' | 'gold';
} => {
  if (!gamesList || gamesList.length === 0) {
    return {
      streak: 0,
      streakQuality: 'bronze'
    };
  }

  // Count games played in last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentPlayDays = gamesList.filter(game => {
    if (!game.lastPlayed && !game.last_played_date) return false;
    const playDate = new Date(game.lastPlayed || game.last_played_date);
    return playDate >= thirtyDaysAgo && (game.playtimeMinutes || 0) > 0;
  }).length;

  // Simple streak calculation based on recent activity
  const streak = Math.min(recentPlayDays, 30); // Cap at 30 days

  // Determine quality
  let streakQuality: 'bronze' | 'silver' | 'gold' = 'bronze';
  if (streak >= 10) {
    streakQuality = 'gold';
  } else if (streak >= 5) {
    streakQuality = 'silver';
  }

  return {
    streak,
    streakQuality
  };
};

/**
 * Enhanced Clean Score calculation using only available data
 */
export const calculateCleanScore = (
  playedGames: number, 
  totalGames: number,
  totalPlaytime: number,
  gamesList: any[] = [],
  recentlyPlayedGames: number = 0
): { 
  cleanScore: number, 
  breakdown: CleanScoreBreakdown, 
  tier: CleanScoreTier,
  cleanStreak: number,
  streakMetadata?: any
} => {
  // Handle edge cases
  if (totalGames === 0) {
    const fallbackTier = CLEAN_SCORE_TIERS[CLEAN_SCORE_TIERS.length - 1];
    return {
      cleanScore: 0,
      breakdown: { completionRate: 0, engagementFactor: 0, recencyFactor: 0 },
      tier: fallbackTier,
      cleanStreak: 0
    };
  }

  // Small library bonus (libraries under 10 games get a boost)
  let adjustedTotalGames = totalGames;
  let adjustedPlayedGames = playedGames;
  
  if (totalGames < 10) {
    const smallLibraryMultiplier = 1.2;
    adjustedPlayedGames = Math.min(playedGames * smallLibraryMultiplier, totalGames);
  }

  // 1. Completion Rate (40% weight)
  const completionRate = adjustedTotalGames > 0 ? adjustedPlayedGames / adjustedTotalGames : 0;

  // 2. Simplified Engagement Factor (30% weight)
  let engagementFactor = 0;
  
  if (totalPlaytime > 0 && playedGames > 0) {
    const avgPlaytimePerGame = totalPlaytime / playedGames;
    engagementFactor = Math.min(avgPlaytimePerGame / 10, 1); // 10 hours as benchmark
  }

  // 3. Simple Recency Factor (30% weight)
  const recencyFactor = totalGames > 0 ? Math.min(recentlyPlayedGames / totalGames, 1) : 0;

  // Get simplified clean streak data
  const streakData = calculateCleanStreak(gamesList);

  // Calculate final clean score
  const cleanScore = Math.round(
    (completionRate * 0.4 + engagementFactor * 0.3 + recencyFactor * 0.3) * 100
  );
  
  // Find appropriate tier
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
    tier,
    cleanStreak: streakData.streak,
    streakMetadata: {
      gracePeriodUsed: false,
      streakQuality: streakData.streakQuality
    }
  };
};
