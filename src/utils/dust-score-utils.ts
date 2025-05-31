
import { CleanScoreTier, CleanScoreBreakdown } from '@/types/unplayed-data.types';

// Enhanced 5-factor dust score calculation with graceful defaults
export const calculateEnhancedDustScore = (
  releaseDate: string | null,
  playtimeMinutes: number,
  price: number = 0,
  genres: string[] = [],
  metacriticScore: number | null = null
): {
  qualityScore: number;
  priceScore: number;
  ageScore: number;
  genreScore: number;
  playtimeFactor: number;
  totalScore: number;
} => {
  // 1. Age Score (based on release date) - Default 15 for missing data
  const ageScore = (() => {
    if (!releaseDate) return 15; // Graceful default for missing release date
    const release = new Date(releaseDate);
    const now = new Date();
    const yearsOld = (now.getTime() - release.getTime()) / (1000 * 60 * 60 * 24 * 365);
    
    if (yearsOld >= 15) return 30;
    if (yearsOld >= 10) return 25;
    if (yearsOld >= 5) return 20;
    if (yearsOld >= 2) return 15;
    if (yearsOld >= 1) return 10;
    return 5;
  })();

  // 2. Quality Score (CORRECTED: high quality = high dust when unplayed)
  // Default 10 for missing Metacritic data (neutral)
  const qualityScore = (() => {
    if (!metacriticScore) return 10; // Neutral default - doesn't penalize or benefit
    if (metacriticScore >= 90) return 20;   // Excellent games get HIGH dust (shameful to leave unplayed!)
    if (metacriticScore >= 80) return 17;   // Great games get high dust
    if (metacriticScore >= 70) return 14;   // Good games get moderate-high dust
    if (metacriticScore >= 60) return 10;   // Average games get moderate dust
    return 6; // Poor games get low dust (less shame if unplayed)
  })();

  // 3. Price Score (higher price = higher dust potential)
  // Default 7 for missing price data (slightly above free games)
  const priceScore = (() => {
    if (price >= 60) return 15;
    if (price >= 40) return 12;
    if (price >= 20) return 10;
    if (price >= 10) return 8;
    if (price > 0) return 5;
    if (price === 0) return 2; // Free games
    return 7; // Default for missing/invalid price data
  })();

  // 4. Genre Score - Default 7 for missing/empty genres (neutral)
  const genreScore = (() => {
    if (!genres || genres.length === 0) return 7; // Neutral default for missing genres
    
    const dustyGenres = ['Strategy', 'Simulation', 'RPG', 'Turn-Based Strategy', 'Grand Strategy'];
    const quickGenres = ['Action', 'Arcade', 'Racing', 'Sports', 'Fighting'];
    
    const hasDustyGenre = genres.some(genre => 
      dustyGenres.some(dusty => genre.toLowerCase().includes(dusty.toLowerCase()))
    );
    const hasQuickGenre = genres.some(genre => 
      quickGenres.some(quick => genre.toLowerCase().includes(quick.toLowerCase()))
    );
    
    if (hasDustyGenre) return 10;
    if (hasQuickGenre) return 5;
    return 7; // Default for other genres
  })();

  // 5. Playtime Factor - Default 0 for missing data (completely unplayed = max dust potential)
  const playtimeFactor = (() => {
    const minutes = playtimeMinutes || 0; // Default to 0 for missing data
    if (minutes === 0) return 1.0;      // Completely unplayed
    if (minutes < 30) return 0.9;       // Just launched
    if (minutes < 120) return 0.6;      // Refund window
    if (minutes < 360) return 0.3;      // Gave it a chance
    return 0.1; // Significantly played
  })();

  // Calculate total dust score
  const baseScore = ageScore + qualityScore + priceScore + genreScore;
  const totalScore = Math.max(1, Math.min(100, Math.floor(baseScore * playtimeFactor)));

  return {
    qualityScore,
    priceScore,
    ageScore,
    genreScore,
    playtimeFactor,
    totalScore
  };
};

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
