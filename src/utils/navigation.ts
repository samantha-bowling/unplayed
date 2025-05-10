
import { NavigateOptions } from "react-router-dom";

// Types for picker navigation state
export interface PickerNavigationState {
  genre?: string;
  mood?: string;
  source?: 'genre' | 'shelfLife' | 'library';
  shouldAutoSpin?: boolean;
}

// Interface for game pick filters
export interface GamePickFilters {
  mood?: string;
  source?: string;
  genre?: string;
}

/**
 * Creates navigation options with picker filter state
 * @param filterState State to preserve during navigation
 * @returns Navigation options for react-router useNavigate
 */
export const createPickerNavigation = (
  filterState: PickerNavigationState
): NavigateOptions => {
  return {
    state: filterState
  };
};

/**
 * Maps genre to appropriate mood for the picker
 * This is a simple mapping that can be expanded based on game categorization
 */
export const mapGenreToMood = (genre: string): string | null => {
  // Basic genre to mood mapping
  const genreMoodMap: Record<string, string> = {
    "RPG": "story-rich",
    "Adventure": "exploration",
    "Action": "intense",
    "Strategy": "thinking",
    "Simulation": "relaxing",
    "Sports": "competitive",
    "Racing": "fast-paced",
    "Puzzle": "creative"
    // Add more mappings as needed
  };

  return genreMoodMap[genre] || null;
};
