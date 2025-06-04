
// Utility functions for calculating activity insights with consistent criteria

export interface ActivityInsightsData {
  recentlyActiveGames: number;
  valueChampion: {
    game: any;
    ratio: number;
    gameName: string;
  } | null;
  gamingStyle: {
    style: string;
    percentage: number;
  };
}

/**
 * Calculate recently active games with consistent 30+ minute session requirement
 */
export const calculateRecentlyActiveGames = (games: any[]): number => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return games.filter(game => {
    const playtime = game.userGame?.playtime_minutes || 0;
    const lastPlayed = game.userGame?.last_played_date;
    
    // Require both recent play AND minimum 30 minutes of playtime
    return playtime >= 30 && 
           lastPlayed && 
           new Date(lastPlayed) >= thirtyDaysAgo;
  }).length;
};

/**
 * Calculate value champion - best minutes per dollar ratio
 */
export const calculateValueChampion = (games: any[]): { game: any; ratio: number; gameName: string } | null => {
  const gamesWithPriceAndPlaytime = games.filter(game => {
    const playtime = game.userGame?.playtime_minutes || 0;
    const price = game.price_cents || 0;
    return playtime > 0 && price > 0;
  });

  if (gamesWithPriceAndPlaytime.length === 0) return null;

  const valueChampion = gamesWithPriceAndPlaytime.reduce((best, game) => {
    const playtime = game.userGame?.playtime_minutes || 0;
    const price = game.price_cents || 0;
    const valueRatio = playtime / (price / 100); // minutes per dollar
    
    const bestPlaytime = best.userGame?.playtime_minutes || 0;
    const bestPrice = best.price_cents || 0;
    const bestRatio = bestPlaytime / (bestPrice / 100);
    
    return valueRatio > bestRatio ? game : best;
  });

  const championPlaytime = valueChampion.userGame?.playtime_minutes || 0;
  const championPrice = valueChampion.price_cents || 0;
  const ratio = championPlaytime / (championPrice / 100);
  
  return {
    game: valueChampion,
    ratio: Math.round(ratio * 10) / 10, // Round to 1 decimal
    gameName: valueChampion.name || 'Unknown Game'
  };
};

/**
 * Calculate gaming style based on session lengths
 */
export const calculateGamingStyle = (games: any[]): { style: string; percentage: number } => {
  const playedGames = games.filter(game => {
    const playtime = game.userGame?.playtime_minutes || 0;
    return playtime > 0;
  });

  if (playedGames.length === 0) return { style: 'No Data', percentage: 0 };

  const shortSessions = playedGames.filter(game => {
    const playtime = game.userGame?.playtime_minutes || 0;
    return playtime > 0 && playtime < 120; // Less than 2 hours
  }).length;

  const longSessions = playedGames.filter(game => {
    const playtime = game.userGame?.playtime_minutes || 0;
    return playtime >= 300; // 5+ hours
  }).length;

  if (longSessions > shortSessions) {
    return { 
      style: 'Deep Diver', 
      percentage: Math.round((longSessions / playedGames.length) * 100)
    };
  } else if (shortSessions > longSessions) {
    return { 
      style: 'Quick Explorer', 
      percentage: Math.round((shortSessions / playedGames.length) * 100)
    };
  } else {
    return { 
      style: 'Balanced', 
      percentage: 50
    };
  }
};

/**
 * Get comprehensive activity insights for a user's library
 */
export const getActivityInsights = (games: any[]): ActivityInsightsData => {
  return {
    recentlyActiveGames: calculateRecentlyActiveGames(games),
    valueChampion: calculateValueChampion(games),
    gamingStyle: calculateGamingStyle(games)
  };
};
