
import { UnplayedDataType, GameListItem } from '@/types/unplayed-data.types';

/**
 * Utility to normalize game data coming from various sources
 * Standardizing on 'name' and 'image' property names throughout the application
 */

export const createEmptyGamesList = (): GameListItem[] => {
  return [];
};

export const buildGamesList = (data: any[]): GameListItem[] => {
  if (!data || !Array.isArray(data)) {
    console.log('buildGamesList: Invalid data provided', data);
    return [];
  }
  
  console.log('Building games list from data:', data.length, 'items');
  
  return data.map(item => ({
    id: item.game_id || item.id || item.appid,
    name: item.games?.name || item.name || 'Unknown Game',
    image: item.games?.image_url || item.games?.header_image || item.image || item.img_icon_url || '',
    header_image: item.games?.header_image || item.header_image || null,
    playtimeMinutes: item.playtime_minutes || item.playtime_forever || 0,
    releaseDate: item.games?.release_date || item.release_date || null,
    release_date: item.games?.release_date || item.release_date || null,
    price: item.games?.price_cents ? item.games.price_cents / 100 : undefined,
    price_cents: item.games?.price_cents || item.price_cents || undefined,
    genres: item.games?.genres || item.genres || [],
    categories: item.games?.categories || item.categories || [],
    developer: item.games?.developer || item.developer || [],
    publisher: item.games?.publisher || item.publisher || [],
    description: item.games?.description || item.description || undefined,
    platforms: item.games?.platforms || item.platforms || [],
    screenshots: item.games?.screenshots || item.screenshots || []
  }));
};

export const normalizeDemoGames = (games: any): UnplayedDataType => {
  console.log('normalizeDemoGames input:', games ? typeof games : 'undefined');
  
  if (!games) {
    return {
      unplayedGames: 0,
      totalGames: 0,
      dustScore: 0,
      totalPlaytime: 0,
      totalSpent: 0,
      unplayedSpent: 0,
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
  
  // Enhanced demo games processing with proper image field mapping
  const gamesList = Array.isArray(games) 
    ? games.map(game => ({
        id: game.appid || game.id,
        name: game.name || game.title || 'Unknown Game',
        image: game.image || game.imageUrl || game.img_icon_url || '',
        image_url: game.image_url || game.image || game.imageUrl || game.img_icon_url || '',
        header_image: game.header_image || game.image || game.imageUrl || '',
        playtimeMinutes: game.playtime_forever || game.playtime || 0,
        releaseDate: game.releaseDate || game.release_date || null,
        release_date: game.releaseDate || game.release_date || null,
        genres: game.genres || [],
        categories: game.categories || [],
        price: game.price,
        price_cents: game.price_cents,
        dustScore: game.dustScore,
        metacritic_score: game.metacritic_score
      }))
    : games.gamesList?.map((game: any) => ({
        ...game,
        // Ensure all image fields are properly mapped for demo mode
        image_url: game.image_url || game.image || '',
        header_image: game.header_image || game.image || '',
        release_date: game.release_date || game.releaseDate || null
      })) || buildGamesList(games.library || []);
  
  console.log('normalizeDemoGames processed gamesList:', gamesList.length, 'items');
  console.log('Sample demo game with image fields:', gamesList[0] ? {
    name: gamesList[0].name,
    image: gamesList[0].image,
    image_url: gamesList[0].image_url,
    header_image: gamesList[0].header_image
  } : 'No games');
  
  // If games is already an UnplayedDataType, return it with updated gamesList
  if ('unplayedGames' in games && 'totalGames' in games) {
    return {
      ...games,
      gamesList
    };
  }
  
  // If games.library exists, use it to create a basic structure
  if (games.library) {
    const formattedLibrary = games.library.map((item: any) => ({
      ...item,
      // Ensure image is set for consistency
      image: item.image || item.imageUrl || ''
    }));

    return {
      unplayedGames: games.unplayedGames || 0,
      totalGames: games.totalGames || 0,
      dustScore: games.dustScore || 0,
      totalPlaytime: games.totalPlaytime || 0,
      totalSpent: games.totalSpent || 0,
      unplayedSpent: games.unplayedSpent || 0,
      potentialGameplayHours: games.potentialGameplayHours || 0,
      genres: games.genres || [],
      shelfLife: games.shelfLife?.map((item: any) => ({
        ...item,
        // Ensure image is always present
        image: item.image || item.imageUrl || ''
      })) || [],
      library: formattedLibrary || [],
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
    unplayedSpent: 0,
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
