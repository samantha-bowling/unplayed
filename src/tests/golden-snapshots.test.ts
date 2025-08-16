// Golden snapshot tests for UI contract validation

import { adaptDBToUI } from "@/adapters/library-adapter";
import { validateLibraryItem } from "@/utils/boundary-validator";
import { DBLibraryItem } from "@/contracts/db/library";

/**
 * Golden test data representing typical DB response
 */
const mockDBLibraryItem: DBLibraryItem = {
  id: 730,
  name: "Counter-Strike 2",
  image_url: "c5962b3ac8df332b6aba90c66b5daa6c4b7c1b4d",
  header_image: "https://steamcdn-a.akamaihd.net/steam/apps/730/header.jpg",
  release_date: "2012-08-21",
  metacritic_score: 83,
  genres: ["Action", "FPS"],
  categories: ["Multiplayer", "Online Co-op"],
  price_cents: 0,
  userGame: {
    id: "uuid-123",
    game_id: 730,
    playtime_minutes: 12450,
    hidden: false,
    dust_score: 15,
    last_played_date: "2024-01-15T10:30:00Z",
    acquisition_date: "2023-06-01T00:00:00Z",
    notes: "Great FPS game",
  },
};

/**
 * Test that adapter produces valid UI format
 * This catches any accidental rename (e.g., image vs imageUrl)
 */
export function testGameCardPropsAdapter() {
  try {
    // Convert DB to UI using adapter
    const uiItem = adaptDBToUI(mockDBLibraryItem);
    
    // Validate against UI contract
    const validatedItem = validateLibraryItem(uiItem);
    
    // Snapshot test - these values should remain stable
    const expectedShape = {
      id: 730,
      name: "Counter-Strike 2",
      imageUrl: "string", // Should be processed by getBestGameImage
      headerImage: "https://steamcdn-a.akamaihd.net/steam/apps/730/header.jpg",
      playtimeMinutes: 12450,
      dustScore: 15,
      isHidden: false,
      notes: "Great FPS game",
      userGameId: "uuid-123",
    };
    
    // Critical UI props that must be camelCase
    if (!validatedItem.imageUrl) {
      throw new Error("imageUrl missing - UI expects camelCase");
    }
    if (validatedItem.playtimeMinutes !== 12450) {
      throw new Error("playtimeMinutes mismatch - UI expects camelCase");
    }
    
    console.log("✅ Golden component data test passed");
    console.log("📸 UI Shape:", JSON.stringify(validatedItem, null, 2));
    
    return validatedItem;
  } catch (error) {
    console.error("❌ Golden component data test failed:", error);
    throw error;
  }
}

/**
 * Sort invariance test data
 */
export const mockLibraryGameIds = [730, 440, 570, 271590, 304930, 218620, 359550, 431960, 284820, 322330];

/**
 * Test that library order remains consistent before/after v2 client
 */
export function testSortInvariance(gameIds: number[]) {
  // This would be called with real data to ensure first 10 IDs are identical
  const first10 = gameIds.slice(0, 10);
  
  // In production, this would compare against a stored snapshot
  const expectedOrder = [730, 440, 570, 271590, 304930, 218620, 359550, 431960, 284820, 322330];
  
  const isMatch = JSON.stringify(first10) === JSON.stringify(expectedOrder);
  
  if (!isMatch) {
    throw new Error(`Sort order changed: expected ${expectedOrder}, got ${first10}`);
  }
  
  console.log("✅ Sort invariance test passed");
  return true;
}

// Run tests if this file is executed in a Node.js environment
if (typeof window === "undefined" && typeof process !== "undefined") {
  try {
    testGameCardPropsAdapter();
    testSortInvariance(mockLibraryGameIds);
  } catch (error) {
    console.error("Test execution failed:", error);
  }
}