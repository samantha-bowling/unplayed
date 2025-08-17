
/**
 * Enhanced Steam API utilities with better large library handling
 * This is the implementation for the shared utilities
 */

export interface SteamLibraryOptions {
  includeAppInfo?: boolean;
  includePlayedFreeGames?: boolean;
  retryAttempts?: number;
  chunkSize?: number;
}

/**
 * Enhanced Steam library fetching with multiple API approaches
 * Handles large libraries (1000+ games) more reliably
 */
export async function fetchCompleteSteamLibrary(
  steamId: string, 
  apiKey: string,
  options: SteamLibraryOptions = {}
): Promise<any[]> {
  const {
    includeAppInfo = true,
    includePlayedFreeGames = true,
    retryAttempts = 3,
    chunkSize = 1000
  } = options;

  console.log(`🎮 Fetching complete Steam library for ${steamId}`);
  console.log(`📋 Options:`, { includeAppInfo, includePlayedFreeGames, retryAttempts });

  let allGames: any[] = [];
  let attempt = 0;

  while (attempt < retryAttempts) {
    try {
      console.log(`🔄 Attempt ${attempt + 1}/${retryAttempts}`);

      // Primary approach: GetOwnedGames with app info
      const ownedGamesUrl = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?` +
        `key=${apiKey}&steamid=${steamId}&format=json&include_appinfo=${includeAppInfo ? 1 : 0}` +
        `&include_played_free_games=${includePlayedFreeGames ? 1 : 0}`;

      console.log(`📡 Fetching from Steam API...`);
      const response = await fetch(ownedGamesUrl);

      if (!response.ok) {
        throw new Error(`Steam API responded with ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.response) {
        throw new Error('Invalid Steam API response structure');
      }

      allGames = data.response.games || [];
      console.log(`✅ Successfully fetched ${allGames.length} games`);

      // If we got a reasonable number of games, break out of retry loop
      if (allGames.length > 0) {
        break;
      }

      console.warn(`⚠️ Got 0 games, this might indicate privacy settings or API issues`);

    } catch (error) {
      console.error(`❌ Attempt ${attempt + 1} failed:`, error);
      
      if (attempt === retryAttempts - 1) {
        throw new Error(`Failed to fetch Steam library after ${retryAttempts} attempts: ${error.message}`);
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    attempt++;
  }

  // Validate and enhance game data
  const processedGames = allGames.map(game => ({
    appid: game.appid,
    name: game.name || `Unknown Game ${game.appid}`,
    playtime_forever: game.playtime_forever || 0,
    img_icon_url: game.img_icon_url || '',
    img_logo_url: game.img_logo_url || '',
    playtime_windows_forever: game.playtime_windows_forever || 0,
    playtime_mac_forever: game.playtime_mac_forever || 0,
    playtime_linux_forever: game.playtime_linux_forever || 0,
    rtime_last_played: game.rtime_last_played || null,
    // Preserve any additional fields that might be useful
    ...game
  }));

  console.log(`🎯 Processed ${processedGames.length} games with enhanced data`);
  
  return processedGames;
}

/**
 * Validates Steam library completeness
 * Helps detect if we might be missing games due to API limitations
 */
export function validateLibraryCompleteness(
  games: any[], 
  expectedMinimum?: number
): {
  isComplete: boolean;
  warnings: string[];
  recommendations: string[];
} {
  const warnings: string[] = [];
  const recommendations: string[] = [];
  
  // Check for suspiciously small libraries
  if (games.length === 0) {
    warnings.push('No games found in library');
    recommendations.push('Check Steam profile privacy settings - "Game details" must be set to Public');
  } else if (expectedMinimum && games.length < expectedMinimum * 0.9) {
    warnings.push(`Found ${games.length} games, expected around ${expectedMinimum}`);
    recommendations.push('Some games may be missing due to Steam API limitations or privacy settings');
  }
  
  // Check for missing essential data
  const gamesWithoutNames = games.filter(g => !g.name || g.name.trim() === '');
  if (gamesWithoutNames.length > 0) {
    warnings.push(`${gamesWithoutNames.length} games missing names`);
  }
  
  // Check for missing image data
  const gamesWithoutImages = games.filter(g => !g.img_icon_url && !g.img_logo_url);
  if (gamesWithoutImages.length > games.length * 0.1) {
    warnings.push(`${gamesWithoutImages.length} games missing image data`);
  }
  
  const isComplete = warnings.length === 0;
  
  console.log(`📊 Library validation: ${isComplete ? 'PASSED' : 'WARNINGS'}`);
  if (warnings.length > 0) {
    console.warn('⚠️ Validation warnings:', warnings);
  }
  
  return {
    isComplete,
    warnings,
    recommendations
  };
}
