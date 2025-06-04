import { GenreData } from '@/types/unplayed-data.types';

// Rainbow colors for consistent theming across genre components
const RAINBOW_COLORS = [
  '#ff6b6b', // red
  '#f97316', // orange  
  '#eab308', // yellow
  '#22c55e', // green
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#a855f7', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f59e0b', // amber
  '#8b5cf6', // violet
];

// Enhanced genre color mapping using rainbow colors
const GENRE_COLORS: Record<string, string> = {
  'Action': RAINBOW_COLORS[0],
  'Adventure': RAINBOW_COLORS[1],
  'RPG': RAINBOW_COLORS[2],
  'Strategy': RAINBOW_COLORS[3],
  'Simulation': RAINBOW_COLORS[4],
  'Sports': RAINBOW_COLORS[5],
  'Racing': RAINBOW_COLORS[6],
  'Indie': RAINBOW_COLORS[7],
  'Casual': RAINBOW_COLORS[8],
  'Free to Play': RAINBOW_COLORS[9],
  'Massively Multiplayer': RAINBOW_COLORS[10],
  'Early Access': RAINBOW_COLORS[11],
  'Platformer': RAINBOW_COLORS[0],
  'Puzzle': RAINBOW_COLORS[1],
  'Shooter': RAINBOW_COLORS[2],
  'Visual Novel': RAINBOW_COLORS[3],
  'Card Game': RAINBOW_COLORS[4],
  'Survival': RAINBOW_COLORS[5],
  'Horror': RAINBOW_COLORS[6],
  'Fighting': RAINBOW_COLORS[7],
  'Point & Click': RAINBOW_COLORS[8],
  'Other': '#95a5a6'
};

const getGenreColor = (genre: string, index: number): string => {
  if (GENRE_COLORS[genre]) {
    return GENRE_COLORS[genre];
  }
  
  return RAINBOW_COLORS[index % RAINBOW_COLORS.length];
};

/**
 * Efficiently processes genres with consolidation of genres under 10%
 */
export const processGenres = (genreCounts: Map<string, number>): GenreData[] => {
  // Convert and sort in single operation
  const sortedGenres = Array.from(genreCounts.entries())
    .sort((a, b) => b[1] - a[1]);

  const totalGames = Array.from(genreCounts.values()).reduce((sum, count) => sum + count, 0);
  
  // Find genres that represent 10% or more
  const significantGenres: GenreData[] = [];
  let otherCount = 0;

  sortedGenres.forEach(([name, value], index) => {
    const percentage = (value / totalGames) * 100;
    
    if (percentage >= 10 && significantGenres.length < 6) {
      // Keep significant genres (10% or more) up to 6 total
      significantGenres.push({
        name,
        value,
        color: getGenreColor(name, index)
      });
    } else {
      // Add to "Other" category
      otherCount += value;
    }
  });

  // Add "Other" category if there are any genres to consolidate
  if (otherCount > 0) {
    significantGenres.push({
      name: 'Other',
      value: otherCount,
      color: GENRE_COLORS.Other || '#95a5a6'
    });
  }

  return significantGenres;
};

/**
 * Efficiently counts genres in a single pass through game data
 */
export const countGenres = (data: any[]): Map<string, number> => {
  const genreCounts = new Map<string, number>();
  
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    if (item.games?.genres) {
      item.games.genres.forEach((genre: string) => {
        genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1);
      });
    }
  }
  
  return genreCounts;
};

// Export rainbow colors for use in other components
export { RAINBOW_COLORS };
