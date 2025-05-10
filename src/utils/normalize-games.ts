
import { GameListItem, UnplayedDataType } from '@/types/unplayed-data.types';
import { DemoDataType } from '@/lib/demo-data';

/**
 * Normalizes demo game data to match the real data structure by ensuring
 * a consistent gamesList property is available
 */
export const normalizeDemoGames = (demoData: DemoDataType): UnplayedDataType => {
  // Map the library array to match our GameListItem structure
  const gamesList: GameListItem[] = demoData.library.map(game => ({
    id: game.id,
    title: game.title,
    playtimeMinutes: game.playtime,
    imageUrl: game.image,
    // Add some mock price data for consistency
    price: Math.floor(Math.random() * 60) + 5, // Random price between $5-$65
    releaseDate: null
  }));
  
  return {
    ...demoData,
    gamesList
  } as UnplayedDataType;
};

/**
 * Creates an empty game list to use as fallback
 */
export const createEmptyGamesList = (): GameListItem[] => {
  return [];
};

/**
 * Builds a game list from raw game data
 */
export const buildGamesList = (data: any[]): GameListItem[] => {
  return data.map(item => ({
    id: item.game_id,
    title: item.games?.name || 'Unknown Game',
    playtimeMinutes: item.playtime_minutes || 0,
    imageUrl: item.games?.header_image || item.games?.image_url || null,
    price: item.games?.price_cents ? item.games.price_cents / 100 : undefined,
    releaseDate: item.games?.release_date || null
  }));
};
