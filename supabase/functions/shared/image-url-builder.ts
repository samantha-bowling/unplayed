// Centralized image URL building that preserves existing getBestGameImage behavior

export interface GameImageData {
  img_icon_url?: string;
  img_logo_url?: string; 
  header_image?: string;
  image_url?: string;
  clienticon?: string;
  header_hash?: string;
}

export interface ImageUrlSet {
  icon_url: string | null;
  header_image: string | null;
  logo_url: string | null;
}

/**
 * Build standardized image URL set from various Steam API sources
 * Preserves existing semantics; only fills gaps with consistent fallbacks
 */
export function buildImageUrlSet(appid: number, source: GameImageData): ImageUrlSet {
  // Icon URL: prefer img_icon_url (filename only), construct if needed
  const icon_url = source?.img_icon_url ? 
    constructSteamCdnUrl(appid, source.img_icon_url, 'icon') :
    (source?.clienticon ? constructSteamCdnUrl(appid, source.clienticon, 'icon') : null);
  
  // Header image: prefer existing header_image URLs, construct from hash if needed
  let header_image = source?.header_image || null;
  if (!header_image && source?.header_hash) {
    header_image = constructSteamCdnUrl(appid, source.header_hash, 'header');
  }
  
  // Logo URL: only if explicitly provided or constructed from img_logo_url
  const logo_url = source?.img_logo_url ? 
    constructSteamCdnUrl(appid, source.img_logo_url, 'logo') : null;
  
  return { icon_url, header_image, logo_url };
}

/**
 * Construct Steam CDN URL from app ID and image hash
 */
export function constructSteamCdnUrl(
  appid: number, 
  imageHash: string, 
  imageType: 'icon' | 'logo' | 'header' = 'icon'
): string {
  if (!appid || !imageHash) return '';
  
  // Remove any existing URL prefix if present
  const cleanHash = imageHash.replace(/^https?:\/\/.*\//, '');
  
  // If it's already a full URL, return as-is
  if (imageHash.startsWith('http')) {
    return imageHash;
  }
  
  // Construct the proper Steam CDN URL based on type
  const baseUrl = 'https://media.steampowered.com/steamcommunity/public/images/apps';
  
  switch (imageType) {
    case 'header':
      // Header images use different CDN path
      return `https://steamcdn-a.akamaihd.net/steam/apps/${appid}/header.jpg`;
    case 'logo':
      return `${baseUrl}/${appid}/${cleanHash}.jpg`;
    case 'icon':
    default:
      return `${baseUrl}/${appid}/${cleanHash}.jpg`;
  }
}

/**
 * Normalize game image data for consistent storage
 * This maintains compatibility with existing image-utils.ts functions
 */
export function normalizeGameImageData(
  imageData: GameImageData,
  gameId: number
): { image_url: string | null; header_image: string | null } {
  const imageSet = buildImageUrlSet(gameId, imageData);
  
  return {
    image_url: imageSet.icon_url,
    header_image: imageSet.header_image
  };
}