/**
 * Profile theme configuration for user customization
 * Each theme defines gradient colors for the profile header and stat badges
 */

export type ProfileTheme = {
  id: string;
  name: string;
  description: string;
  gradient: string; // Tailwind gradient classes
  textColor: string; // Text color for contrast
  isPremium?: boolean; // For future theme unlocks
  isDynamic?: boolean; // For themes that change based on user data
};

export const PROFILE_THEMES: Record<string, ProfileTheme> = {
  dust_tier: {
    id: 'dust_tier',
    name: 'Dust Tier',
    description: 'Dynamic colors based on your Dust Score tier',
    gradient: 'from-dust-score-start to-dust-score-end', // Default, overridden when dynamic
    textColor: 'text-white',
    isDynamic: true,
  },
  steam_classic: {
    id: 'steam_classic',
    name: 'Steam Classic',
    description: 'Dark blue inspired by Steam',
    gradient: 'from-[#1b2838] to-[#2a475e]',
    textColor: 'text-white',
  },
  mint_fresh: {
    id: 'mint_fresh',
    name: 'Mint Fresh',
    description: 'Bright mint greens from Unplayed brand',
    gradient: 'from-unplayed-mint/30 to-unplayed-mint/60',
    textColor: 'text-white',
  },
  retro_arcade: {
    id: 'retro_arcade',
    name: 'Retro Arcade',
    description: 'Neon purples and pinks',
    gradient: 'from-purple-600 to-pink-500',
    textColor: 'text-white',
  },
  monochrome: {
    id: 'monochrome',
    name: 'Monochrome',
    description: 'Clean black and white',
    gradient: 'from-gray-800 to-gray-900',
    textColor: 'text-white',
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm orange to red gradient',
    gradient: 'from-orange-500 to-red-600',
    textColor: 'text-white',
  },
};

export const DEFAULT_THEME = 'dust_tier';

/**
 * Dust Score tier definitions matching DustScoreBreakdown.tsx
 * Uses exact colors from the existing 8-tier system
 */
interface DustTierDefinition {
  name: string;
  color: string;
  range: [number, number | null]; // null for max tier
  gradient: string;
}

const DUST_TIERS: DustTierDefinition[] = [
  {
    name: "Freshly Polished",
    color: "#A3F7BF", // Mint Green
    range: [0, 499],
    gradient: "from-[#A3F7BF] to-[#7BE3A0]" // Mint to deeper mint
  },
  {
    name: "Light Dusting",
    color: "#90EE90", // Light Green
    range: [500, 1499],
    gradient: "from-[#90EE90] to-[#66D966]" // Light green to deeper green
  },
  {
    name: "Dust Storm Brewing",
    color: "#FFD700", // Gold
    range: [1500, 3499],
    gradient: "from-[#FFD700] to-[#FFA500]" // Gold to orange
  },
  {
    name: "Duststorm Warning",
    color: "#FF9F39", // Orange
    range: [3500, 7499],
    gradient: "from-[#FF9F39] to-[#FF8C00]" // Orange to darker orange
  },
  {
    name: "Hoarder's Horizon",
    color: "#F6AD55", // Light Orange
    range: [7500, 14999],
    gradient: "from-[#F6AD55] to-[#ED8936]" // Light orange to darker orange
  },
  {
    name: "Dust Dynasty",
    color: "#FF6347", // Tomato Red
    range: [15000, 34999],
    gradient: "from-[#FF6347] to-[#DC143C]" // Tomato to crimson
  },
  {
    name: "Legendary Collector",
    color: "#8A2BE2", // Blue Violet
    range: [35000, 74999],
    gradient: "from-[#8A2BE2] to-[#6A1BB2]" // Violet to deeper violet
  },
  {
    name: "Mythical Archive",
    color: "#FF1493", // Hot Pink
    range: [75000, null],
    gradient: "from-[#FF1493] to-[#C71585]" // Hot pink to medium violet red
  }
];

/**
 * Get dynamic gradient for Dust Tier theme based on actual Dust Score
 * Maps user's dust score to one of 8 tier gradients using existing colors
 */
export const getDynamicDustTierGradient = (dustScore?: number): string => {
  // Default fallback if no dust score provided
  if (dustScore === undefined || dustScore === null) {
    return 'from-dust-score-start to-dust-score-end';
  }

  // Find matching tier based on dust score
  const tier = DUST_TIERS.find(t => {
    const [min, max] = t.range;
    if (max === null) {
      // Last tier has no upper limit
      return dustScore >= min;
    }
    return dustScore >= min && dustScore <= max;
  });

  // Return matching gradient or default fallback
  return tier?.gradient || 'from-dust-score-start to-dust-score-end';
};
