import { 
  DustScoreBreakdown, 
  GameDustData, 
  CleanScoreBreakdown, 
  CleanScoreTier, 
  GameListItem 
} from '@/types/unplayed-data.types';

export interface DemoDataType {
  unplayedGames: number;
  totalGames: number;
  dustScore: number;
  totalPlaytime: number; // in hours
  totalSpent: number; // in dollars
  unplayedSpent: number; // in dollars - spending on unplayed games only
  potentialGameplayHours: number; // Added for HLTB integration
  
  // Dust score specific data
  dustScoreBreakdown?: DustScoreBreakdown;
  topDustContributors?: GameDustData[];
  avgDustScore?: number;
  
  // Clean score specific data
  cleanScore?: number;
  cleanScoreBreakdown?: CleanScoreBreakdown;
  cleanTier?: CleanScoreTier;
  cleanStreak?: number;
  recentlyPlayedCount?: number;
  
  // Game collections
  gamesList?: GameListItem[];
  
  genres: Array<{ name: string; value: number; color: string }>;
  shelfLife: Array<{ 
    id: number;
    name: string;  // Changed from title to name
    addedDate: string;
    releaseDate: string; // Added release date field
    image: string;  // Changed from imageUrl to image
  }>;
  library: Array<{
    id: number;
    name: string;  // Changed from title to name
    image: string;
    playtime: number;
  }>;
}

