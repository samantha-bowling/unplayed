
export interface DemoDataType {
  unplayedGames: number;
  totalGames: number;
  dustScore: number;
  totalPlaytime: number; // in hours
  totalSpent: number; // in dollars
  potentialGameplayHours: number; // Added for HLTB integration
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
  // We'll add gamesList in useUnplayedData by transforming the library
}

export const DEMO_DATA: DemoDataType = {
  unplayedGames: 137,
  totalGames: 312,
  dustScore: 237,
  totalPlaytime: 523, // in hours
  totalSpent: 2175.89, // in dollars
  potentialGameplayHours: 137 * 12.5, // Added: average of 12.5 hours per unplayed game

  // Genre data for pie chart
  genres: [
    { name: 'RPG', value: 32, color: '#A3F7BF' },
    { name: 'Action', value: 23, color: '#EF5DFF' },
    { name: 'Strategy', value: 18, color: '#FFD866' },
    { name: 'Simulation', value: 12, color: '#FF3C38' },
    { name: 'Adventure', value: 10, color: '#61DAFB' },
    { name: 'Other', value: 5, color: '#6C757D' }
  ],

  // Shelf life data - oldest games (now properly ordered by release date, oldest first)
  shelfLife: [
    {
      id: 1,
      name: "Half-Life 2",
      addedDate: "2015-06-12",
      releaseDate: "2004-11-16",
      image: "https://cdn.cloudflare.steamstatic.com/steam/apps/220/capsule_184x69.jpg"
    },
    {
      id: 5,
      name: "Mass Effect 2",
      addedDate: "2018-01-10",
      releaseDate: "2010-01-26",
      image: "https://cdn.cloudflare.steamstatic.com/steam/apps/24980/capsule_184x69.jpg"
    },
    {
      id: 3,
      name: "Portal 2",
      addedDate: "2016-11-05",
      releaseDate: "2011-04-19",
      image: "https://cdn.cloudflare.steamstatic.com/steam/apps/620/capsule_184x69.jpg"
    },
    {
      id: 2,
      name: "Deus Ex: Human Revolution",
      addedDate: "2016-02-18",
      releaseDate: "2011-08-23",
      image: "https://cdn.cloudflare.steamstatic.com/steam/apps/238010/capsule_184x69.jpg"
    },
    {
      id: 4,
      name: "BioShock Infinite",
      addedDate: "2017-05-24",
      releaseDate: "2013-03-26",
      image: "https://cdn.cloudflare.steamstatic.com/steam/apps/8870/capsule_184x69.jpg"
    }
  ],

  // Library games data
  library: [
    {
      id: 1,
      name: "The Witcher 3: Wild Hunt",  // Changed from title to name
      image: "https://cdn.cloudflare.steamstatic.com/steam/apps/292030/capsule_616x353.jpg",
      playtime: 0
    }, 
    {
      id: 2,
      name: "Hades",  // Changed from title to name
      image: "https://cdn.cloudflare.steamstatic.com/steam/apps/1145360/capsule_616x353.jpg",
      playtime: 0
    }, 
    {
      id: 3,
      name: "Stardew Valley",  // Changed from title to name
      image: "https://cdn.cloudflare.steamstatic.com/steam/apps/413150/capsule_616x353.jpg",
      playtime: 0
    }, 
    {
      id: 4,
      name: "Cyberpunk 2077",  // Changed from title to name
      image: "https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/capsule_616x353.jpg",
      playtime: 0
    }, 
    {
      id: 5,
      name: "Hollow Knight",  // Changed from title to name
      image: "https://cdn.cloudflare.steamstatic.com/steam/apps/367520/capsule_616x353.jpg",
      playtime: 0
    }, 
    {
      id: 6,
      name: "Disco Elysium",  // Changed from title to name
      image: "https://cdn.cloudflare.steamstatic.com/steam/apps/632470/capsule_616x353.jpg",
      playtime: 0
    }, 
    {
      id: 7,
      name: "Divinity: Original Sin 2",  // Changed from title to name
      image: "https://cdn.cloudflare.steamstatic.com/steam/apps/435150/capsule_616x353.jpg",
      playtime: 0
    }, 
    {
      id: 8,
      name: "Red Dead Redemption 2",  // Changed from title to name
      image: "https://cdn.cloudflare.steamstatic.com/steam/apps/1174180/capsule_616x353.jpg",
      playtime: 0
    }
  ]
};
