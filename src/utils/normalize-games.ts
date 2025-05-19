
import { UnplayedDataType, GameListItem } from '@/types/unplayed-data.types';

/**
 * Utility to normalize game data coming from various sources
 */

export const createEmptyGamesList = (): GameListItem[] => {
  return [];
};

export const buildGamesList = (data: any[]): GameListItem[] => {
  if (!data || !Array.isArray(data)) {
    return [];
  }
  
  return data.map(item => ({
    id: item.game_id || item.id,
    name: item.games?.name || item.name || 'Unknown Game',
    imageUrl: item.games?.image_url || item.games?.header_image || item.img_icon_url || '',
    playtimeMinutes: item.playtime_minutes || item.playtime_forever || 0,
    lastPlayed: item.last_played_date || null,
    genres: item.games?.genres || [],
    hidden: item.hidden || false
  }));
};

export const normalizeDemoGames = (games: any): UnplayedDataType => {
  if (!games) {
    return {
      unplayedGames: 0,
      totalGames: 0,
      dustScore: 0,
      totalPlaytime: 0,
      totalSpent: 0,
      potentialGameplayHours: 0,
      genres: [],
      shelfLife: [],
      library: [],
      gamesList: [],
      cleanScore: 0,
      cleanScoreBreakdown: {
        completionRate: 0,
        engagementFactor: 0,
        recencyFactor: 0
      },
      cleanTier: {
        name: 'Unknown',
        color: '#ccc',
        range: [0, 0]
      },
      cleanStreak: 0,
      recentlyPlayedCount: 0
    };
  }
  
  // Convert games.library to gamesList if needed
  const gamesList = Array.isArray(games) 
    ? games.map(game => ({
        id: game.appid || game.id,
        name: game.name,
        imageUrl: game.img_icon_url || '',
        playtimeMinutes: game.playtime_forever || 0,
        lastPlayed: null,
        genres: [],
        hidden: false
      }))
    : games.gamesList || buildGamesList(games.library || []);
  
  // If games is already an UnplayedDataType, return it
  if ('unplayedGames' in games && 'totalGames' in games) {
    return {
      ...games,
      gamesList
    };
  }
  
  // If games.library exists, use it to create a basic structure
  if (games.library) {
    return {
      unplayedGames: games.unplayedGames || 0,
      totalGames: games.totalGames || 0,
      dustScore: games.dustScore || 0,
      totalPlaytime: games.totalPlaytime || 0,
      totalSpent: games.totalSpent || 0,
      potentialGameplayHours: games.potentialGameplayHours || 0,
      genres: games.genres || [],
      shelfLife: games.shelfLife || [],
      library: games.library || [],
      gamesList,
      cleanScore: games.cleanScore || 0,
      cleanScoreBreakdown: games.cleanScoreBreakdown || {
        completionRate: 0,
        engagementFactor: 0,
        recencyFactor: 0
      },
      cleanTier: games.cleanTier || {
        name: 'Unknown',
        color: '#ccc',
        range: [0, 0]
      },
      cleanStreak: games.cleanStreak || 0,
      recentlyPlayedCount: games.recentlyPlayedCount || 0
    };
  }
  
  // If we have a simple array, convert it to the expected structure
  return {
    unplayedGames: 0,
    totalGames: Array.isArray(games) ? games.length : 0,
    dustScore: 0,
    totalPlaytime: 0,
    totalSpent: 0,
    potentialGameplayHours: 0,
    genres: [],
    shelfLife: [],
    library: [],
    gamesList,
    cleanScore: 0,
    cleanScoreBreakdown: {
      completionRate: 0,
      engagementFactor: 0,
      recencyFactor: 0
    },
    cleanTier: {
      name: 'Unknown',
      color: '#ccc',
      range: [0, 0]
    },
    cleanStreak: 0,
    recentlyPlayedCount: 0
  };
};
