
import { UnplayedDataType, GameListItem } from '@/types/unplayed-data.types';
import { buildGamesList, createEmptyGamesList } from './normalize-games';

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
      gamesList: createEmptyGamesList() // Add empty gamesList
    };
  }

  // Calculate unplayed games
  const unplayedGames = data.filter(item => !item.playtime_minutes || item.playtime_minutes === 0).length;
  
  // Calculate total playtime (convert minutes to hours)
  const totalPlaytime = data.reduce((sum, item) => sum + (item.playtime_minutes || 0), 0) / 60;
  
  // Calculate total spent based on price_cents (if available)
  const totalSpent = data.reduce((sum, item) => {
    const priceCents = item.games?.price_cents || 0;
    return sum + (priceCents / 100);
  }, 0);

  // Extract dust score (use highest if multiple)
  const dustScore = data.reduce((highest, item) => 
    Math.max(highest, item.dust_score || 0), 0);
  
  // Calculate total potential gameplay hours using HLTB data with fallback
  const potentialGameplayHours = data
    .filter(item => !item.playtime_minutes || item.playtime_minutes === 0)
    .reduce((sum, item) => {
      const estimate = estimatesMap[item.game_id];
      // Use main_hours if available, otherwise fall back to 12.5 hours
      const gameHours = estimate?.main_hours || 12.5;
      return sum + gameHours;
    }, 0);
  
  // Create genre aggregation
  const genreCounts = new Map<string, number>();
  const genreColors = [
    '#A3F7BF', '#EF5DFF', '#FFD866', '#FF3C38', '#61DAFB', '#6C757D'
  ];
  
  // Count genres
  data.forEach(item => {
    if (item.games?.genres) {
      item.games.genres.forEach((genre: string) => {
        genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1);
      });
    }
  });
  
  // Convert to genre data structure
  const genres = Array.from(genreCounts.entries())
    .sort((a, b) => b[1] - a[1]) // Sort by count descending
    .slice(0, 5) // Take top 5 genres
    .map(([name, value], index) => ({
      name,
      value,
      color: genreColors[index % genreColors.length]
    }));
  
  // Add "Other" category if there are more genres
  if (genreCounts.size > 5) {
    const otherCount = Array.from(genreCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(5)
      .reduce((sum, [_, count]) => sum + count, 0);
    
    genres.push({
      name: 'Other',
      value: otherCount,
      color: genreColors[5]
    });
  }
  
  // Create shelf life data (oldest unplayed games)
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
      title: item.games?.name || 'Unknown Game',
      addedDate: item.acquisition_date || new Date().toISOString(),
      imageUrl: item.games?.image_url || item.games?.header_image || 'https://placehold.co/600x400?text=No+Image'
    }));
  
  // Create library data
  const library = data
    .filter(item => !item.hidden) // Filter out hidden games
    .sort(() => Math.random() - 0.5) // Randomize for demo-like experience
    .slice(0, 8) // Take 8 random games
    .map(item => ({
      id: item.game_id,
      title: item.games?.name || 'Unknown Game',
      image: item.games?.header_image || 'https://placehold.co/600x400?text=No+Image',
      playtime: item.playtime_minutes || 0
    }));
  
  // Create normalized gamesList
  const gamesList = buildGamesList(data);
  
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
    gamesList
  };
};
