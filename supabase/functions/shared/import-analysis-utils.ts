
/**
 * Shared utilities for analyzing and processing Steam library imports
 */

export interface ImportResult {
  newGamesImported: number;
  existingGamesUpdated: number;
  totalProcessed: number;
  errors: string[];
  warnings: string[];
}

/**
 * Safely imports only new games, preserving existing enriched data
 */
export async function safeImportNewGames(
  supabase: any,
  userId: string,
  steamId: string,
  newGames: any[]
): Promise<ImportResult> {
  console.log(`🔒 Safe import: Processing ${newGames.length} new games for user ${userId}`);
  
  const result: ImportResult = {
    newGamesImported: 0,
    existingGamesUpdated: 0,
    totalProcessed: 0,
    errors: [],
    warnings: []
  };

  if (newGames.length === 0) {
    console.log('✅ No new games to import');
    return result;
  }

  // Process games in smaller batches to avoid overwhelming the database
  const BATCH_SIZE = 100;
  
  for (let i = 0; i < newGames.length; i += BATCH_SIZE) {
    const batch = newGames.slice(i, i + BATCH_SIZE);
    console.log(`📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(newGames.length / BATCH_SIZE)}`);
    
    try {
      // First, ensure all games exist in the games table (basic info only)
      const gameUpserts = batch.map(game => ({
        id: game.appid,
        name: game.name || `Unknown Game ${game.appid}`,
        // Only set image_url if we don't have header_image data
        image_url: game.img_icon_url || null,
        // Don't overwrite existing header_image or other enriched data
      }));

      const { error: gamesError } = await supabase
        .from('games')
        .upsert(gameUpserts, {
          onConflict: 'id',
          ignoreDuplicates: false
        });

      if (gamesError) {
        const errorMsg = `Batch ${Math.floor(i / BATCH_SIZE) + 1} games upsert failed: ${gamesError.message}`;
        console.error(errorMsg);
        result.errors.push(errorMsg);
        continue;
      }

      // Create user_games relationships for new games only
      const userGameInserts = batch.map(game => ({
        user_id: userId,
        game_id: game.appid,
        playtime_minutes: game.playtime_forever || 0,
        acquisition_date: new Date().toISOString(), // Default to now if we don't have acquisition date
        last_played_date: game.rtime_last_played ? 
          new Date(game.rtime_last_played * 1000).toISOString() : null,
      }));

      const { error: userGamesError } = await supabase
        .from('user_games')
        .insert(userGameInserts);

      if (userGamesError) {
        const errorMsg = `Batch ${Math.floor(i / BATCH_SIZE) + 1} user_games insert failed: ${userGamesError.message}`;
        console.error(errorMsg);
        result.errors.push(errorMsg);
        continue;
      }

      result.newGamesImported += batch.length;
      result.totalProcessed += batch.length;
      
      console.log(`✅ Batch ${Math.floor(i / BATCH_SIZE) + 1} completed: ${batch.length} games`);

    } catch (error) {
      const errorMsg = `Unexpected error in batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`;
      console.error(errorMsg);
      result.errors.push(errorMsg);
    }
  }

  console.log(`🎯 Safe import completed: ${result.newGamesImported} new games imported`);
  return result;
}

/**
 * Updates only playtime and last_played data for existing games
 * Preserves all enriched metadata (images, descriptions, etc.)
 */
export async function updateExistingGamesPlaytime(
  supabase: any,
  userId: string,
  existingGames: any[]
): Promise<ImportResult> {
  console.log(`🔄 Updating playtime for ${existingGames.length} existing games`);
  
  const result: ImportResult = {
    newGamesImported: 0,
    existingGamesUpdated: 0,
    totalProcessed: 0,
    errors: [],
    warnings: []
  };

  if (existingGames.length === 0) {
    return result;
  }

  try {
    // Create a map of game updates
    const gameUpdates = existingGames.map(game => ({
      user_id: userId,
      game_id: game.appid,
      playtime_minutes: game.playtime_forever || 0,
      last_played_date: game.rtime_last_played ? 
        new Date(game.rtime_last_played * 1000).toISOString() : null,
    }));

    // Update user_games with only playtime data, preserving everything else
    for (const update of gameUpdates) {
      const { error } = await supabase
        .from('user_games')
        .update({
          playtime_minutes: update.playtime_minutes,
          last_played_date: update.last_played_date,
        })
        .eq('user_id', userId)
        .eq('game_id', update.game_id);

      if (error) {
        result.errors.push(`Failed to update game ${update.game_id}: ${error.message}`);
      } else {
        result.existingGamesUpdated++;
      }
      
      result.totalProcessed++;
    }

    console.log(`✅ Updated ${result.existingGamesUpdated} existing games`);

  } catch (error) {
    const errorMsg = `Error updating existing games: ${error.message}`;
    console.error(errorMsg);
    result.errors.push(errorMsg);
  }

  return result;
}
