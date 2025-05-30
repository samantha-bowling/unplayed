
import { CleanScoreTier, CleanScoreBreakdown } from '@/types/unplayed-data.types';

// Enhanced 5-factor dust score calculation
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
  // 1. Age Score (based on release date)
  const ageScore = (() => {
    if (!releaseDate) return 15;
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

  // 2. Quality Score (based on Metacritic score if available)
  const qualityScore = (() => {
    if (!metacriticScore) return 10; // Default score
    if (metacriticScore >= 90) return 5;   // Excellent games get lower dust
    if (metacriticScore >= 80) return 8;
    if (metacriticScore >= 70) return 10;
    if (metacriticScore >= 60) return 12;
    return 15; // Poor games get higher dust
  })();

  // 3. Price Score (higher price = higher dust potential)
  const priceScore = (() => {
    if (price >= 60) return 15;
    if (price >= 40) return 12;
    if (price >= 20) return 10;
    if (price >= 10) return 8;
    if (price > 0) return 5;
    return 2; // Free games
  })();

  // 4. Genre Score (some genres accumulate dust faster)
  const genreScore = (() => {
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
    return 7; // Default
  })();

  // 5. Playtime Factor (how much the user has played)
  const playtimeFactor = (() => {
    if (playtimeMinutes === 0) return 1.0;      // Completely unplayed
    if (playtimeMinutes < 30) return 0.9;       // Just launched
    if (playtimeMinutes < 120) return 0.6;      // Refund window
    if (playtimeMinutes < 360) return 0.3;      // Gave it a chance
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
 * Efficiently processes dust score breakdowns from API responses
 */
export const processDustBreakdown = (breakdown: unknown): {
  qualityScore: number;
  priceScore: number;
  ageScore: number;
  genreScore: number;
  playtimeFactor: number;
  totalScore: number;
} => {
  // Default values
  const defaultBreakdown = {
    qualityScore: 0,
    priceScore: 0,
    ageScore: 0,
    genreScore: 0,
    playtimeFactor: 0,
    totalScore: 0
  };

  if (!breakdown || typeof breakdown !== 'object') {
    return defaultBreakdown;
  }

  const b = breakdown as any;
  
  return {
    qualityScore: typeof b.qualityScore === 'number' ? b.qualityScore : 0,
    priceScore: typeof b.priceScore === 'number' ? b.priceScore : 0,
    ageScore: typeof b.ageScore === 'number' ? b.ageScore : 0,
    genreScore: typeof b.genreScore === 'number' ? b.genreScore : 0,
    playtimeFactor: typeof b.playtimeFactor === 'number' ? b.playtimeFactor : 0,
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
