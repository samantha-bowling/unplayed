
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
 * Calculate clean streak based on last played dates
 */
export const calculateCleanStreak = (gamesList: any[]): number => {
  if (!gamesList || gamesList.length === 0) return 0;

  // Get all unique play dates from the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const playDates = new Set<string>();
  
  gamesList.forEach(game => {
    if (game.lastPlayedDate) {
      const playDate = new Date(game.lastPlayedDate);
      if (playDate >= thirtyDaysAgo) {
        // Add date as YYYY-MM-DD string
        playDates.add(playDate.toISOString().split('T')[0]);
      }
    }
  });

  if (playDates.size === 0) return 0;

  // Sort dates descending
  const sortedDates = Array.from(playDates).sort().reverse();
  
  // Calculate consecutive days from today
  let streak = 0;
  const today = new Date().toISOString().split('T')[0];
  let currentDate = new Date();
  
  for (let i = 0; i < 30; i++) {
    const dateStr = currentDate.toISOString().split('T')[0];
    if (sortedDates.includes(dateStr)) {
      streak++;
    } else {
      break; // Break on first non-consecutive day
    }
    currentDate.setDate(currentDate.getDate() - 1);
  }
  
  return streak;
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
  cleanStreak: number
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

  // 2. Enhanced Engagement Factor (30% weight)
  let engagementFactor = 0;
  
  if (gamesList && gamesList.length > 0) {
    // Calculate user's average playtime per game
    const totalPlaytimeHours = totalPlaytime;
    const avgPlaytimePerGame = totalPlaytimeHours / Math.max(playedGames, 1);
    
    // Adaptive benchmark based on user's own data
    // Use 2x user's average as the "good engagement" threshold
    const userEngagementThreshold = Math.max(avgPlaytimePerGame * 2, 2); // Minimum 2 hours
    
    // Depth factor: How deeply user plays their games
    const depthFactor = Math.min(avgPlaytimePerGame / userEngagementThreshold, 1);
    
    // Variety factor: What percentage of library has been touched
    const varietyFactor = completionRate;
    
    // Consistency factor: Based on playtime distribution
    const playedGamesList = gamesList.filter(g => g.playtimeMinutes > 0);
    let consistencyFactor = 0.5; // Default middle value
    
    if (playedGamesList.length > 0) {
      const playtimes = playedGamesList.map(g => g.playtimeMinutes / 60);
      const avgPlaytime = playtimes.reduce((sum, time) => sum + time, 0) / playtimes.length;
      const variance = playtimes.reduce((sum, time) => sum + Math.pow(time - avgPlaytime, 2), 0) / playtimes.length;
      const stdDev = Math.sqrt(variance);
      
      // Lower standard deviation relative to mean indicates more consistent play
      const coefficientOfVariation = avgPlaytime > 0 ? stdDev / avgPlaytime : 1;
      consistencyFactor = Math.max(0, Math.min(1, 1 - (coefficientOfVariation / 2)));
    }
    
    // Combine engagement factors
    engagementFactor = (depthFactor * 0.4) + (varietyFactor * 0.3) + (consistencyFactor * 0.3);
  } else {
    // Fallback when no games list is available
    if (totalPlaytime > 0 && playedGames > 0) {
      const avgPlaytimePerGame = totalPlaytime / playedGames;
      engagementFactor = Math.min(avgPlaytimePerGame / 10, 1); // 10 hours as benchmark
    }
  }

  // 3. Enhanced Recency Factor (30% weight)
  let recencyFactor = 0;
  
  if (totalGames > 0) {
    const baseRecencyFactor = Math.min(recentlyPlayedGames / totalGames, 1);
    
    // Calculate clean streak
    const cleanStreak = calculateCleanStreak(gamesList);
    
    // Streak bonus (up to 20% boost for 7+ day streaks)
    const streakBonus = Math.min(cleanStreak / 7, 1) * 0.2;
    
    // New game engagement bonus
    let newGameBonus = 0;
    if (gamesList && gamesList.length > 0) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentlyAcquiredAndPlayed = gamesList.filter(game => {
        const acquisitionDate = game.acquisitionDate ? new Date(game.acquisitionDate) : null;
        const hasPlaytime = game.playtimeMinutes > 0;
        return acquisitionDate && acquisitionDate >= thirtyDaysAgo && hasPlaytime;
      }).length;
      
      if (recentlyAcquiredAndPlayed > 0) {
        newGameBonus = Math.min(recentlyAcquiredAndPlayed / 5, 1) * 0.1; // Up to 10% bonus
      }
    }
    
    recencyFactor = Math.min(baseRecencyFactor + streakBonus + newGameBonus, 1);
  }

  // Calculate final clean score
  const cleanScore = Math.round(
    (completionRate * 0.4 + engagementFactor * 0.3 + recencyFactor * 0.3) * 100
  );
  
  // Find appropriate tier
  const tier = CLEAN_SCORE_TIERS.find(
    tier => cleanScore >= tier.range[0] && cleanScore <= tier.range[1]
  ) || CLEAN_SCORE_TIERS[CLEAN_SCORE_TIERS.length - 1];
  
  // Calculate clean streak for return
  const finalCleanStreak = calculateCleanStreak(gamesList);
  
  return {
    cleanScore,
    breakdown: {
      completionRate: Math.round(completionRate * 100),
      engagementFactor: Math.round(engagementFactor * 100),
      recencyFactor: Math.round(recencyFactor * 100)
    },
    tier,
    cleanStreak: finalCleanStreak
  };
};