export const DEMO_DATA: DemoDataType = {
  unplayedGames: 47,
  totalGames: 89,
  dustScore: 1847,
  totalPlaytime: 142.5,
  totalSpent: 234.99,
  unplayedSpent: 189.50,
  potentialGameplayHours: 587.5,
  
  // Enhanced dust score breakdown with new 5-factor system
  dustScoreBreakdown: {
    qualityScore: 12,    // Average quality across library
    priceScore: 18,      // Mix of pricing tiers
    ageScore: 15,        // Mix of old and new games
    genreScore: 10,      // Common genres mostly
    playtimeFactor: 0.85 // Some games played
  },
  
  topDustContributors: [
    {
      id: 1,
      name: "Cyberpunk 2077",
      dustScore: 95,
      addedDate: "2020-12-10T00:00:00Z",
      releaseDate: "2020-12-10",
      playtimeMinutes: 0,
      image: "https://cdn.akamai.steamstatic.com/steam/apps/1091500/header.jpg",
      breakdown: {
        qualityScore: 18, // Decent Metacritic
        priceScore: 25,   // AAA pricing
        ageScore: 10,     // Recent game
        genreScore: 8,    // Common genre
        playtimeFactor: 1.0 // Unplayed
      }
    },
    {
      id: 2,
      name: "The Witcher 3: Wild Hunt",
      dustScore: 88,
      addedDate: "2015-05-19T00:00:00Z",
      releaseDate: "2015-05-19",
      playtimeMinutes: 0,
      image: "https://cdn.akamai.steamstatic.com/steam/apps/292030/header.jpg",
      breakdown: {
        qualityScore: 5,  // Excellent Metacritic
        priceScore: 20,   // Premium pricing
        ageScore: 20,     // Older game
        genreScore: 8,    // Common genre
        playtimeFactor: 1.0 // Unplayed
      }
    },
    {
      id: 3,
      name: "Fall Guys",
      dustScore: 75,
      addedDate: "2020-08-04T00:00:00Z",
      releaseDate: "2020-08-04",
      playtimeMinutes: 0,
      image: "https://cdn.akamai.steamstatic.com/steam/apps/1097150/header.jpg",
      breakdown: {
        qualityScore: 12, // Good Metacritic
        priceScore: 5,    // Free game
        ageScore: 10,     // Recent
        genreScore: 12,   // Mixed genre
        playtimeFactor: 1.0 // Unplayed
      }
    },
    {
      id: 4,
      name: "Among Us",
      dustScore: 72,
      addedDate: "2018-11-16T00:00:00Z",
      releaseDate: "2018-11-16",
      playtimeMinutes: 0,
      image: "https://cdn.akamai.steamstatic.com/steam/apps/945360/header.jpg",
      breakdown: {
        qualityScore: 15, // Decent score
        priceScore: 5,    // Very cheap
        ageScore: 15,     // Few years old
        genreScore: 12,   // Social deduction
        playtimeFactor: 1.0 // Unplayed
      }
    },
    {
      id: 5,
      name: "Hollow Knight",
      dustScore: 65,
      addedDate: "2017-02-24T00:00:00Z",
      releaseDate: "2017-02-24",
      playtimeMinutes: 0,
      image: "https://cdn.akamai.steamstatic.com/steam/apps/367520/header.jpg",
      breakdown: {
        qualityScore: 5,  // Excellent reviews
        priceScore: 10,   // Budget pricing
        ageScore: 20,     // Older indie
        genreScore: 8,    // Metroidvania
        playtimeFactor: 1.0 // Unplayed
      }
    }
  ],
  
  avgDustScore: 29.7,
  
  // Keep existing clean score data
  cleanScore: 68,
  cleanScoreBreakdown: {
    completionRate: 75,
    engagementFactor: 60,
    recencyFactor: 65
  },
  cleanTier: {
    name: 'Reasonably Clean',
    color: '#60a5fa',
    range: [50, 74]
  },
  cleanStreak: 4,
  recentlyPlayedCount: 5,
  
  // Keep existing demo games data
  gamesList: [
    {
      id: 1091500,
      name: "Cyberpunk 2077",
      image: "https://cdn.akamai.steamstatic.com/steam/apps/1091500/header.jpg",
      playtimeMinutes: 0,
      releaseDate: "2020-12-10",
      price: 59.99,
      price_cents: 5999,
      genres: ["Action", "RPG"],
      categories: ["Single-player", "Steam Cloud"],
      addedDate: "2020-12-10T00:00:00Z",
      dustScore: 95,
      metacritic_score: 72
    },
    {
      id: 292030,
      name: "The Witcher 3: Wild Hunt",
      image: "https://cdn.akamai.steamstatic.com/steam/apps/292030/header.jpg",
      playtimeMinutes: 0,
      releaseDate: "2015-05-19",
      price: 39.99,
      price_cents: 3999,
      genres: ["RPG", "Adventure"],
      categories: ["Single-player", "Steam Trading Cards"],
      addedDate: "2015-05-19T00:00:00Z",
      dustScore: 88,
      metacritic_score: 93
    },
    {
      id: 1097150,
      name: "Fall Guys",
      image: "https://cdn.akamai.steamstatic.com/steam/apps/1097150/header.jpg",
      playtimeMinutes: 120,
      releaseDate: "2020-08-04",
      price: 0,
      price_cents: 0,
      genres: ["Action", "Casual", "Indie"],
      categories: ["Multi-player", "Online Multi-Player"],
      addedDate: "2020-08-04T00:00:00Z",
      dustScore: 45,
      metacritic_score: 79
    }
  ],
  
  // Keep existing visualization data
  library: [
    { id: 1091500, name: "Cyberpunk 2077", image: "https://cdn.akamai.steamstatic.com/steam/apps/1091500/header.jpg", playtime: 0 },
    { id: 292030, name: "The Witcher 3", image: "https://cdn.akamai.steamstatic.com/steam/apps/292030/header.jpg", playtime: 0 },
    { id: 1097150, name: "Fall Guys", image: "https://cdn.akamai.steamstatic.com/steam/apps/1097150/header.jpg", playtime: 120 },
    { id: 945360, name: "Among Us", image: "https://cdn.akamai.steamstatic.com/steam/apps/945360/header.jpg", playtime: 0 },
    { id: 367520, name: "Hollow Knight", image: "https://cdn.akamai.steamstatic.com/steam/apps/367520/header.jpg", playtime: 0 },
    { id: 271590, name: "Grand Theft Auto V", image: "https://cdn.akamai.steamstatic.com/steam/apps/271590/header.jpg", playtime: 45 },
    { id: 730, name: "Counter-Strike: Global Offensive", image: "https://cdn.akamai.steamstatic.com/steam/apps/730/header.jpg", playtime: 0 },
    { id: 578080, name: "PUBG: BATTLEGROUNDS", image: "https://cdn.akamai.steamstatic.com/steam/apps/578080/header.jpg", playtime: 0 },
    { id: 418370, name: "Terraria", image: "https://cdn.akamai.steamstatic.com/steam/apps/105600/header.jpg", playtime: 0 },
    { id: 570, name: "Dota 2", image: "https://cdn.akamai.steamstatic.com/steam/apps/570/header.jpg", playtime: 0 },
    { id: 444090, name: "Payday 2", image: "https://cdn.akamai.steamstatic.com/steam/apps/218620/header.jpg", playtime: 0 },
    { id: 108200, name: "Garry's Mod", image: "https://cdn.akamai.steamstatic.com/steam/apps/4000/header.jpg", playtime: 0 }
  ],
  
  // Updated shelfLife array - sorted from oldest to newest by releaseDate
  shelfLife: [
    { id: 108200, name: "Garry's Mod", addedDate: "2006-11-29T00:00:00Z", releaseDate: "2006-11-29", image: "https://cdn.akamai.steamstatic.com/steam/apps/4000/header.jpg" },
    { id: 418370, name: "Terraria", addedDate: "2011-05-16T00:00:00Z", releaseDate: "2011-05-16", image: "https://cdn.akamai.steamstatic.com/steam/apps/105600/header.jpg" },
    { id: 271590, name: "Grand Theft Auto V", addedDate: "2015-04-14T00:00:00Z", releaseDate: "2015-04-14", image: "https://cdn.akamai.steamstatic.com/steam/apps/271590/header.jpg" },
    { id: 292030, name: "The Witcher 3: Wild Hunt", addedDate: "2015-05-19T00:00:00Z", releaseDate: "2015-05-19", image: "https://cdn.akamai.steamstatic.com/steam/apps/292030/header.jpg" },
    { id: 367520, name: "Hollow Knight", addedDate: "2017-02-24T00:00:00Z", releaseDate: "2017-02-24", image: "https://cdn.akamai.steamstatic.com/steam/apps/367520/header.jpg" }
  ],
  
  genres: [
    { name: "Action", value: 23, color: "#FF6B6B" },
    { name: "Adventure", value: 18, color: "#4ECDC4" },
    { name: "Indie", value: 15, color: "#45B7D1" },
    { name: "RPG", value: 12, color: "#96CEB4" },
    { name: "Strategy", value: 8, color: "#FFEAA7" },
    { name: "Simulation", value: 7, color: "#DDA0DD" },
    { name: "Casual", value: 6, color: "#98D8C8" }
  ]
};
