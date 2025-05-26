
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { SteamGame, normalizeGameImageData } from './steam-api-utils.ts';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Configuration for database operations
const DB_CONFIG = {
  BATCH_SIZE: 50,
  QUEUE_BATCH_SIZE: 200,
  RETRY_DELAY_MS: 500,
};

export interface ProcessingResult {
  total: number;
  gamesUpserted: number;
  relationshipsCreated: number;
}

/**
 * Processes games in optimized batches to avoid timeout issues
 */
export async function processGamesInBatches(
  userId: string, 
  steamId: string, 
  games: SteamGame[]
): Promise<ProcessingResult> {
  console.log(`Processing ${games.length} games in batches of ${DB_CONFIG.BATCH_SIZE}`);
  
  let totalGamesUpserted = 0;
  let totalRelationshipsCreated = 0;

  const batches = createBatches(games, DB_CONFIG.BATCH_SIZE);
  console.log(`Created ${batches.length} batches`);

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    console.log(`Processing batch ${batchIndex + 1}/${batches.length} with ${batch.length} games`);

    try {
      // Process games batch
      const gamesUpserted = await upsertGamesBatch(batch);
      totalGamesUpserted += gamesUpserted;

      // Process user-game relationships batch
      const relationshipsCreated = await upsertUserGamesBatch(userId, batch);
      totalRelationshipsCreated += relationshipsCreated;

      // Add delay between batches to be gentle on the database
      if (batchIndex < batches.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, DB_CONFIG.RETRY_DELAY_MS));
      }
    } catch (error) {
      console.error(`Error processing batch ${batchIndex + 1}:`, error);
      throw error;
    }
  }

  // Update user's last sync timestamp
  await updateUserLastSync(userId);

  console.log(`Import completed: ${totalGamesUpserted} games upserted, ${totalRelationshipsCreated} relationships created`);

  return {
    total: totalRelationshipsCreated,
    gamesUpserted: totalGamesUpserted,
    relationshipsCreated: totalRelationshipsCreated
  };
}

/**
 * Creates batches from an array of games
 */
function createBatches<T>(items: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  return batches;
}

/**
 * Upserts a batch of games to the database
 */
async function upsertGamesBatch(games: SteamGame[]): Promise<number> {
  const gameUpserts = games
    .map((game) => validateAndNormalizeGame(game))
    .filter(Boolean);

  if (gameUpserts.length === 0) return 0;

  const { error } = await supabase
    .from("games")
    .upsert(gameUpserts, {
      onConflict: "id",
      ignoreDuplicates: false
    });

  if (error) {
    console.error("Error upserting games:", error);
    throw error;
  }

  console.log(`Upserted ${gameUpserts.length} games`);
  return gameUpserts.length;
}

/**
 * Upserts a batch of user-game relationships
 */
async function upsertUserGamesBatch(userId: string, games: SteamGame[]): Promise<number> {
  const now = new Date().toISOString();
  
  const userGamesUpserts = games
    .map((game) => createUserGameRelationship(userId, game, now))
    .filter(Boolean);

  if (userGamesUpserts.length === 0) return 0;

  const { error } = await supabase
    .from("user_games")
    .upsert(userGamesUpserts, {
      onConflict: "user_id,game_id",
      ignoreDuplicates: false
    });

  if (error) {
    console.error("Error upserting user_games:", error);
    throw error;
  }

  console.log(`Created ${userGamesUpserts.length} user-game relationships`);
  return userGamesUpserts.length;
}

/**
 * Validates and normalizes a game for database storage
 */
function validateAndNormalizeGame(game: SteamGame) {
  if (!game.appid || !game.name || typeof game.appid !== "number") {
    console.warn("Skipping invalid game:", game);
    return null;
  }
  
  const normalizedImages = normalizeGameImageData({
    img_icon_url: game.img_icon_url,
    img_logo_url: game.img_logo_url
  }, game.appid);
  
  const gameData: any = {
    id: game.appid,
    name: game.name,
    image_url: normalizedImages.image_url,
    header_image: normalizedImages.header_image
  };
  
  // Add optional fields if they exist
  if (game.genres && Array.isArray(game.genres)) {
    gameData.genres = game.genres;
  }
  if (game.categories && Array.isArray(game.categories)) {
    gameData.categories = game.categories;
  }
  if (game.developers && Array.isArray(game.developers)) {
    gameData.developer = game.developers;
  }
  if (game.publishers && Array.isArray(game.publishers)) {
    gameData.publisher = game.publishers;
  }
  
  return gameData;
}

