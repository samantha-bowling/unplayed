
import { UnplayedDataType, GameListItem, CleanScoreBreakdown, CleanScoreTier, GenreData } from '@/types/unplayed-data.types';
import { buildGamesList, createEmptyGamesList } from './normalize-games';
import { getBestGameImage } from './image-utils';

// Clean Score tiers configuration
const CLEAN_SCORE_TIERS: CleanScoreTier[] = [
  { name: 'Pristine Collection', color: '#4ade80', range: [90, 100] },
  { name: 'Dust-Free Shelf', color: '#22d3ee', range: [75, 89] },
  { name: 'Reasonably Clean', color: '#60a5fa', range: [50, 74] },
  { name: 'Needs a Wipe', color: '#f59e0b', range: [25, 49] },
  { name: 'Filthy Casual', color: '#f87171', range: [0, 24] }
];

// Enhanced genre color mapping
const GENRE_COLORS: Record<string, string> = {
  'Action': '#ff6b6b',
  'Adventure': '#48dbfb',
  'RPG': '#a55eea',
  'Strategy': '#8e44ad',
  'Simulation': '#2ecc71',
  'Sports': '#f39c12',
  'Racing': '#e74c3c',
  'Indie': '#3498db',
  'Casual': '#1abc9c',
  'Free to Play': '#9b59b6',
  'Massively Multiplayer': '#2980b9',
  'Early Access': '#f1c40f',
  'Platformer': '#e67e22',
  'Puzzle': '#00b894',
  'Shooter': '#d63031',
  'Visual Novel': '#6c5ce7',
  'Card Game': '#00cec9',
  'Survival': '#fdcb6e',
  'Horror': '#636e72',
  'Fighting': '#e84393',
  'Point & Click': '#74b9ff',
  'Other': '#95a5a6'
};

// Helper function to calculate clean score
const calculateCleanScore = (
  playedGames: number, 
  totalGames: number,
  totalPlaytime: number,
  averageExpectedPlaytime: number = 12.5,
  recentlyPlayedGames: number
): { 
  cleanScore: number, 
  breakdown: CleanScoreBreakdown, 
  tier: CleanScoreTier 
} => {
  if (totalGames < 5) {
    const smallLibraryBonus = 1.2;
    totalGames = Math.max(5, totalGames);
    playedGames = Math.min(playedGames * smallLibraryBonus, totalGames);
  }
  
  const completionRate = totalGames > 0 ? playedGames / totalGames : 0;
  
  let engagementFactor = 0;
  if (totalGames > 0) {
    const expectedTotalPlaytime = averageExpectedPlaytime * totalGames;
    engagementFactor = expectedTotalPlaytime > 0 
      ? Math.min(totalPlaytime / expectedTotalPlaytime, 1) 
      : 0;
  }
  
  const recencyFactor = totalGames > 0 ? Math.min(recentlyPlayedGames / totalGames, 1) : 0;
  
  const cleanScore = Math.round(
    (completionRate * 0.4 + engagementFactor * 0.3 + recencyFactor * 0.3) * 100
  );
  
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
};

const getGenreColor = (genre: string, index: number): string => {
  if (GENRE_COLORS[genre]) {
    return GENRE_COLORS[genre];
  }

  const fallbackColors = [
    '#A3F7BF', '#EF5DFF', '#FFD866', '#FF3C38', '#61DAFB', '#6C757D'
  ];
  return fallbackColors[index % fallbackColors.length];
};

/**
 * Optimized version that processes data in a single pass to reduce computational overhead
 */
