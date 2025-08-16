// Dashboard DB → UI adapter

import { DBDashboardData } from "@/contracts/db/dashboard";
import { UIDashboardData } from "@/contracts/ui/dashboard";

/**
 * Adapt DB dashboard data to UI format
 */
export function adaptDashboardDBToUI(db: DBDashboardData): UIDashboardData {
  return {
    unplayedGames: db.unplayed_games,
    totalGames: db.total_games,
    dustScore: db.total_dust_score,
    totalSpent: Math.round(db.total_library_value_cents / 100), // Convert cents to dollars
    unplayedSpent: Math.round(db.unplayed_value_cents / 100),
    potentialGameplayHours: 0, // TODO: Calculate from shelf life data
    cleanScore: db.clean_score,
    recentlyPlayedCount: db.recently_played_count,
    totalPlaytime: db.total_playtime_hours,
    // Transform DB genre stats to UI rich objects
    genres: (db.user_genre_stats || []).map(stat => ({
      name: stat.genre_name,
      value: stat.game_count,
      color: stat.color_hex,
    })),
    shelfLife: db.shelf_life_data || [],
  };
}