/**
 * Creates a user-game relationship object
 */
function createUserGameRelationship(userId: string, game: SteamGame, now: string) {
  if (!game.appid || typeof game.appid !== "number") {
    return null;
  }
  
  // Generate random acquisition date (simulate past purchases)
  const randomDaysAgo = Math.floor(Math.random() * 1095); // ~3 years
  const acquisitionDate = new Date();
  acquisitionDate.setDate(acquisitionDate.getDate() - randomDaysAgo);
  
  return {
    user_id: userId,
    game_id: game.appid,
    playtime_minutes: game.playtime_forever || 0,
    acquisition_date: acquisitionDate.toISOString(),
    last_played_date: game.rtime_last_played 
      ? new Date(game.rtime_last_played * 1000).toISOString() 
      : game.playtime_forever > 0 ? now : null
  };
}

/**
 * Updates the user's last sync timestamp
 */
async function updateUserLastSync(userId: string): Promise<void> {
  console.log("Updating last_sync timestamp");
  
  const { error } = await supabase
    .from("users")
    .update({ last_sync: new Date().toISOString() })
    .eq("id", userId);

  if (error) {
    console.error("Last sync update error:", error);
    throw error;
  }
}

/**
 * Queues games for detailed enrichment with priority for unplayed games
 */
export async function queueGamesForDetailedEnrichment(games: SteamGame[]): Promise<void> {
  try {
    console.log(`Queuing ${games.length} games for detailed enrichment (prioritizing unplayed games)`);
    
    // Prioritize UNPLAYED games - games with zero playtime get highest priority
    const queueItems = games.map(game => {
      let priority = 3; // Default priority
      
      // HIGHEST priority for unplayed games (zero playtime)
      if (!game.playtime_forever || game.playtime_forever === 0) {
        priority = 1; // Highest priority - unplayed games are most important
      } 
      // Lower priority for games with minimal playtime (tried but abandoned)
      else if (game.playtime_forever > 0 && game.playtime_forever < 60) {
        priority = 2; // High priority - might be worth revisiting
      }
      // Lowest priority for games with significant playtime
      else if (game.playtime_forever >= 60) {
        priority = 4; // Lower priority - already played significantly
      }
      
      // Recent games get slightly higher priority regardless of playtime
      if (game.rtime_last_played && game.rtime_last_played > (Date.now() / 1000) - (30 * 24 * 60 * 60)) {
        priority = Math.max(1, priority - 1);
      }
      
      return {
        app_id: game.appid,
        name: game.name,
        priority: priority
      };
    });
    
    // Sort to show prioritization in logs
    queueItems.sort((a, b) => a.priority - b.priority);
    console.log(`Priority distribution: P1(unplayed)=${queueItems.filter(g => g.priority === 1).length}, P2(minimal)=${queueItems.filter(g => g.priority === 2).length}, P3(default)=${queueItems.filter(g => g.priority === 3).length}, P4(played)=${queueItems.filter(g => g.priority === 4).length}`);
    
    // Insert into queue in optimized batches
    const batches = createBatches(queueItems, DB_CONFIG.QUEUE_BATCH_SIZE);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      
      const { error } = await supabase
        .from("steam_app_queue")
        .upsert(batch, {
          onConflict: "app_id",
          ignoreDuplicates: true,
        });
      
      if (error) {
        console.error(`Error queuing batch ${i + 1}:`, error);
      }
    }
    
    console.log("Games queued for detailed enrichment with unplayed games prioritized");
  } catch (error) {
    console.error("Error queuing games for enrichment:", error);
    // Don't fail the import if queuing fails
  }
}
