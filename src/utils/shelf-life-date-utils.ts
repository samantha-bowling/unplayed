
/**
 * Date calculation utilities for ShelfLife component
 */

export const calculateReleaseAge = (dateString: string) => {
  const releaseDate = new Date(dateString);
  const today = new Date();
  
  // Validate the date - Steam launched in 2003, so anything before that is suspicious
  if (releaseDate.getFullYear() < 1980) {
    return 'Retro game';
  }
  
  const yearDiff = today.getFullYear() - releaseDate.getFullYear();
  const monthDiff = today.getMonth() - releaseDate.getMonth();
  const dayDiff = today.getDate() - releaseDate.getDate();
  
  let totalMonths = yearDiff * 12 + monthDiff;
  
  // Adjust for day differences
  if (dayDiff < 0) {
    totalMonths--;
  }
  
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  
  if (years > 0) {
    if (months > 0) {
      return `${years}y ${months}m`;
    }
    return `${years} ${years === 1 ? 'year' : 'years'}`;
  } else if (months > 0) {
    return `${months} ${months === 1 ? 'month' : 'months'}`;
  } else {
    return 'This month';
  }
};

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};
