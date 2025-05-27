
import { getBestGameImage } from './image-utils';

/**
 * Efficiently processes shelf life data with optimized sorting
 */
export const processShelfLife = (unplayedItems: any[]): any[] => {
  // Use a more efficient sort approach for dates
  return unplayedItems
    .map(item => ({
      item,
      timestamp: new Date(item.acquisition_date || '').getTime()
    }))
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(0, 5)
    .map(({ item }) => ({
      id: item.game_id,
      name: item.games?.name || 'Unknown Game',
      addedDate: item.acquisition_date || new Date().toISOString(),
      image: getBestGameImage(item.games?.header_image, item.games?.image_url)
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
