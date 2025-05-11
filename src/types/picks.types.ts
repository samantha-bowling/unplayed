
import { GameListItem } from '@/types/unplayed-data.types';

/**
 * Filters that can be applied to game picks
 */
export interface GamePickFilters {
  /** Mood filter (e.g., "story-rich", "relaxing") */
  mood?: string;
  /** Genre filter (e.g., "RPG", "Adventure") */
  genre?: string;
  /** Source of the games (e.g., "shelfLife", "library", "genre") */
  source?: string;
  /** Support for additional properties for future extension */
  [key: string]: string | number | boolean | null | object | Array<any> | undefined;
}

/**
 * Represents a user's game pick history item
 */
export interface GamePick {
  /** Unique identifier for the pick */
  id: string;
  /** ID of the picked game */
  game_id: number;
  /** Timestamp when the game was picked */
  picked_at: string;
  /** Filters that were applied when the game was picked */
  filters: GamePickFilters;
  /** Optional game data if joined with game information */
  game?: GameListItem;
}