export const transformUserGameDataOptimized = (data: any[], estimatesMap: Record<string, any> = {}): UnplayedDataType => {
  if (!data || data.length === 0) {
    return {
      unplayedGames: 0,
      totalGames: 0,
      dustScore: 0,
      totalPlaytime: 0,
      totalSpent: 0,
      potentialGameplayHours: 0,
      genres: [],
      shelfLife: [],
      library: [],
      gamesList: createEmptyGamesList(),
      cleanScore: 0,
      cleanScoreBreakdown: {
        completionRate: 0,
        engagementFactor: 0,
        recencyFactor: 0
      },
      cleanTier: CLEAN_SCORE_TIERS[CLEAN_SCORE_TIERS.length - 1],
      cleanStreak: 0,
      recentlyPlayedCount: 0
    };
  }

  // Single-pass processing for better performance
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const genreCounts = new Map<string, number>();
  const unplayedForShelfLife: any[] = [];
  const randomLibraryGames: any[] = [];
  
  let unplayedGames = 0;
  let totalPlaytime = 0;
  let totalSpent = 0;
  let dustScore = 0;
  let potentialGameplayHours = 0;
  let recentlyPlayedCount = 0;

  // Single pass through the data for all calculations
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const playtimeMinutes = item.playtime_minutes || 0;
    const priceCents = item.games?.price_cents || 0;
    
    // Count unplayed games and calculate potential hours
    if (playtimeMinutes === 0) {
      unplayedGames++;
      const estimate = estimatesMap[item.game_id];
      const gameHours = estimate?.main_hours || 12.5;
      potentialGameplayHours += gameHours;
      
      // Add to shelf life candidates
      unplayedForShelfLife.push(item);
    }
    
    // Accumulate totals
    totalPlaytime += playtimeMinutes;
    totalSpent += (priceCents / 100);
    dustScore += (item.dust_score || 0);
    
    // Check recently played
    if (item.last_played_date && new Date(item.last_played_date) >= thirtyDaysAgo) {
      recentlyPlayedCount++;
    }
    
    // Process genres in the same loop
    if (item.games?.genres) {
      item.games.genres.forEach((genre: string) => {
        genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1);
      });
    }
    
    // Add to library preview candidates (not hidden)
    if (!item.hidden) {
      randomLibraryGames.push(item);
    }
  }

  // Convert playtime to hours
  totalPlaytime = totalPlaytime / 60;
  const playedGames = data.length - unplayedGames;

  // Calculate clean score using optimized helper
  const { cleanScore, breakdown: cleanScoreBreakdown, tier: cleanTier } = calculateCleanScore(
    playedGames,
    data.length,
    totalPlaytime,
    12.5,
    recentlyPlayedCount
  );

  // Process genres with single sort operation
  const genres = Array.from(genreCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value], index) => ({
      name,
      value,
      color: getGenreColor(name, index)
    }));

  // Add "Other" category if needed
  if (genreCounts.size > 5) {
    const otherCount = Array.from(genreCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(5)
      .reduce((sum, [, count]) => sum + count, 0);
    
    genres.push({
      name: 'Other',
      value: otherCount,
      color: GENRE_COLORS.Other || '#95a5a6'
    });
  }

  // Process shelf life with optimized sorting
  const shelfLife = unplayedForShelfLife
    .sort((a, b) => {
      const dateA = new Date(a.acquisition_date || '').getTime();
      const dateB = new Date(b.acquisition_date || '').getTime();
      return dateA - dateB;
    })
    .slice(0, 5)
    .map(item => ({
      id: item.game_id,
      name: item.games?.name || 'Unknown Game',
      addedDate: item.acquisition_date || new Date().toISOString(),
      image: getBestGameImage(item.games?.header_image, item.games?.image_url)
    }));

  // Process library with Fisher-Yates shuffle for better randomization
  for (let i = randomLibraryGames.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [randomLibraryGames[i], randomLibraryGames[j]] = [randomLibraryGames[j], randomLibraryGames[i]];
  }
  
  const library = randomLibraryGames
    .slice(0, 8)
    .map(item => ({
      id: item.game_id,
      name: item.games?.name || 'Unknown Game',
      image: getBestGameImage(item.games?.header_image, item.games?.image_url),
      playtime: item.playtime_minutes || 0
    }));

  // Use existing buildGamesList for consistency
  const gamesList = buildGamesList(data);
  
  // Generate clean streak (simulated value)
  const cleanStreak = Math.min(7, Math.max(1, Math.floor(Math.random() * 7) + 1));

  return {
    unplayedGames,
    totalGames: data.length,
    dustScore,
    totalPlaytime,
    totalSpent,
    potentialGameplayHours,
    genres,
    shelfLife,
    library,
    gamesList,
    cleanScore,
    cleanScoreBreakdown,
    cleanTier,
    cleanStreak,
    recentlyPlayedCount
  };
};
