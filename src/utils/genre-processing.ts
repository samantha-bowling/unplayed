
// Enhanced genre processing for pizza visualization

interface GenreData {
  name: string;
  value: number;
  color: string;
}

// Pizza-inspired color palette
const PIZZA_COLORS = [
  '#D2691E', // Crust brown
  '#FF6347', // Tomato red  
  '#FFD700', // Cheese yellow
  '#228B22', // Basil green
  '#8B4513', // Pepperoni brown
  '#FF4500', // Spicy orange
  '#DDA0DD', // Mushroom purple
  '#708090'  // Other (slate gray)
];

// Export for compatibility with existing components
export const RAINBOW_COLORS = PIZZA_COLORS;

/**
 * Process genres into 8 slices: top 7 + "Other"
 */
export const processGenres = (genreCounts: Map<string, number>): GenreData[] => {
  const totalGames = Array.from(genreCounts.values()).reduce((sum, count) => sum + count, 0);
  
  if (totalGames === 0) {
    return [];
  }

  // Sort genres by count and take top 7
  const sortedGenres = Array.from(genreCounts.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 7);

  const result: GenreData[] = [];
  let otherCount = 0;

  // Add top 7 genres
  sortedGenres.forEach(([genre, count], index) => {
    result.push({
      name: genre,
      value: count,
      color: PIZZA_COLORS[index % PIZZA_COLORS.length]
    });
  });

  // Calculate "Other" count from remaining genres
  genreCounts.forEach((count, genre) => {
    if (!sortedGenres.find(([g]) => g === genre)) {
      otherCount += count;
    }
  });

  // Add "Other" slice if there are remaining genres
  if (otherCount > 0) {
    result.push({
      name: 'Other',
      value: otherCount,
      color: PIZZA_COLORS[7] // Last color for "Other"
    });
  }

  console.log('Genre processing results:', {
    totalGames,
    topGenresCount: sortedGenres.length,
    otherCount,
    resultSlices: result.length
  });

  return result;
};

/**
 * Count genres from user games data
 */
export const countGenres = (userGamesData: any[]): Map<string, number> => {
  const genreCounts = new Map<string, number>();
  
  userGamesData.forEach(userGame => {
    const genres = userGame.games?.genres || [];
    genres.forEach((genre: string) => {
      if (genre && genre.trim()) {
        genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1);
      }
    });
  });
  
  return genreCounts;
};
