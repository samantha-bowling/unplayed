
import { GameListItem } from '@/types/unplayed-data.types';

/**
 * Utility functions for mapping between different game ID types
 */

/**
 * Find a game in the library by its app ID
 */
export const findGameByAppId = (
  gamesList: GameListItem[],
  appId: number
): GameListItem | undefined => {
  return gamesList.find(game => game.id === appId);
};

/**
 * Map a mood category to relevant game genres
 */
export const mapMoodToGenres = (mood: string): string[] => {
  switch (mood) {
    case 'cozy':
      return ['Puzzle', 'Casual', 'Simulation', 'Indie'];
    case 'adventure':
      return ['Adventure', 'Open World', 'Exploration', 'Action-Adventure'];
    case 'challenge':
      return ['Difficult', 'Action', 'Strategy', 'Fighting', 'Souls-like'];
    case 'story':
      return ['RPG', 'Visual Novel', 'Story Rich', 'Narrative'];
    case 'quick':
      return ['Short', 'Casual', 'Indie', 'Arcade'];
    default:
      return [];
  }
};

/**
 * Filter games by mood
 */
export const filterGamesByMood = (
  games: GameListItem[],
  mood: string
): GameListItem[] => {
  if (!mood) return games;
  
  const relevantGenres = mapMoodToGenres(mood);
  if (relevantGenres.length === 0) return games;
  
  return games.filter(game => {
    // Check if game has genres property before accessing it
    if (!game.genres) return false;
    
    return game.genres.some(genre => 
      relevantGenres.some(relevantGenre => 
        genre.toLowerCase().includes(relevantGenre.toLowerCase())
      )
    );
  });
};

/**
 * Filter out recently picked games to prevent duplicates
 */
export const filterOutRecentPicks = (
  games: GameListItem[],
  recentPicks: number[],
  minPoolSize: number = 5
): GameListItem[] => {
  if (!recentPicks || recentPicks.length === 0) return games;
  
  // If filtering would leave too few games, don't filter
  if (games.length - recentPicks.length < minPoolSize) {
    return games;
  }
  
  return games.filter(game => !recentPicks.includes(game.id));
};
