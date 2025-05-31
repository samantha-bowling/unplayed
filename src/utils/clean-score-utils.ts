import { CleanScoreTier, LegacyCleanScoreBreakdown } from '@/types/unplayed-data.types';

// Clean Score tiers configuration
export const CLEAN_SCORE_TIERS: CleanScoreTier[] = [
  { name: 'Pristine Collection', color: '#4ade80', range: [90, 100] },
  { name: 'Dust-Free Shelf', color: '#22d3ee', range: [75, 89] },
  { name: 'Reasonably Clean', color: '#60a5fa', range: [50, 74] },
  { name: 'Needs a Wipe', color: '#f59e0b', range: [25, 49] },
  { name: 'Filthy Casual', color: '#f87171', range: [0, 24] }
];

/**
 * Enhanced Clean Streak calculation with proper start/end dates
 */
export const calculateCleanStreak = (gamesList: any[]): {
  streak: number;
  streakQuality: 'bronze' | 'silver' | 'gold';
  isActive: boolean;
  metadata: {
    gracePeriodUsed: boolean;
    lastPlayDate: string | null;
    averageSessionLength: number;
    streakStartDate: string | null;
    streakEndDate: string | null;
    daysSinceEnd: number | null;
  };
} => {
  if (!gamesList || gamesList.length === 0) {
    return {
      streak: 0,
      streakQuality: 'bronze',
      isActive: false,
      metadata: {
        gracePeriodUsed: false,
        lastPlayDate: null,
        averageSessionLength: 0,
        streakStartDate: null,
        streakEndDate: null,
        daysSinceEnd: null
      }
    };
  }

  // Group playtime by date
  const playTimeByDate = new Map<string, number>();
  
  gamesList.forEach(game => {
    if (game.lastPlayed || game.last_played_date) {
      const playDate = new Date(game.lastPlayed || game.last_played_date);
      const dateStr = playDate.toISOString().split('T')[0];
      const playtime = game.playtimeMinutes || 0;
      
      playTimeByDate.set(dateStr, (playTimeByDate.get(dateStr) || 0) + playtime);
    }
  });

  if (playTimeByDate.size === 0) {
    return {
      streak: 0,
      streakQuality: 'bronze',
      isActive: false,
      metadata: {
        gracePeriodUsed: false,
        lastPlayDate: null,
        averageSessionLength: 0,
        streakStartDate: null,
        streakEndDate: null,
        daysSinceEnd: null
      }
    };
  }

  // Get qualifying days (30+ minutes) sorted by date
  const qualifyingDays = Array.from(playTimeByDate.entries())
    .filter(([_, minutes]) => minutes >= 30)
    .map(([date, minutes]) => ({ date, minutes }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Most recent first

  if (qualifyingDays.length === 0) {
    return {
      streak: 0,
      streakQuality: 'bronze',
      isActive: false,
      metadata: {
        gracePeriodUsed: false,
        lastPlayDate: null,
        averageSessionLength: 0,
        streakStartDate: null,
        streakEndDate: null,
        daysSinceEnd: null
      }
    };
  }

  // Calculate streak by finding consecutive days from most recent
  let streak = 0;
  let streakStartDate: string | null = null;
  let streakEndDate: string | null = null;
  let isActive = false;
  
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const yesterdayStr = new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  // Check if streak is active (played today or yesterday)
  const mostRecentDay = qualifyingDays[0].date;
  isActive = mostRecentDay === todayStr || mostRecentDay === yesterdayStr;
  
  if (isActive) {
    // Count consecutive days from most recent
    let currentDate = new Date(mostRecentDay);
    streakEndDate = mostRecentDay;
    
    for (let i = 0; i < qualifyingDays.length; i++) {
      const dayData = qualifyingDays[i];
      const expectedDate = new Date(currentDate);
      expectedDate.setDate(expectedDate.getDate() - i);
      const expectedDateStr = expectedDate.toISOString().split('T')[0];
      
      if (dayData.date === expectedDateStr) {
        streak++;
        streakStartDate = dayData.date;
      } else {
        break;
      }
    }
  } else {
    // Find the most recent completed streak
    streak = 1;
    streakEndDate = mostRecentDay;
    streakStartDate = mostRecentDay;
    
    // Look backwards for consecutive days
    let currentDate = new Date(mostRecentDay);
    for (let i = 1; i < qualifyingDays.length; i++) {
      currentDate.setDate(currentDate.getDate() - 1);
      const expectedDateStr = currentDate.toISOString().split('T')[0];
      
      if (qualifyingDays[i] && qualifyingDays[i].date === expectedDateStr) {
        streak++;
        streakStartDate = qualifyingDays[i].date;
      } else {
        break;
      }
    }
  }

  // Calculate days since streak ended (if not active)
  let daysSinceEnd: number | null = null;
  if (!isActive && streakEndDate) {
    const endDate = new Date(streakEndDate);
    daysSinceEnd = Math.floor((today.getTime() - endDate.getTime()) / (24 * 60 * 60 * 1000));
  }

  // Calculate average session length from qualifying days
  const totalMinutes = qualifyingDays.reduce((sum, day) => sum + day.minutes, 0);
  const averageSessionLength = Math.round(totalMinutes / qualifyingDays.length);

  // Determine streak quality
  let streakQuality: 'bronze' | 'silver' | 'gold' = 'bronze';
  if (streak >= 30) {
    streakQuality = 'gold';
  } else if (streak >= 7) {
    streakQuality = 'silver';
  }

  return {
    streak,
    streakQuality,
    isActive,
    metadata: {
      gracePeriodUsed: false,
      lastPlayDate: mostRecentDay,
      averageSessionLength,
      streakStartDate,
      streakEndDate,
      daysSinceEnd
    }
  };
};

/**
 * SIMPLIFIED Recently Played Games calculation
 * Count games played in the last 30 days (ANY playtime activity)
 */
export const calculateRecentlyPlayedGames = (gamesList: any[]): number => {
  if (!gamesList || gamesList.length === 0) return 0;
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  return gamesList.filter(game => {
    // Check if game has last played date
    const lastPlayedDate = game.lastPlayed || game.last_played_date;
    if (!lastPlayedDate) return false;
    
    // Check if played within last 30 days (removed playtime threshold for simplicity)
    const playDate = new Date(lastPlayedDate);
    return playDate >= thirtyDaysAgo;
  }).length;
};

/**
 * Calculate recently played unplayed games
 * Games that had 0 playtime when user signed up but now have playtime
 */
export const calculateRecentlyPlayedUnplayed = (gamesList: any[], userCreatedDate?: string): number => {
  if (!gamesList || gamesList.length === 0) return 0;
  
  // For now, we'll estimate this based on games with low playtime that were added recently
  // This is a simplified calculation until we add proper tracking
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  return gamesList.filter(game => {
    const hasPlaytime = (game.playtimeMinutes || 0) > 0;
    const hasLowPlaytime = (game.playtimeMinutes || 0) < 180; // Less than 3 hours suggests recent start
    const wasAddedRecently = game.added ? new Date(game.added) >= thirtyDaysAgo : false;
    
    return hasPlaytime && hasLowPlaytime && wasAddedRecently;
  }).length;
};

/**
 * Enhanced Clean Score calculation using only available data
 * Returns legacy format for backward compatibility
 */
export const calculateCleanScore = (
  playedGames: number, 
  totalGames: number,
  totalPlaytime: number,
  gamesList: any[] = [],
  recentlyPlayedGames?: number // Now optional, we'll calculate it ourselves
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

  // Calculate recently played games using our simplified method
  const calculatedRecentlyPlayed = calculateRecentlyPlayedGames(gamesList);

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
    const playedGamesList = gamesList.filter(g => (g.playtimeMinutes || 0) > 0);
    let consistencyFactor = 0.5; // Default middle value
    
    if (playedGamesList.length > 0) {
      const playtimes = playedGamesList.map(g => (g.playtimeMinutes || 0) / 60);
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
    const baseRecencyFactor = Math.min(calculatedRecentlyPlayed / totalGames, 1);
    
    // Calculate simplified clean streak
    const streakData = calculateCleanStreak(gamesList);
    
    // Streak bonus (up to 20% boost for quality streaks)
    const streakBonus = Math.min(streakData.streak / 10, 1) * 0.2;
    
    // New game engagement bonus
    let newGameBonus = 0;
    if (gamesList && gamesList.length > 0) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentlyAcquiredAndPlayed = gamesList.filter(game => {
        const acquisitionDate = game.added || game.acquisition_date ? new Date(game.added || game.acquisition_date) : null;
        const hasPlaytime = (game.playtimeMinutes || 0) > 0;
        return acquisitionDate && acquisitionDate >= thirtyDaysAgo && hasPlaytime;
      }).length;
      
      if (recentlyAcquiredAndPlayed > 0) {
        newGameBonus = Math.min(recentlyAcquiredAndPlayed / 5, 1) * 0.1; // Up to 10% bonus
      }
    }
    
    recencyFactor = Math.min(baseRecencyFactor + streakBonus + newGameBonus, 1);
  }

  // Calculate recently played unplayed games
  const recentlyPlayedUnplayed = calculateRecentlyPlayedUnplayed(gamesList);

  // Calculate final clean score
  const cleanScore = Math.round(
    (completionRate * 0.4 + engagementFactor * 0.3 + recencyFactor * 0.3) * 100
  );
  
  // Find appropriate tier
  const tier = CLEAN_SCORE_TIERS.find(
    tier => cleanScore >= tier.range[0] && cleanScore <= tier.range[1]
  ) || CLEAN_SCORE_TIERS[CLEAN_SCORE_TIERS.length - 1];
  
  // Get clean streak data
  const streakData = calculateCleanStreak(gamesList);
  
  return {
    cleanScore,
    breakdown: {
      completionRate: Math.round(completionRate * 100),
      engagementFactor: Math.round(engagementFactor * 100),
      recencyFactor: Math.round(recencyFactor * 100)
    },
    tier,
    cleanStreak: streakData.streak,
    recentlyPlayedUnplayed,
    streakMetadata: streakData.metadata
  };
};
