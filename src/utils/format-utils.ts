
/**
 * Utility functions for formatting dates, times, and other display values
 */

/**
 * Formats a date string into a readable format
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'Unknown';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return 'Invalid date';
  }
}

/**
 * Formats playtime in minutes to a readable string
 */
export function formatPlaytime(minutes: number | null | undefined): string {
  if (!minutes || minutes === 0) return 'Unplayed';
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours === 0) {
    return `${remainingMinutes}m`;
  } else if (remainingMinutes === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${remainingMinutes}m`;
  }
}

/**
 * Formats a price in cents to a currency string
 */
export function formatPrice(cents: number | null | undefined): string {
  if (!cents) return 'Free';
  return `$${(cents / 100).toFixed(2)}`;
}
