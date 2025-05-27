
/**
 * Core game data structure used throughout the app
 */
export interface GameListItem {
  id: number;
  name: string;
  image: string | null;
  header_image?: string | null;
  playtimeMinutes: number;
  releaseDate?: string | null;
  price?: number;
  genres?: string[];
  categories?: string[];
  addedDate?: string;
  dustScore?: number;
}

/**
 * Represents breakdown of a dust score calculation
 */
export interface DustScoreBreakdown {
  ageScore: number;
  ownershipScore: number;
  playtimeFactor: number;
}

/**
 * Type for the response from dust score breakdown database function
 */
export interface DustScoreBreakdownResponse {
  ageScore: number;
  ownershipScore: number;
  playtimeFactor: number;
  totalScore: number;
}

/**
 * Game data with dust-specific information
 */
export interface GameDustData {
  id: number;
  name: string;
  dustScore: number;
  addedDate: string;
  releaseDate: string | null;
  playtimeMinutes: number;
  image: string | null;
  breakdown?: DustScoreBreakdown;
}

/**
 * Represents breakdown of a clean score calculation
 */
export interface CleanScoreBreakdown {
  completionRate: number;
  engagementFactor: number;
  recencyFactor: number;
}

/**
 * Defines a tier in the clean score system
 */
export interface CleanScoreTier {
  name: string;
  color: string;
  range: [number, number];
}

/**
 * Genre data for visualization
 */
export interface GenreData {
  name: string;
  value: number;
  color: string;
}

/**
 * Item in the shelf life visualization
 */
export interface ShelfLifeItem {
  id: number;
  name: string;
  addedDate: string;
  image: string | null;
}

/**
 * Item in the library preview
 */
export interface LibraryItem {
  id: number;
  name: string;
  image: string;
  playtime: number;
}

/**
 * Main data structure for unplayed games data
 */
export interface UnplayedDataType {
  // Core stats
  unplayedGames: number;
  totalGames: number;
  dustScore?: number;
  totalPlaytime: number;
  totalSpent: number;
  potentialGameplayHours: number;
  
  // Game collections
  gamesList: GameListItem[];
  library: LibraryItem[];
  shelfLife: ShelfLifeItem[];
  
  // Genre data
  genres: GenreData[];
  
  // Dust score specific data
  dustScoreBreakdown?: DustScoreBreakdown;
  topDustContributors?: GameDustData[];
  avgDustScore?: number;
  
  // Clean score specific data
  cleanScore?: number;
  cleanScoreBreakdown?: CleanScoreBreakdown;
  cleanTier?: CleanScoreTier;
  cleanStreak?: number;
  recentlyPlayedCount?: number;
}
