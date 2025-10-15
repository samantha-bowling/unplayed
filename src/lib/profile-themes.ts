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
};

export const PROFILE_THEMES: Record<string, ProfileTheme> = {
  dust_tier: {
    id: 'dust_tier',
    name: 'Dust Tier',
    description: 'Dynamic colors based on your Dust Score tier',
    gradient: 'from-dust-score-start to-dust-score-end',
    textColor: 'text-white',
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
