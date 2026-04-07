
import { CleanScoreTier, CleanScoreBreakdown } from '@/types/unplayed-data.types';

/**
 * Efficiently processes dust score breakdowns from API responses with 5-factor support
 */
export const processDustBreakdown = (breakdown: unknown): {
  qualityScore: number;
  priceScore: number;
  ageScore: number;
  genreScore: number;
  playtimeFactor: number;
  totalScore: number;
} => {
  // Default values using our graceful defaults strategy
  const defaultBreakdown = {
    qualityScore: 10,  // Neutral for missing Metacritic
    priceScore: 7,     // Slightly above free for missing price
    ageScore: 15,      // Moderate for missing release date
    genreScore: 7,     // Neutral for missing genres
    playtimeFactor: 1.0, // Unplayed for missing playtime
    totalScore: 0
  };

  if (!breakdown || typeof breakdown !== 'object') {
    return defaultBreakdown;
  }

  const b = breakdown as any;
  
  return {
    qualityScore: typeof b.qualityScore === 'number' ? b.qualityScore : defaultBreakdown.qualityScore,
    priceScore: typeof b.priceScore === 'number' ? b.priceScore : defaultBreakdown.priceScore,
    ageScore: typeof b.ageScore === 'number' ? b.ageScore : defaultBreakdown.ageScore,
    genreScore: typeof b.genreScore === 'number' ? b.genreScore : defaultBreakdown.genreScore,
    playtimeFactor: typeof b.playtimeFactor === 'number' ? b.playtimeFactor : defaultBreakdown.playtimeFactor,
    totalScore: typeof b.totalScore === 'number' ? b.totalScore : 0
  };
};

/**
 * Processes multiple dust score breakdowns and calculates aggregates
 */
export const processDustBreakdowns = (breakdowns: any[]): {
  totalQualityScore: number;
  totalPriceScore: number;
  totalAgeScore: number;
  totalGenreScore: number;
  avgPlaytimeFactor: number;
} => {
  if (!breakdowns || breakdowns.length === 0) {
    return {
      totalQualityScore: 0,
      totalPriceScore: 0,
      totalAgeScore: 0,
      totalGenreScore: 0,
      avgPlaytimeFactor: 0
    };
  }

  const totals = breakdowns.reduce((acc, breakdown) => {
    const processed = processDustBreakdown(breakdown);
    return {
      qualityScore: acc.qualityScore + processed.qualityScore,
      priceScore: acc.priceScore + processed.priceScore,
      ageScore: acc.ageScore + processed.ageScore,
      genreScore: acc.genreScore + processed.genreScore,
      playtimeFactor: acc.playtimeFactor + processed.playtimeFactor
    };
  }, {
    qualityScore: 0,
    priceScore: 0,
    ageScore: 0,
    genreScore: 0,
    playtimeFactor: 0
  });

  return {
    totalQualityScore: Math.round(totals.qualityScore / breakdowns.length),
    totalPriceScore: Math.round(totals.priceScore / breakdowns.length),
    totalAgeScore: Math.round(totals.ageScore / breakdowns.length),
    totalGenreScore: Math.round(totals.genreScore / breakdowns.length),
    avgPlaytimeFactor: Number((totals.playtimeFactor / breakdowns.length).toFixed(2))
  };
};
