
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

/**
 * Formats a date into a human-readable relative time string.
 * e.g. "just now", "5 minutes ago", "3 days ago", "2 weeks ago"
 */
export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return 'Never';

  const now = new Date();
  const then = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(then.getTime())) return 'Unknown';

  const diffMs = now.getTime() - then.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSeconds < 60) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  if (diffWeeks < 5) return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`;
  return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;
}

/**
 * Checks if a date is older than a given number of days.
 */
export function isOlderThanDays(date: Date | string | null | undefined, days: number): boolean {
  if (!date) return true;
  const then = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(then.getTime())) return true;
  const diffMs = new Date().getTime() - then.getTime();
  return diffMs > days * 24 * 60 * 60 * 1000;
}
