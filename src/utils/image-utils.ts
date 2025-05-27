
/**
 * Utility functions for handling game images consistently across the application
 */

/**
 * Constructs a Steam CDN URL from an app ID and image hash/filename
 * 
 * @param appId The Steam app ID
 * @param imageHash The image hash/filename from Steam API
 * @param imageType The type of image ('icon' or 'logo')
 * @returns Full Steam CDN URL
 */
export function constructSteamImageUrl(
  appId: number | string, 
  imageHash: string, 
  imageType: 'icon' | 'logo' = 'icon'
): string {
  if (!appId || !imageHash) return '/placeholder.svg';
  
  // Remove any existing URL prefix if present
  const cleanHash = imageHash.replace(/^https?:\/\/.*\//, '');
  
  // If it's already a full URL, return as-is
  if (imageHash.startsWith('http')) {
    return imageHash;
  }
  
  // Construct the proper Steam CDN URL
  const baseUrl = 'https://media.steampowered.com/steamcommunity/public/images/apps';
  return `${baseUrl}/${appId}/${cleanHash}.jpg`;
}

/**
 * Extracts the image hash from a Steam CDN URL
 * 
 * @param steamUrl Full Steam CDN URL
 * @returns Just the image hash/filename
 */
export function extractImageHashFromUrl(steamUrl: string): string | null {
  if (!steamUrl || steamUrl === '/placeholder.svg') return null;
  
  // Match pattern: https://media.steampowered.com/steamcommunity/public/images/apps/{appid}/{hash}.jpg
  const match = steamUrl.match(/\/apps\/\d+\/([^\/]+)\.jpg$/);
  return match ? match[1] : null;
}

/**
 * Determines if a URL is already a full Steam CDN URL
 * 
 * @param url URL to check
 * @returns true if it's a full Steam CDN URL
 */
export function isSteamCdnUrl(url: string): boolean {
  return url.startsWith('https://media.steampowered.com/steamcommunity/public/images/apps/');
}

/**
 * Returns the best available image URL for a game with fallback logic:
 * 1. Use header_image (high quality from Steam Store API)
 * 2. Fall back to image_url (constructed from Steam CDN if needed)
 * 3. Fall back to a local placeholder
 * 
 * @param headerImage Header image URL (preferred, from Steam Store API)
 * @param imageUrl Alternative image URL (from Steam library API)
 * @param gameId Game ID for constructing URLs if needed
 * @returns The best available image URL with fallback
 */
export function getBestGameImage(
  headerImage: string | null | undefined, 
  imageUrl: string | null | undefined,
  gameId?: number | string
): string {
  // First priority: header image (Steam Store API full resolution)
  if (headerImage && headerImage.trim() !== '' && headerImage !== '/placeholder.svg') {
    // If it's already a full URL, use it
    if (isSteamCdnUrl(headerImage) || headerImage.startsWith('http')) {
      return headerImage;
    }
    // If it's just a hash and we have a game ID, construct the URL
    if (gameId) {
      return constructSteamImageUrl(gameId, headerImage, 'logo');
    }
  }
  
  // Second priority: image URL (could be capsule or icon)
  if (imageUrl && imageUrl.trim() !== '' && imageUrl !== '/placeholder.svg') {
    // If it's already a full URL, use it
    if (isSteamCdnUrl(imageUrl) || imageUrl.startsWith('http')) {
      return imageUrl;
    }
    // If it's just a hash and we have a game ID, construct the URL
    if (gameId) {
      return constructSteamImageUrl(gameId, imageUrl, 'icon');
    }
  }
  
  // Fallback placeholder
  return '/placeholder.svg';
}

/**
 * Enhanced function specifically for database game data
 * Handles the nested structure returned from Supabase queries
 */
export function getBestGameImageFromDbData(
  gameData: any,
  gameId?: number | string
): string {
  // Handle nested games structure from database
  const actualGameData = gameData.games || gameData;
  const actualGameId = gameId || gameData.game_id || gameData.id;
  
  // Get header_image and image_url from the correct location
  const headerImage = actualGameData.header_image || gameData.header_image;
  const imageUrl = actualGameData.image_url || gameData.image_url;
  
  return getBestGameImage(headerImage, imageUrl, actualGameId);
}

/**
 * Formats a game title to ensure it doesn't break layouts
 * and applies consistent truncation if needed
 * 
 * @param title Game title
 * @param maxLength Maximum allowed length (default: no limit)
 * @returns Formatted title
 */
export function formatGameTitle(title: string, maxLength?: number): string {
  if (!title) return 'Unknown Game';
  
  if (maxLength && title.length > maxLength) {
    return `${title.substring(0, maxLength)}...`;
  }
  
  return title;
}

/**
 * Normalizes image data from different Steam API sources
 * This helps standardize the inconsistent formats we receive
 * 
 * @param imageData Object containing various image fields
 * @param gameId Game ID for URL construction
 * @returns Normalized image object
 */
export function normalizeGameImageData(
  imageData: {
    img_icon_url?: string;
    img_logo_url?: string;
    header_image?: string;
    image_url?: string;
  },
  gameId: number | string
): {
  image_url: string | null;
  header_image: string | null;
} {
  // For image_url: prefer img_icon_url (filename only from Steam library API)
  let image_url = null;
  if (imageData.img_icon_url) {
    // Store just the filename/hash for consistency
    image_url = imageData.img_icon_url;
  } else if (imageData.image_url) {
    // Extract hash if it's a full URL, otherwise use as-is
    const hash = extractImageHashFromUrl(imageData.image_url);
    image_url = hash || imageData.image_url;
  }
  
  // For header_image: prefer full URLs from Steam Store API
  let header_image = null;
  if (imageData.header_image) {
    // If it's already a full URL, use it
    if (isSteamCdnUrl(imageData.header_image) || imageData.header_image.startsWith('http')) {
      header_image = imageData.header_image;
    } else {
      // If it's just a hash, construct the full URL
      header_image = constructSteamImageUrl(gameId, imageData.header_image, 'logo');
    }
  } else if (imageData.img_logo_url) {
    // Construct from img_logo_url
    header_image = constructSteamImageUrl(gameId, imageData.img_logo_url, 'logo');
  }
  
  return {
    image_url,
    header_image
  };
}
