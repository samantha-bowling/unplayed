
/**
 * Utilities for detecting what games need to be imported vs already exist
 */
import { supabase } from '@/integrations/supabase/client';
import { devLog } from '../lib/dev-log';

export interface ImportAnalysis {
  existingGames: number[];
  newGames: any[];
  totalLibrarySize: number;
  alreadyImportedCount: number;
  newGamesCount: number;
}

/**
 * Analyzes a Steam library to determine what needs to be imported
 */
export async function analyzeLibraryForImport(
  userId: string, 
  steamLibrary: any[]
): Promise<ImportAnalysis> {
  devLog(`🔍 Analyzing library for user ${userId}: ${steamLibrary.length} games from Steam`);
  
  // Get all game IDs that the user already has imported
  const { data: existingUserGames, error } = await supabase
    .from('user_games')
    .select('game_id')
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error fetching existing user games:', error);
    throw error;
  }
  
  const existingGameIds = new Set(existingUserGames?.map(ug => ug.game_id) || []);
  devLog(`📚 User already has ${existingGameIds.size} games imported`);
  
  // Filter to only new games that haven't been imported yet
  const newGames = steamLibrary.filter(game => {
    const gameId = game.appid || game.id;
    return !existingGameIds.has(gameId);
  });
  
  devLog(`🆕 Found ${newGames.length} new games to import`);
  devLog(`✅ ${existingGameIds.size} games already imported, skipping`);
  
  return {
    existingGames: Array.from(existingGameIds),
    newGames,
    totalLibrarySize: steamLibrary.length,
    alreadyImportedCount: existingGameIds.size,
    newGamesCount: newGames.length
  };
}

/**
 * Checks if a full library re-sync is needed
 * This helps detect when Steam API might have missed games
 */
export function shouldPerformFullResync(analysis: ImportAnalysis): boolean {
  const { totalLibrarySize, alreadyImportedCount, newGamesCount } = analysis;
  
  // If we're missing more than 10% of the library, suggest full resync
  const missingPercentage = newGamesCount / totalLibrarySize;
  
  devLog(`📊 Library analysis: ${missingPercentage * 100}% new games detected`);
  
  return missingPercentage > 0.1; // More than 10% missing
}
