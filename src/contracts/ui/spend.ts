import { z } from "zod";

export const UIUnifiedSpendingDataSchema = z.object({
  totalLibraryValue: z.number(),
  unplayedSpent: z.number(),
  totalGameCount: z.number(),
  unplayedGameCount: z.number(),
  currency: z.string(),
  lastCalculated: z.string(),
  data_quality: z.string(),
});

export type UIUnifiedSpendingData = z.infer<typeof UIUnifiedSpendingDataSchema>;