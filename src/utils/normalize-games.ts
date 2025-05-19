
/**
 * Utility to normalize game data coming from various sources
 */

export const normalizeDemoGames = (games) => {
  if (!games || !Array.isArray(games)) {
    return [];
  }
  
  return games.map((game) => ({
    id: game.appid || game.id,
    name: game.name,
    img_icon_url: game.img_icon_url || '',
    img_logo_url: game.img_logo_url || '',
    playtime_forever: game.playtime_forever || 0,
    playtime_2weeks: game.playtime_2weeks || 0,
    has_community_visible_stats: game.has_community_visible_stats || false,
    // Add any other normalizations here
  }));
};
