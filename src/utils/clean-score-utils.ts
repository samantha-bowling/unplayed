
import { CleanScoreTier, LegacyCleanScoreBreakdown } from '@/types/unplayed-data.types';
import { calculateRecentlyPlayedGames, calculateRecentlyPlayedUnplayed, calculateCleanStreak } from './activity-insights';

// Clean Score tiers configuration
export const CLEAN_SCORE_TIERS: CleanScoreTier[] = [
  { name: 'Pristine Collection', color: '#4ade80', range: [90, 100] },
  { name: 'Dust-Free Shelf', color: '#22d3ee', range: [75, 89] },
  { name: 'Reasonably Clean', color: '#60a5fa', range: [50, 74] },
  { name: 'Needs a Wipe', color: '#f59e0b', range: [25, 49] },
  { name: 'Filthy Casual', color: '#f87171', range: [0, 24] }
];

/**
 * Enhanced Clean Score calculation using standardized activity insights
 * Updated with new weightings: Backlog Conversion (35%), Recency (30%), Session Depth (20%), Diversity (15%)
 */
export const calculateCleanScore = (
  playedGames: number, 
  totalGames: number,
  totalPlaytime: number,
  gamesList: any[] = [],
  recentlyPlayedGames?: number // Now optional, we'll calculate it ourselves using fixed logic
): { 
  cleanScore: number, 
  breakdown: LegacyCleanScoreBreakdown, 
  tier: CleanScoreTier,
  cleanStreak: number,
  recentlyPlayedUnplayed: number,
  streakMetadata?: any
} => {
  // Handle edge cases
  if (totalGames === 0) {
    const fallbackTier = CLEAN_SCORE_TIERS[CLEAN_SCORE_TIERS.length - 1];
    return {
      cleanScore: 0,
      breakdown: { completionRate: 0, engagementFactor: 0, recencyFactor: 0 },
      tier: fallbackTier,
      cleanStreak: 0,
      recentlyPlayedUnplayed: 0
    };
  }

  // Use standardized calculation for recently played games (fixed logic)
  const calculatedRecentlyPlayed = calculateRecentlyPlayedGames(gamesList);

  // Small library bonus (libraries under 10 games get a boost)
  let adjustedTotalGames = totalGames;
  let adjustedPlayedGames = playedGames;
  
  if (totalGames < 10) {
    const smallLibraryMultiplier = 1.2;
    adjustedPlayedGames = Math.min(playedGames * smallLibraryMultiplier, totalGames);
  }

  // 1. Completion Rate (35% weight) - INCREASED from 40% to align with new backend weighting
  const completionRate = adjustedTotalGames > 0 ? adjustedPlayedGames / adjustedTotalGames : 0;

  // 2. Enhanced Engagement Factor (20% weight) - REDUCED from 30% to align with Session Depth
  let engagementFactor = 0;
  
  if (gamesList && gamesList.length > 0) {
    // Calculate user's average playtime per game
    const totalPlaytimeHours = totalPlaytime;
    const avgPlaytimePerGame = totalPlaytimeHours / Math.max(playedGames, 1);
    
    // Adaptive benchmark based on user's own data
    const userEngagementThreshold = Math.max(avgPlaytimePerGame * 2, 2); // Minimum 2 hours
    
    // Depth factor: How deeply user plays their games
    const depthFactor = Math.min(avgPlaytimePerGame / userEngagementThreshold, 1);
    
    // Variety factor: What percentage of library has been touched
    const varietyFactor = completionRate;
    
    // Consistency factor: Based on playtime distribution
    const playedGamesList = gamesList.filter(g => (g.playtimeMinutes || g.userGame?.playtime_minutes || 0) > 0);
    let consistencyFactor = 0.5; // Default middle value
    
    if (playedGamesList.length > 0) {
      const playtimes = playedGamesList.map(g => (g.playtimeMinutes || g.userGame?.playtime_minutes || 0) / 60);
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

  // 3. Enhanced Recency Factor (30% weight) - MAINTAINED to align with new backend weighting
  let recencyFactor = 0;
  
  if (totalGames > 0) {
    const baseRecencyFactor = Math.min(calculatedRecentlyPlayed / totalGames, 1);
    
    // Calculate clean streak using standardized method
    const cleanStreakDays = calculateCleanStreak(gamesList);
    
    // Streak bonus (up to 20% boost for quality streaks)
    const streakBonus = Math.min(cleanStreakDays / 10, 1) * 0.2;
    
    // New game engagement bonus
    let newGameBonus = 0;
    if (gamesList && gamesList.length > 0) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentlyAcquiredAndPlayed = gamesList.filter(game => {
        const acquisitionDate = game.added || game.acquisition_date || game.userGame?.acquisition_date;
        const hasPlaytime = (game.playtimeMinutes || game.userGame?.playtime_minutes || 0) > 0;
        
        if (!acquisitionDate) return false;
        
        const acqDate = new Date(acquisitionDate);
        return acqDate >= thirtyDaysAgo && hasPlaytime;
      }).length;
      
      if (recentlyAcquiredAndPlayed > 0) {
        newGameBonus = Math.min(recentlyAcquiredAndPlayed / 5, 1) * 0.1; // Up to 10% bonus
      }
    }
    
    recencyFactor = Math.min(baseRecencyFactor + streakBonus + newGameBonus, 1);
  }

  // Calculate recently played unplayed games using standardized method
  const recentlyPlayedUnplayed = calculateRecentlyPlayedUnplayed(gamesList);

  // Calculate final clean score using NEW WEIGHTINGS
  // Backlog Conversion: 35%, Recency: 30%, Session Depth: 20%, Diversity: 15%
  const cleanScore = Math.round(
    (completionRate * 0.35 + recencyFactor * 0.30 + engagementFactor * 0.20 + (calculatedRecentlyPlayed / Math.max(totalGames, 1)) * 0.15) * 100
  );
  
  // Find appropriate tier
  const tier = CLEAN_SCORE_TIERS.find(
    tier => cleanScore >= tier.range[0] && cleanScore <= tier.range[1]
  ) || CLEAN_SCORE_TIERS[CLEAN_SCORE_TIERS.length - 1];
  
  // Get clean streak data using standardized method
  const cleanStreakDays = calculateCleanStreak(gamesList);
  
  return {
    cleanScore,
    breakdown: {
      completionRate: Math.round(completionRate * 100),
      engagementFactor: Math.round(engagementFactor * 100),
      recencyFactor: Math.round(recencyFactor * 100)
    },
    tier,
    cleanStreak: cleanStreakDays,
    recentlyPlayedUnplayed,
    streakMetadata: {
      gracePeriodUsed: false,
      lastPlayDate: null,
      averageSessionLength: totalPlaytime / Math.max(playedGames, 1),
      streakStartDate: null,
      streakEndDate: null,
      daysSinceEnd: null
    }
  };
};
