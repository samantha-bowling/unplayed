import { GenreData } from '@/types/unplayed-data.types';

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
 * Efficiently processes genres with consolidation of small genres into "Other"
 */
export const processGenres = (genreCounts: Map<string, number>): GenreData[] => {
  // Calculate total count
  const totalCount = Array.from(genreCounts.values()).reduce((sum, count) => sum + count, 0);
  
  if (totalCount === 0) return [];
  
  // Convert and sort in single operation
  const sortedGenres = Array.from(genreCounts.entries())
    .sort((a, b) => b[1] - a[1]);

  // Separate genres that are 5% or more vs less than 5%
  const significantGenres: GenreData[] = [];
  let otherCount = 0;
  
  sortedGenres.forEach(([name, value], index) => {
    const percentage = (value / totalCount) * 100;
    
    if (percentage >= 5 && significantGenres.length < 6) {
      // Keep genres with 5% or more (max 6 total including potential "Other")
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

  // Add "Other" category if there are small genres
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
