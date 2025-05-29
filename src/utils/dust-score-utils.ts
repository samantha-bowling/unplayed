/**
 * Utility functions for dust score calculations with strong type safety
 * Updated for new 5-factor system: Quality, Price, Age, Genre, Playtime
 */
import { safeGetNumber } from '@/utils/safe-json';
import { DustScoreBreakdown, CleanScoreTier, CleanScoreBreakdown } from '@/types/unplayed-data.types';

/**
 * Calculate Quality Score based on Metacritic score
 */
export function calculateQualityScore(metacriticScore?: number): number {
  if (!metacriticScore || metacriticScore <= 0) return 15; // Default for missing scores
  
  if (metacriticScore >= 90) return 5;  // Masterpiece
  if (metacriticScore >= 80) return 8;  // Great
  if (metacriticScore >= 70) return 12; // Good
  if (metacriticScore >= 60) return 18; // Decent
  if (metacriticScore >= 50) return 25; // Mediocre
  return 30; // Poor quality
}

/**
 * Calculate Price Score based on game price
 */
export function calculatePriceScore(priceCents?: number): number {
  if (!priceCents || priceCents <= 0) return 5; // Free games
  
  const priceUSD = priceCents / 100;
  if (priceUSD >= 60) return 25; // AAA pricing
  if (priceUSD >= 40) return 20; // Premium indie
  if (priceUSD >= 20) return 15; // Mid-tier
  if (priceUSD >= 10) return 10; // Budget
  return 5; // Very cheap
}

/**
 * Calculate Age Score based on release date
 */
