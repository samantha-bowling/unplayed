
import { LibraryGame } from '@/hooks/use-library-data';
import { getBestGameImage, formatGameTitle } from '@/utils/image-utils';

export interface ProcessedGameData {
  id: string;
  gameId: number;
  title: string;
  formattedTitle: string;
  imageUrl: string;
  dustScore: number | null;
  playtimeMinutes: number | null;
  isHidden: boolean | null;
  notes: string | null;
  userGameId: string;
}

/**
 * Pre-processes game data to avoid repeated calculations during render
 */
export const preprocessGameData = (games: LibraryGame[]): ProcessedGameData[] => {
  return games.map(game => {
    const imageUrl = getBestGameImage(game.header_image, game.image_url, game.id);
    const formattedTitle = formatGameTitle(game.name);
    
    return {
      id: `game-${game.id}`,
      gameId: game.id,
      title: game.name,
      formattedTitle,
      imageUrl,
      dustScore: game.userGame.dust_score,
      playtimeMinutes: game.userGame.playtime_minutes,
      isHidden: game.userGame.hidden,
      notes: game.userGame.notes,
      userGameId: game.userGame.id
    };
  });
};

/**
 * Memoized comparison function for game data
 */
export const areGamesEqual = (
  prevGames: LibraryGame[],
  nextGames: LibraryGame[]
): boolean => {
  if (prevGames.length !== nextGames.length) return false;
  
  // Quick comparison of first few games' key properties
  const sampleSize = Math.min(3, prevGames.length);
  for (let i = 0; i < sampleSize; i++) {
    const prev = prevGames[i];
    const next = nextGames[i];
    
    if (
      prev.id !== next.id ||
      prev.userGame.dust_score !== next.userGame.dust_score ||
      prev.userGame.hidden !== next.userGame.hidden ||
      prev.userGame.playtime_minutes !== next.userGame.playtime_minutes
    ) {
      return false;
    }
  }
  
  return true;
};
