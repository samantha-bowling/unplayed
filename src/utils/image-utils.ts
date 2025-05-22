
/**
 * Utility functions for handling game images consistently across the application
 */

/**
 * Returns the best available image URL for a game with fallback logic:
 * 1. Use header_image (high quality from Steam)
 * 2. Fall back to image_url
 * 3. Fall back to a local placeholder
 * 
 * @param headerImage Header image URL (preferred)
 * @param imageUrl Alternative image URL
 * @returns The best available image URL with fallback
 */
export function getBestGameImage(
  headerImage: string | null | undefined, 
  imageUrl: string | null | undefined
): string {
  // First priority: header image (Steam full resolution)
  if (headerImage && headerImage.trim() !== '') {
    return headerImage;
  }
  
  // Second priority: image URL (could be capsule or other)
  if (imageUrl && imageUrl.trim() !== '') {
    return imageUrl;
  }
  
  // Fallback placeholder
  return '/placeholder.svg';
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