export function calculateAgeScore(releaseDate?: string | null): number {
  if (!releaseDate) return 10; // Default for missing dates
  
  const now = new Date();
  const release = new Date(releaseDate);
  const yearsDiff = (now.getTime() - release.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  
  if (yearsDiff >= 15) return 25; // Retro classics
  if (yearsDiff >= 10) return 20; // Old but gold
  if (yearsDiff >= 5) return 15;  // Getting old
  if (yearsDiff >= 2) return 10;  // Recent
  if (yearsDiff >= 1) return 5;   // New
  return 2; // Brand new
}

/**
 * Calculate Genre Score based on genre rarity (simplified for now)
 */
export function calculateGenreScore(genres?: string[]): number {
  if (!genres || genres.length === 0) return 10; // Default
  
  // Common genres get lower scores, rare genres get higher scores
  const commonGenres = ['Action', 'Adventure', 'Indie', 'Casual', 'Strategy', 'RPG', 'Simulation'];
  const rareGenres = ['Racing', 'Sports', 'Massively Multiplayer', 'Early Access'];
  
  const hasRare = genres.some(genre => rareGenres.includes(genre));
  const hasCommon = genres.some(genre => commonGenres.includes(genre));
  
  if (hasRare) return 15; // Rare genres
  if (hasCommon) return 8;  // Common genres
  return 12; // Mixed or unknown
}

/**
 * Calculate Playtime Factor (multiplier)
 */
export function calculatePlaytimeFactor(playtimeMinutes?: number): number {
  if (!playtimeMinutes || playtimeMinutes === 0) return 1.0; // Unplayed
  
  if (playtimeMinutes < 30) return 0.9;  // Just tried
  if (playtimeMinutes < 120) return 0.6; // Refund window
  if (playtimeMinutes < 360) return 0.3; // Gave it a chance
  return 0.1; // Well played
}

/**
 * Calculate total dust score using new 5-factor system
 */
export function calculateNewDustScore(
  metacriticScore?: number,
  priceCents?: number,
  releaseDate?: string | null,
  genres?: string[],
  playtimeMinutes?: number
): { score: number; breakdown: DustScoreBreakdown } {
  const qualityScore = calculateQualityScore(metacriticScore);
  const priceScore = calculatePriceScore(priceCents);
  const ageScore = calculateAgeScore(releaseDate);
  const genreScore = calculateGenreScore(genres);
  const playtimeFactor = calculatePlaytimeFactor(playtimeMinutes);
  
  const rawScore = qualityScore + priceScore + ageScore + genreScore;
  const finalScore = Math.round(rawScore * playtimeFactor);
  
  return {
    score: Math.max(1, Math.min(100, finalScore)),
    breakdown: {
      qualityScore,
      priceScore,
      ageScore,
      genreScore,
      playtimeFactor
    }
  };
}

/**
 * Process dust breakdown data from Supabase with proper type safety
 */
export function processDustBreakdown(breakdown: unknown): {
  qualityScore: number;
  priceScore: number;
  ageScore: number;
  genreScore: number;
  playtimeFactor: number;
  totalScore: number;
} {
  const qualityScore = safeGetNumber(breakdown, 'qualityScore', 0);
  const priceScore = safeGetNumber(breakdown, 'priceScore', 0);
  const ageScore = safeGetNumber(breakdown, 'ageScore', 0);
  const genreScore = safeGetNumber(breakdown, 'genreScore', 0);
  const playtimeFactor = safeGetNumber(breakdown, 'playtimeFactor', 1.0);
  const totalScore = safeGetNumber(breakdown, 'totalScore', 0);
  
  return {
    qualityScore,
    priceScore,
    ageScore,
    genreScore,
    playtimeFactor,
    totalScore
  };
}

/**
 * Process multiple dust breakdowns with type safety
 */
export function processDustBreakdowns(breakdowns: unknown[]): {
  totalQualityScore: number;
  totalPriceScore: number;
  totalAgeScore: number;
  totalGenreScore: number;
  avgPlaytimeFactor: number;
} {
  // Filter out any null/undefined values
  const validBreakdowns = breakdowns.filter(Boolean);
  
  if (validBreakdowns.length === 0) {
    return {
      totalQualityScore: 0,
      totalPriceScore: 0,
      totalAgeScore: 0,
      totalGenreScore: 0,
      avgPlaytimeFactor: 1.0
    };
  }
  
  // Initialize accumulators with explicit number types
  let totalQualityScore = 0;
  let totalPriceScore = 0;
  let totalAgeScore = 0;
  let totalGenreScore = 0;
  let totalFactorWeight = 0;
  let weightedPlaytimeFactorSum = 0;
  
  // Process each breakdown individually
  for (const breakdown of validBreakdowns) {
    const { qualityScore, priceScore, ageScore, genreScore, playtimeFactor, totalScore } = processDustBreakdown(breakdown);
    
    totalQualityScore += qualityScore;
    totalPriceScore += priceScore;
    totalAgeScore += ageScore;
    totalGenreScore += genreScore;
    totalFactorWeight += totalScore;
    weightedPlaytimeFactorSum += (playtimeFactor * totalScore);
  }
  
  // Calculate final average playtime factor
  const avgPlaytimeFactor = totalFactorWeight > 0 
    ? weightedPlaytimeFactorSum / totalFactorWeight 
    : 1.0;
  
  return {
    totalQualityScore,
    totalPriceScore,
    totalAgeScore,
    totalGenreScore,
    avgPlaytimeFactor
  };
}

/**
 * Clean Score tiers definition
 */
export const CLEAN_SCORE_TIERS: CleanScoreTier[] = [
  { name: 'Pristine Collection', color: '#4ade80', range: [90, 100] },
  { name: 'Dust-Free Shelf', color: '#22d3ee', range: [75, 89] },
  { name: 'Reasonably Clean', color: '#60a5fa', range: [50, 74] },
  { name: 'Needs a Wipe', color: '#f59e0b', range: [25, 49] },
  { name: 'Filthy Casual', color: '#f87171', range: [0, 24] }
];

/**
 * Calculate clean score with type safety
 */
export function calculateCleanScore(
  playedGames: number, 
  totalGames: number,
  totalPlaytime: number,
  averageExpectedPlaytime: number = 12.5,
  recentlyPlayedGames: number
): { 
  cleanScore: number, 
  breakdown: CleanScoreBreakdown, 
  tier: CleanScoreTier 
} {
  // Apply smallLibraryBonus for libraries with fewer than 5 games
  let adjustedPlayedGames = playedGames;
  let adjustedTotalGames = totalGames;
  
  if (totalGames < 5) {
    const smallLibraryBonus = 1.2;
    adjustedTotalGames = Math.max(5, totalGames);
    adjustedPlayedGames = Math.min(adjustedPlayedGames * smallLibraryBonus, adjustedTotalGames);
  }

  // Calculate scores with explicit number types
  const completionRate = adjustedTotalGames > 0 ? adjustedPlayedGames / adjustedTotalGames : 0;
  
  // Calculate engagement factor
  let engagementFactor = 0;
  if (adjustedTotalGames > 0) {
    const expectedTotalPlaytime = averageExpectedPlaytime * adjustedTotalGames;
    engagementFactor = expectedTotalPlaytime > 0 
      ? Math.min(totalPlaytime / expectedTotalPlaytime, 1) 
      : 0;
  }

  // Calculate recency factor
  const recencyFactor = adjustedTotalGames > 0 
    ? Math.min(recentlyPlayedGames / adjustedTotalGames, 1) 
    : 0;

  // Calculate final clean score
  const cleanScore = Math.round(
    (completionRate * 0.4 + engagementFactor * 0.3 + recencyFactor * 0.3) * 100
  );

  // Find the appropriate tier
  const tier = CLEAN_SCORE_TIERS.find(
    tier => cleanScore >= tier.range[0] && cleanScore <= tier.range[1]
  ) || CLEAN_SCORE_TIERS[CLEAN_SCORE_TIERS.length - 1];

  return {
    cleanScore,
    breakdown: {
      completionRate: Math.round(completionRate * 100),
      engagementFactor: Math.round(engagementFactor * 100),
      recencyFactor: Math.round(recencyFactor * 100)
    },
    tier
  };
}
