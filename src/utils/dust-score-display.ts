
/**
 * Utilities for dust score display calculations with memoization support
 */

interface DustScoreDisplayData {
  severityColor: string;
  severityText: string;
  description: string;
  scaleFactor: number;
  maxDisplayScore: number;
}

/**
 * Memoized dust score display calculations
 */
export const calculateDustScoreDisplay = (score: number): DustScoreDisplayData => {
  // Severity color calculation
  const severityColor = score < 1000 
    ? 'text-green-400'
    : score < 5000 
    ? 'text-orange-400'
    : score < 10000 
    ? 'text-amber-600'
    : 'text-unplayed-red';

  // Severity text calculation
  const severityText = score < 1000 
    ? 'Freshly Polished ✨'
    : score < 5000 
    ? 'Dust Storm Brewing 🌬️'
    : score < 10000 
    ? 'Duststorm Warning 🌪️'
    : "Hoarder's Horizon 🤍";

  // Description calculation
  const description = score < 1000
    ? "Your library is in good shape! Keep it up."
    : score < 5000
    ? "Some games could use your attention soon."
    : score < 10000
    ? "Warning: Your backlog is getting out of control."
    : "Critical: Your library has reached dust apocalypse levels.";

  // Scale factor for large numbers
  const scaleFactor = score < 1000 
    ? 1 
    : score < 10000 
    ? 10 
    : score < 100000 
    ? 100 
    : 1000;

  return {
    severityColor,
    severityText,
    description,
    scaleFactor,
    maxDisplayScore: 1500
  };
};

/**
 * Format large numbers with commas for display
 */
export const formatDustScore = (score: number): string => {
  return score.toLocaleString();
};
