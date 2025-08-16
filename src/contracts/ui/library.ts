import { z } from "zod";

export const UILibraryItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  imageUrl: z.string(),     // UI expects "imageUrl" (not image_url)
  headerImage: z.string().nullable().optional(),
  playtimeMinutes: z.number(),  // UI expects "playtimeMinutes" (not playtime_minutes)
  dustScore: z.number().nullable(),
  isHidden: z.boolean().nullable(),
  notes: z.string().nullable(),
  userGameId: z.string(),
});

export type UILibraryItem = z.infer<typeof UILibraryItemSchema>;

export const UILibraryResponseSchema = z.object({
  games: z.array(UILibraryItemSchema),
  pagination: z.object({
    currentPage: z.number(),
    totalItems: z.number(),
    totalPages: z.number(),
    pageSize: z.number(),
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
  }),
});

export type UILibraryResponse = z.infer<typeof UILibraryResponseSchema>;