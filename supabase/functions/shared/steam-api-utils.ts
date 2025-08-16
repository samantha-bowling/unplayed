
// Steam API utilities for handling rate limiting, fetching, and data processing
export interface SteamGame {
  appid: number;
  name: string;
  playtime_forever?: number;
  img_icon_url?: string;
  img_logo_url?: string;
  rtime_last_played?: number;
  genres?: string[];
  categories?: string[];
  developers?: string[];
  publishers?: string[];
}

export interface SteamLibraryResponse {
  response: {
    games?: SteamGame[];
    game_count?: number;
  };
}

// Configuration for Steam API operations
const STEAM_API_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_BACKOFF_MS: 2000,
  BASE_DELAY_MS: 1200,
  BATCH_SIZE: 50,
};

/**
 * Makes a rate-limited request to Steam API with exponential backoff
 */
export async function makeRateLimitedSteamRequest(
  url: string, 
  retryCount = 0
): Promise<Response> {
  try {
    console.log(`Making Steam API request: ${url} (attempt ${retryCount + 1})`);
    
    // Add delay for rate limiting
    if (retryCount > 0) {
      const backoffMs = STEAM_API_CONFIG.INITIAL_BACKOFF_MS * Math.pow(2, retryCount - 1);
      console.log(`Rate limit backoff: waiting ${backoffMs}ms`);
      await new Promise(resolve => setTimeout(resolve, backoffMs));
    } else {
      await new Promise(resolve => setTimeout(resolve, STEAM_API_CONFIG.BASE_DELAY_MS));
    }
    
    const response = await fetch(url);
    
    // Handle rate limiting
    if (response.status === 429) {
      console.log(`Rate limited (429), retry ${retryCount + 1}/${STEAM_API_CONFIG.MAX_RETRIES}`);
      if (retryCount < STEAM_API_CONFIG.MAX_RETRIES) {
        return makeRateLimitedSteamRequest(url, retryCount + 1);
      } else {
        throw new Error(`Steam API rate limit exceeded after ${STEAM_API_CONFIG.MAX_RETRIES} retries. Your library may be partially imported. Please try again later to import remaining games.`);
      }
    }
    
    // Handle other HTTP errors with specific messages
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Steam API error ${response.status}:`, errorText);
      
      if (response.status === 403) {
        throw new Error(`Steam library access denied. Please ensure your Steam profile's 'Game details' are set to Public in your Steam Privacy Settings.`);
      } else if (response.status === 502 || response.status === 503) {
        throw new Error(`Steam servers are currently unavailable (${response.status}). Please try again in a few minutes.`);
      } else {
        throw new Error(`Steam API returned ${response.status}: ${errorText}`);
      }
    }
    
    return response;
  } catch (error) {
    if (retryCount < STEAM_API_CONFIG.MAX_RETRIES && 
        (error.message.includes('fetch') || error.message.includes('network'))) {
      console.log(`Network error, retrying: ${error.message}`);
      return makeRateLimitedSteamRequest(url, retryCount + 1);
    }
    throw error;
  }
}

/**
 * Fetches Steam library with enhanced large library handling
 */
