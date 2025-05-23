
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
  'Action': '#ff6b6b',          // Red
  'Adventure': '#48dbfb',       // Light blue
  'RPG': '#a55eea',             // Purple
  'Strategy': '#8e44ad',        // Deep purple
  'Simulation': '#2ecc71',      // Green
  'Sports': '#f39c12',          // Orange
  'Racing': '#e74c3c',          // Dark red
  'Indie': '#3498db',           // Blue
  'Casual': '#1abc9c',          // Teal
  'Free to Play': '#9b59b6',    // Violet
  'Massively Multiplayer': '#2980b9', // Dark blue
  'Early Access': '#f1c40f',    // Yellow
  'Platformer': '#e67e22',      // Dark orange
  'Puzzle': '#00b894',          // Green-blue
  'Shooter': '#d63031',         // Bright red
  'Visual Novel': '#6c5ce7',    // Indigo
  'Card Game': '#00cec9',       // Cyan
  'Survival': '#fdcb6e',        // Gold
  'Horror': '#636e72',          // Gray
  'Fighting': '#e84393',        // Pink
  'Point & Click': '#74b9ff',   // Sky blue
  'Other': '#95a5a6'            // Light gray
};

// Helper function to calculate clean score
const calculateCleanScore = (
  playedGames: number, 
  totalGames: number,
  totalPlaytime: number,
  averageExpectedPlaytime: number = 12.5, // Default expected playtime per game in hours
  recentlyPlayedGames: number
): { 
  cleanScore: number, 
  breakdown: CleanScoreBreakdown, 
  tier: CleanScoreTier 
} => {
  // Handle edge case of small libraries
  if (totalGames < 5) {
    // Small library bonus to avoid unfair scores
    const smallLibraryBonus = 1.2;
    totalGames = Math.max(5, totalGames); // Minimum denominator of 5 games
    playedGames = Math.min(playedGames * smallLibraryBonus, totalGames);
  }
  
  // Calculate the three components
  const completionRate = totalGames > 0 ? playedGames / totalGames : 0;
  
  // Calculate engagement factor with safeguards
  let engagementFactor = 0;
  if (totalGames > 0) {
    const expectedTotalPlaytime = averageExpectedPlaytime * totalGames;
    engagementFactor = expectedTotalPlaytime > 0 
      ? Math.min(totalPlaytime / expectedTotalPlaytime, 1) 
      : 0;
  }
  
  // Calculate recency factor with decay
  const recencyFactor = totalGames > 0 ? Math.min(recentlyPlayedGames / totalGames, 1) : 0;
  
  // Calculate overall clean score using the weighted formula
  const cleanScore = Math.round(
    (completionRate * 0.4 + engagementFactor * 0.3 + recencyFactor * 0.3) * 100
  );
  
  // Determine tier
  const tier = CLEAN_SCORE_TIERS.find(
    tier => cleanScore >= tier.range[0] && cleanScore <= tier.range[1]
  ) || CLEAN_SCORE_TIERS[CLEAN_SCORE_TIERS.length - 1]; // Default to lowest tier
  
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

/**
 * Gets a color for a genre, using a predefined mapping or a fallback color
 * @param genre The genre name
 * @param index Optional index for fallback coloring
 * @returns An appropriate color for the genre
 */
const getGenreColor = (genre: string, index: number): string => {
  // If we have a predefined color for this genre, use it
  if (GENRE_COLORS[genre]) {
    return GENRE_COLORS[genre];
  }

  // Use one of our generic fallback colors based on index
  const fallbackColors = [
    '#A3F7BF', '#EF5DFF', '#FFD866', '#FF3C38', '#61DAFB', '#6C757D'
  ];
  return fallbackColors[index % fallbackColors.length];
};

/**
 * Transforms Supabase data to match the DemoDataType structure
 * with HLTB data integration
 */
export const transformUserGameData = (data: any[], estimatesMap: Record<string, any> = {}): UnplayedDataType => {
  if (!data || data.length === 0) {
    // Return empty data structure if no data
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
      cleanTier: CLEAN_SCORE_TIERS[CLEAN_SCORE_TIERS.length - 1], // Lowest tier for empty library
      cleanStreak: 0,
      recentlyPlayedCount: 0
    };
  }

  // Calculate unplayed games
  const unplayedGames = data.filter(item => !item.playtime_minutes || item.playtime_minutes === 0).length;
  const playedGames = data.length - unplayedGames;
  
  // Calculate total playtime (convert minutes to hours)
  const totalPlaytime = data.reduce((sum, item) => sum + (item.playtime_minutes || 0), 0) / 60;
  
  // Calculate total spent based on price_cents (if available)
  const totalSpent = data.reduce((sum, item) => {
    const priceCents = item.games?.price_cents || 0;
    return sum + (priceCents / 100);
  }, 0);

  // Calculate total dust score (sum of all individual dust scores)
  const dustScore = data.reduce((sum, item) => 
    sum + (item.dust_score || 0), 0);
  
  // Calculate total potential gameplay hours using HLTB data with fallback
  const potentialGameplayHours = data
    .filter(item => !item.playtime_minutes || item.playtime_minutes === 0)
    .reduce((sum, item) => {
      const estimate = estimatesMap[item.game_id];
      // Use main_hours if available, otherwise fall back to 12.5 hours
      const gameHours = estimate?.main_hours || 12.5;
      return sum + gameHours;
    }, 0);
  
  // Calculate recently played games (in the last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentlyPlayedCount = data.filter(item => {
    if (!item.last_played_date) return false;
    const lastPlayed = new Date(item.last_played_date);
    return lastPlayed >= thirtyDaysAgo;
  }).length;
  
  // Clean streak (would usually come from database, but creating a simulated value)
  const cleanStreak = Math.min(7, Math.max(1, Math.floor(Math.random() * 7) + 1));
  
  // Calculate clean score
  const { cleanScore, breakdown: cleanScoreBreakdown, tier: cleanTier } = calculateCleanScore(
    playedGames,
    data.length,
    totalPlaytime,
    12.5,
    recentlyPlayedCount
  );
  
  // Create genre aggregation with improved color mapping
  const genreCounts = new Map<string, number>();
  
  // Count genres
  data.forEach(item => {
    if (item.games?.genres) {
      item.games.genres.forEach((genre: string) => {
        genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1);
      });
    }
  });
  
  // Convert to genre data structure with improved coloring
  const genres = Array.from(genreCounts.entries())
    .sort((a, b) => b[1] - a[1]) // Sort by count descending
    .slice(0, 5) // Take top 5 genres
    .map(([name, value], index) => ({
      name,
      value,
      color: getGenreColor(name, index)
    }));
  
  // Add "Other" category if there are more genres
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
  
  // Create shelf life data using our image utility for consistent image handling
  const shelfLife = data
    .filter(item => !item.playtime_minutes || item.playtime_minutes === 0)
    .sort((a, b) => {
      const dateA = new Date(a.acquisition_date || '').getTime();
      const dateB = new Date(b.acquisition_date || '').getTime();
      return dateA - dateB; // Sort by date ascending (oldest first)
    })
    .slice(0, 5) // Take oldest 5
    .map(item => ({
      id: item.game_id,
      name: item.games?.name || 'Unknown Game',
      addedDate: item.acquisition_date || new Date().toISOString(),
      image: getBestGameImage(item.games?.header_image, item.games?.image_url)
    }));
  
  // Create library data with improved image handling
  const library = data
    .filter(item => !item.hidden) // Filter out hidden games
    .sort(() => Math.random() - 0.5) // Randomize for demo-like experience
    .slice(0, 8) // Take 8 random games
    .map(item => ({
      id: item.game_id,
      name: item.games?.name || 'Unknown Game',
      image: getBestGameImage(item.games?.header_image, item.games?.image_url),
      playtime: item.playtime_minutes || 0
    }));
  
  // Create normalized gamesList
  const gamesList = buildGamesList(data);
  
  // Return final structured data
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
