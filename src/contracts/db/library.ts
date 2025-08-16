import { z } from "zod";

export const DBUserGameSchema = z.object({
  id: z.string(),
  game_id: z.number(),
  playtime_minutes: z.number(),     // snake_case
  hidden: z.boolean(),
  dust_score: z.number(),
  last_played_date: z.string().nullable(),
  acquisition_date: z.string().nullable(),
  notes: z.string().nullable(),
});

export const DBLibraryItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  image_url: z.string().nullable(),   // snake_case
  header_image: z.string().nullable(),
  release_date: z.string().nullable(),
  metacritic_score: z.number().nullable(),
  genres: z.array(z.string()).default([]),
  categories: z.array(z.string()).default([]),
  price_cents: z.number().nullable(),
  userGame: DBUserGameSchema,
});

export type DBLibraryItem = z.infer<typeof DBLibraryItemSchema>;

export const DBLibraryResponseSchema = z.object({
  games: z.array(DBLibraryItemSchema),
  totalCount: z.number(),
});

export type DBLibraryResponse = z.infer<typeof DBLibraryResponseSchema>;