
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
    title: string;
    addedDate: string;
    imageUrl: string;
  }>;
  library: Array<{
    id: number;
    title: string;
    image: string;
    playtime: number;
  }>;
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

  // Shelf life data - oldest games
  shelfLife: [
    {
      id: 1,
      title: "Half-Life 2",
      addedDate: "2015-06-12",
      imageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/220/capsule_184x69.jpg"
    },
    {
      id: 2,
      title: "Deus Ex: Human Revolution",
      addedDate: "2016-02-18",
      imageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/238010/capsule_184x69.jpg"
    },
    {
      id: 3,
      title: "Portal 2",
      addedDate: "2016-11-05",
      imageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/620/capsule_184x69.jpg"
    },
    {
      id: 4,
      title: "BioShock Infinite",
      addedDate: "2017-05-24",
      imageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/8870/capsule_184x69.jpg"
    },
    {
      id: 5,
      title: "Mass Effect 2",
      addedDate: "2018-01-10",
      imageUrl: "https://cdn.cloudflare.steamstatic.com/steam/apps/24980/capsule_184x69.jpg"
    }
  ],

  // Library games data
  library: [
    {
      id: 1,
      title: "The Witcher 3: Wild Hunt",
      image: "https://cdn.cloudflare.steamstatic.com/steam/apps/292030/capsule_616x353.jpg",
      playtime: 0
    }, 
    {
      id: 2,
      title: "Hades",
      image: "https://cdn.cloudflare.steamstatic.com/steam/apps/1145360/capsule_616x353.jpg",
      playtime: 0
    }, 
    {
      id: 3,
      title: "Stardew Valley",
      image: "https://cdn.cloudflare.steamstatic.com/steam/apps/413150/capsule_616x353.jpg",
      playtime: 0
    }, 
    {
      id: 4,
      title: "Cyberpunk 2077",
      image: "https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/capsule_616x353.jpg",
      playtime: 0
    }, 
    {
      id: 5,
      title: "Hollow Knight",
      image: "https://cdn.cloudflare.steamstatic.com/steam/apps/367520/capsule_616x353.jpg",
      playtime: 0
    }, 
    {
      id: 6,
      title: "Disco Elysium",
      image: "https://cdn.cloudflare.steamstatic.com/steam/apps/632470/capsule_616x353.jpg",
      playtime: 0
    }, 
    {
      id: 7,
      title: "Divinity: Original Sin 2",
      image: "https://cdn.cloudflare.steamstatic.com/steam/apps/435150/capsule_616x353.jpg",
      playtime: 0
    }, 
    {
      id: 8,
      title: "Red Dead Redemption 2",
      image: "https://cdn.cloudflare.steamstatic.com/steam/apps/1174180/capsule_616x353.jpg",
      playtime: 0
    }
  ]
};
