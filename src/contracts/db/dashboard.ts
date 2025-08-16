import { z } from "zod";

export const DBDashboardDataSchema = z.object({
  total_games: z.number(),
  unplayed_games: z.number(),
  total_dust_score: z.number(),
  clean_score: z.number(),
  recently_played_count: z.number(),
  total_playtime_hours: z.number(),
  total_library_value_cents: z.number(),
  unplayed_value_cents: z.number(),
  // DB uses string arrays for genres
  user_genre_stats: z.array(z.object({
    genre_name: z.string(),
    game_count: z.number(),
    percentage: z.number(),
    color_hex: z.string(),
  })).optional(),
  shelf_life_data: z.array(z.unknown()).optional(),
});

export type DBDashboardData = z.infer<typeof DBDashboardDataSchema>;