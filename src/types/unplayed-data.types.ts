
import { DemoDataType } from '@/lib/demo-data';

// Extended type for dust score breakdown
export interface DustScoreBreakdown {
  ageScore: number;
  ownershipScore: number;
  playtimeFactor: number;
}

// Extended type for per-game dust data
export interface GameDustData {
  id: number;
  title: string;
  dustScore: number;
  addedDate: string;
  releaseDate: string | null;
  playtimeMinutes: number;
  imageUrl: string | null;
}

// Define a normalized game item structure that works across both real and demo data
export interface GameListItem {
  id: number;
  title: string;
  playtimeMinutes: number;
  imageUrl: string | null;
  price?: number;
  releaseDate?: string | null;
  genres?: string[]; // Adding genres property
  categories?: string[]; // Adding categories for completeness
}

// Export the data type so components can use it for typing props
export type UnplayedDataType = DemoDataType & {
  // Extended dust data
  dustScoreBreakdown?: DustScoreBreakdown;
  topDustContributors?: GameDustData[];
  avgDustScore?: number;
  // Ensure gamesList is always available
  gamesList: GameListItem[];
};
