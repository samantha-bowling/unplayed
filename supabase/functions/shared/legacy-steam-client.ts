// Legacy Steam client wrapper - existing makeRateLimitedSteamRequest logic

/**
 * Legacy Steam client that maintains the existing behavior
 * This is used when STEAM_CLIENT_V2 is off or for non-canary users
 */

export async function makeRateLimitedSteamRequest(
  url: string, 
  retryCount = 0
): Promise<Response> {
  const STEAM_API_CONFIG = {
    MAX_RETRIES: 3,
    INITIAL_BACKOFF_MS: 2000,
    BASE_DELAY_MS: 1200,
  };

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