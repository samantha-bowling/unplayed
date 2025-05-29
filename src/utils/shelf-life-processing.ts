
import { getBestGameImage } from './image-utils';

/**
 * Efficiently processes shelf life data with optimized sorting by RELEASE DATE
 */
export const processShelfLife = (unplayedItems: any[]): any[] => {
  // Sort by RELEASE DATE (oldest games first) instead of acquisition date
  return unplayedItems
    .filter(item => item.games?.release_date) // Only include games with release dates
    .map(item => ({
      item,
      timestamp: new Date(item.games.release_date || '').getTime()
    }))
    .sort((a, b) => a.timestamp - b.timestamp) // Oldest release date first
    .map(({ item }) => ({
      id: item.game_id,
      name: item.games?.name || 'Unknown Game',
      addedDate: item.acquisition_date || new Date().toISOString(),
      releaseDate: item.games?.release_date || null,
      header_image: item.games?.header_image,
      image: item.games?.image_url
    }));
};

/**
 * Efficiently processes library preview with Fisher-Yates shuffle
 */
export const processLibraryPreview = (items: any[]): any[] => {
  // Filter non-hidden games first
  const visibleGames = items.filter(item => !item.hidden);
  
  // Fisher-Yates shuffle for better randomization
  const shuffled = [...visibleGames];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled
    .slice(0, 8)
    .map(item => ({
      id: item.game_id,
      name: item.games?.name || 'Unknown Game',
      image: getBestGameImage(item.games?.header_image, item.games?.image_url),
      playtime: item.playtime_minutes || 0
    }));
};
