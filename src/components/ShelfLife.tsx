
import { useState } from 'react';

// Sample data - in a real app, this would come from the Steam API
const oldestGames = [
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
];

const calculateAge = (dateString: string) => {
  const addedDate = new Date(dateString);
  const today = new Date();
  
  const yearDiff = today.getFullYear() - addedDate.getFullYear();
  const monthDiff = today.getMonth() - addedDate.getMonth();
  
  let age = yearDiff;
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < addedDate.getDate())) {
    age--;
  }
  
  return `${age} years`;
};

const ShelfLife = () => {
  const [hoveredGame, setHoveredGame] = useState<number | null>(null);

  return (
    <div className="terminal-container w-full">
      <h3 className="terminal-header text-2xl mb-2">Shelf Life</h3>
      <p className="text-sm text-gray-400 mb-6">Your oldest unplayed games, aging like forgotten vintages</p>
      
      <div className="space-y-4">
        {oldestGames.map((game, index) => (
          <div 
            key={game.id}
            className={`flex items-center p-3 rounded-lg transition-all duration-300 ${
              hoveredGame === game.id 
                ? 'bg-unplayed-mint/10 border border-unplayed-mint/30' 
                : 'bg-black/30 border border-transparent'
            }`}
            onMouseEnter={() => setHoveredGame(game.id)}
            onMouseLeave={() => setHoveredGame(null)}
          >
            <div className="flex-shrink-0 w-16 h-12 overflow-hidden rounded">
              <img 
                src={game.imageUrl} 
                alt={game.title} 
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="ml-4 flex-grow">
              <h4 className="text-white font-medium">{game.title}</h4>
              <p className="text-xs text-gray-400">
                Added on {new Date(game.addedDate).toLocaleDateString()}
              </p>
            </div>
            
            <div className="text-right">
              <span className={`text-lg font-vt ${
                index === 0 ? 'text-unplayed-red' : 
                index === 1 ? 'text-unplayed-amber' : 
                'text-unplayed-mint'
              }`}>
                {calculateAge(game.addedDate)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShelfLife;
