import { z } from "zod";

// Match current DashboardData consumption exactly.
export const UIDashboardDataSchema = z.object({
  unplayedGames: z.number(),
  totalGames: z.number(),
  dustScore: z.number(),
  totalSpent: z.number(),
  unplayedSpent: z.number(),
  potentialGameplayHours: z.number(),
  cleanScore: z.number(),
  recentlyPlayedCount: z.number(),
  totalPlaytime: z.number(),
  // UI uses rich objects, not string[]
  genres: z.array(z.object({
    name: z.string(),
    value: z.number(),
    color: z.string(),
  })),
  shelfLife: z.array(z.unknown()), // keep as-is; refine only if current code requires
});

export type UIDashboardData = z.infer<typeof UIDashboardDataSchema>;