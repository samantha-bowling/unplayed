
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

// Export the data type so components can use it for typing props
export type UnplayedDataType = DemoDataType & {
  // Extended dust data
  dustScoreBreakdown?: DustScoreBreakdown;
  topDustContributors?: GameDustData[];
  avgDustScore?: number;
};
