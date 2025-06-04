
/**
 * Activity Insights Utility
 * Provides standardized calculations for user activity metrics
 */

export interface ActivityInsights {
  recentlyPlayedGames: number;
  recentlyPlayedUnplayed: number;
  cleanStreak: number;
  totalPlaytimeHours: number;
  averageSessionLength: number;
}

/**
 * Calculate recently played games (any playtime > 0 in last 30 days)
 * Updated to remove 30+ minute requirement for consistency
 */
export const calculateRecentlyPlayedGames = (gamesList: any[]): number => {
  if (!gamesList || gamesList.length === 0) return 0;
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  return gamesList.filter(game => {
    const lastPlayedDate = game.lastPlayed || game.last_played_date || game.userGame?.last_played_date;
    const playtimeMinutes = game.playtimeMinutes || game.userGame?.playtime_minutes || 0;
    
    if (!lastPlayedDate || playtimeMinutes === 0) return false;
    
    const playDate = new Date(lastPlayedDate);
    return playDate >= thirtyDaysAgo;
  }).length;
};

/**
 * Calculate recently played unplayed games
 * Games that had 0 playtime initially but now have some playtime
 */
export const calculateRecentlyPlayedUnplayed = (gamesList: any[]): number => {
  if (!gamesList || gamesList.length === 0) return 0;
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  return gamesList.filter(game => {
    const playtimeMinutes = game.playtimeMinutes || game.userGame?.playtime_minutes || 0;
    const lastPlayedDate = game.lastPlayed || game.last_played_date || game.userGame?.last_played_date;
    const acquisitionDate = game.added || game.acquisition_date || game.userGame?.acquisition_date;
    
    // Must have playtime and be recently acquired/played
    if (playtimeMinutes === 0 || !lastPlayedDate) return false;
    
    const playDate = new Date(lastPlayedDate);
    const isRecentPlay = playDate >= thirtyDaysAgo;
    
    // If we have acquisition date, check if it's recent too
    if (acquisitionDate) {
      const acquireDate = new Date(acquisitionDate);
      return isRecentPlay && acquireDate >= thirtyDaysAgo && playtimeMinutes < 180; // Less than 3 hours suggests recent start
    }
    
    return isRecentPlay && playtimeMinutes < 180;
  }).length;
};

/**
 * Calculate simplified clean streak
 */
export const calculateCleanStreak = (gamesList: any[]): number => {
  if (!gamesList || gamesList.length === 0) return 0;
  
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const hasRecentPlay = gamesList.some(game => {
    const lastPlayedDate = game.lastPlayed || game.last_played_date || game.userGame?.last_played_date;
    const playtimeMinutes = game.playtimeMinutes || game.userGame?.playtime_minutes || 0;
    
    if (!lastPlayedDate || playtimeMinutes === 0) return false;
    
    const playDate = new Date(lastPlayedDate);
    return playDate >= oneDayAgo;
  });
  
  if (hasRecentPlay) return 7;
  
  const hasThreeDayPlay = gamesList.some(game => {
    const lastPlayedDate = game.lastPlayed || game.last_played_date || game.userGame?.last_played_date;
    const playtimeMinutes = game.playtimeMinutes || game.userGame?.playtime_minutes || 0;
    
    if (!lastPlayedDate || playtimeMinutes === 0) return false;
    
    const playDate = new Date(lastPlayedDate);
    return playDate >= threeDaysAgo;
  });
  
  if (hasThreeDayPlay) return 3;
  
  const hasSevenDayPlay = gamesList.some(game => {
    const lastPlayedDate = game.lastPlayed || game.last_played_date || game.userGame?.last_played_date;
    const playtimeMinutes = game.playtimeMinutes || game.userGame?.playtime_minutes || 0;
    
    if (!lastPlayedDate || playtimeMinutes === 0) return false;
    
    const playDate = new Date(lastPlayedDate);
    return playDate >= sevenDaysAgo;
  });
  
  return hasSevenDayPlay ? 1 : 0;
};

/**
 * Calculate comprehensive activity insights
 */
export const calculateActivityInsights = (gamesList: any[]): ActivityInsights => {
  const recentlyPlayedGames = calculateRecentlyPlayedGames(gamesList);
  const recentlyPlayedUnplayed = calculateRecentlyPlayedUnplayed(gamesList);
  const cleanStreak = calculateCleanStreak(gamesList);
  
  // Calculate total playtime
  const totalPlaytimeMinutes = gamesList.reduce((total, game) => {
    const playtime = game.playtimeMinutes || game.userGame?.playtime_minutes || 0;
    return total + playtime;
  }, 0);
  
  const totalPlaytimeHours = totalPlaytimeMinutes / 60;
  
  // Calculate average session length for played games
  const playedGames = gamesList.filter(game => {
    const playtime = game.playtimeMinutes || game.userGame?.playtime_minutes || 0;
    return playtime > 0;
  });
  
  const averageSessionLength = playedGames.length > 0 
    ? totalPlaytimeMinutes / playedGames.length / 60 
    : 0;
  
  return {
    recentlyPlayedGames,
    recentlyPlayedUnplayed,
    cleanStreak,
    totalPlaytimeHours,
    averageSessionLength
  };
};
