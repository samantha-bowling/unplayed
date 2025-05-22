
import { DemoDataType } from '@/lib/demo-data';

// Extended type for dust score breakdown
export interface DustScoreBreakdown {
  ageScore: number;
  ownershipScore: number;
  playtimeFactor: number;
}

// New type for clean score breakdown
export interface CleanScoreBreakdown {
  completionRate: number;
  engagementFactor: number;
  recencyFactor: number;
}

// Clean Score tier information
export interface CleanScoreTier {
  name: string;
  color: string;
  range: [number, number];
}

// Extended type for per-game dust data
export interface GameDustData {
  id: number;
  name: string;
  dustScore: number;
  addedDate: string;
  releaseDate: string | null;
  playtimeMinutes: number;
  image: string | null;
}

// Define a normalized game item structure that works across both real and demo data
// Now using 'name' and 'image' to match Steam's convention
export interface GameListItem {
  id: number;
  name: string;
  playtimeMinutes: number;
  image: string | null;
  price?: number;
  releaseDate?: string | null;
  genres?: string[]; // Adding genres property
  categories?: string[]; // Adding categories for completeness
}

// Export the data type so components can use it for typing props
export type UnplayedDataType = DemoDataType & {
  // Extended dust data
  dustScoreBreakdown?: DustScoreBreakdown;
  cleanScoreBreakdown?: CleanScoreBreakdown;
  cleanScore?: number;
  cleanTier?: CleanScoreTier;
  cleanStreak?: number;
  recentlyPlayedCount?: number;
  topDustContributors?: GameDustData[];
  avgDustScore?: number;
  // Ensure gamesList is always available
  gamesList: GameListItem[];
};