export async function fetchSteamLibrary(
  steamId: string, 
  steamApiKey: string,
  userId?: string | null
): Promise<SteamGame[]> {
  console.log(`Fetching Steam library for Steam ID: ${steamId}`);
  
  // Import clients based on canary flag
  const { isCanaryEnabledForUser } = await import("./canary.ts");
  const { steamFetch } = await import("./steam-client.ts");
  const { STEAM_ENDPOINTS } = await import("./steam-client.ts");
  
  const useV2 = isCanaryEnabledForUser(userId);
  let games: SteamGame[] = [];
  let gameCount = 0;
  
  if (useV2) {
    console.log(`📡 Fetching Steam library (v2 client) for Steam ID: ${steamId}`);
    const steamData = await steamFetch<SteamLibraryResponse>(
      STEAM_ENDPOINTS.GET_OWNED_GAMES,
      {
        steamid: steamId,
        format: 'json',
        include_appinfo: true,
        include_played_free_games: true
      },
      { apiKey: steamApiKey },
      userId
    );
    
    if (!steamData?.response) {
      throw new Error("Invalid response from Steam API. Please check your Steam ID and privacy settings.");
    }
    
    games = steamData.response.games || [];
    gameCount = steamData.response.game_count || 0;
  } else {
    console.log(`📡 Fetching Steam library (legacy client) for Steam ID: ${steamId}`);
    const steamApiUrl = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${steamApiKey}&steamid=${steamId}&format=json&include_appinfo=true&include_played_free_games=true`;
    
    const steamResponse = await makeRateLimitedSteamRequest(steamApiUrl);
    const steamData: SteamLibraryResponse = await steamResponse.json();
    
    if (!steamData?.response) {
      throw new Error("Invalid response from Steam API. Please check your Steam ID and privacy settings.");
    }
    
    games = steamData.response.games || [];
    gameCount = steamData.response.game_count || 0;
  }
  
  console.log(`Steam API returned ${games.length} games, reported count: ${gameCount}`);
  
  // Detect potential API limits for large libraries
  await detectAndLogPotentialLimits(games, gameCount, steamId, steamApiKey);
  
  return games;
}

/**
 * Detects potential Steam API limits and logs warnings
 */
async function detectAndLogPotentialLimits(
  games: SteamGame[], 
  gameCount: number, 
  steamId: string, 
  steamApiKey: string
): Promise<void> {
  const isRoundNumber = games.length % 100 === 0 && games.length >= 1000;
  const countMismatch = gameCount > 0 && Math.abs(games.length - gameCount) > 10;
  
  if (isRoundNumber || countMismatch) {
    console.warn(`Potential API limit detected: ${games.length} games retrieved, reported count: ${gameCount}`);
    
    // Try alternative fetch without free games
    try {
      const altApiUrl = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${steamApiKey}&steamid=${steamId}&format=json&include_appinfo=true&include_played_free_games=false`;
      
      console.log("Attempting alternative fetch without free games...");
      const altResponse = await makeRateLimitedSteamRequest(altApiUrl);
      const altData: SteamLibraryResponse = await altResponse.json();
      const altGames = altData?.response?.games || [];
      
      console.log(`Alternative fetch returned ${altGames.length} games`);
      
      if (altGames.length !== games.length) {
        console.warn(`Discrepancy detected: With free games: ${games.length}, Without: ${altGames.length}`);
      }
    } catch (altError) {
      console.warn("Alternative fetch failed:", altError.message);
    }
  }
}

/**
 * Constructs Steam image URL from app ID and hash
 */
export function constructSteamImageUrl(
  appId: number, 
  imageHash: string, 
  imageType = 'icon'
): string | null {
  if (!appId || !imageHash) return null;
  
  // Remove any existing URL prefix if present
  const cleanHash = imageHash.replace(/^https?:\/\/.*\//, '');
  
  // Construct the proper Steam CDN URL
  const baseUrl = 'https://media.steampowered.com/steamcommunity/public/images/apps';
  return `${baseUrl}/${appId}/${cleanHash}.jpg`;
}

/**
 * Normalizes game image data for consistent storage
 */
export function normalizeGameImageData(
  imageData: { img_icon_url?: string; img_logo_url?: string }, 
  gameId: number
): { image_url: string | null; header_image: string | null } {
  // For image_url: prefer img_icon_url (filename only from Steam library API)
  let image_url = null;
  if (imageData.img_icon_url) {
    image_url = imageData.img_icon_url;
  }
  
  // For header_image: prefer full URLs from Steam Store API
  let header_image = null;
  if (imageData.img_logo_url) {
    header_image = constructSteamImageUrl(gameId, imageData.img_logo_url, 'logo');
  }
  
  return { image_url, header_image };
}
