// Boundary validation using Zod schemas for UI responses

import { z } from "zod";
import { UILibraryItemSchema, UILibraryResponseSchema } from "@/contracts/ui/library";
import { UIDashboardDataSchema } from "@/contracts/ui/dashboard";
import { UIUnifiedSpendingDataSchema } from "@/contracts/ui/spend";

/**
 * Validate response data against UI contracts before sending to client
 */
export function validateUIResponse<T>(data: unknown, schema: z.ZodSchema<T>): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("UI Contract Validation Failed:", {
        errors: error.errors,
        received: data,
      });
      throw new Error(`UI contract validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
    }
    throw error;
  }
}

/**
 * Validate library response at boundary
 */
export function validateLibraryResponse(data: unknown) {
  return validateUIResponse(data, UILibraryResponseSchema);
}

/**
 * Validate dashboard response at boundary
 */
export function validateDashboardResponse(data: unknown) {
  return validateUIResponse(data, UIDashboardDataSchema);
}

/**
 * Validate spending response at boundary
 */
export function validateSpendingResponse(data: unknown) {
  return validateUIResponse(data, UIUnifiedSpendingDataSchema);
}

/**
 * Validate individual library item (for testing)
 */
export function validateLibraryItem(data: unknown) {
  return validateUIResponse(data, UILibraryItemSchema);
}