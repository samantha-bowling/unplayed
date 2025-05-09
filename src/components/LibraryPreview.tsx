
import { useState } from 'react';

// Sample data - in a real app, this would come from the Steam API
const sampleGames = [
  { id: 1, title: "The Witcher 3: Wild Hunt", image: "https://cdn.cloudflare.steamstatic.com/steam/apps/292030/capsule_184x69.jpg", playtime: 0 },
  { id: 2, title: "Hades", image: "https://cdn.cloudflare.steamstatic.com/steam/apps/1145360/capsule_184x69.jpg", playtime: 0 },
  { id: 3, title: "Stardew Valley", image: "https://cdn.cloudflare.steamstatic.com/steam/apps/413150/capsule_184x69.jpg", playtime: 0 },
  { id: 4, title: "Cyberpunk 2077", image: "https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/capsule_184x69.jpg", playtime: 0 },
  { id: 5, title: "Hollow Knight", image: "https://cdn.cloudflare.steamstatic.com/steam/apps/367520/capsule_184x69.jpg", playtime: 0 },
  { id: 6, title: "Disco Elysium", image: "https://cdn.cloudflare.steamstatic.com/steam/apps/632470/capsule_184x69.jpg", playtime: 0 },
  { id: 7, title: "Divinity: Original Sin 2", image: "https://cdn.cloudflare.steamstatic.com/steam/apps/435150/capsule_184x69.jpg", playtime: 0 },
  { id: 8, title: "Red Dead Redemption 2", image: "https://cdn.cloudflare.steamstatic.com/steam/apps/1174180/capsule_184x69.jpg", playtime: 0 },
  { id: 9, title: "Civilization VI", image: "https://cdn.cloudflare.steamstatic.com/steam/apps/289070/capsule_184x69.jpg", playtime: 0 },
  { id: 10, title: "Terraria", image: "https://cdn.cloudflare.steamstatic.com/steam/apps/105600/capsule_184x69.jpg", playtime: 0 }
];

const LibraryPreview = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'zen'>('grid');
  const [hoveredGame, setHoveredGame] = useState<number | null>(null);
  
  return (
    <div className="terminal-container w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="terminal-header text-2xl">Your Unplayed Library</h3>
        
        <div className="flex space-x-2">
          <button 
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1 text-sm rounded-md ${
              viewMode === 'grid' 
                ? 'bg-unplayed-mint text-black' 
                : 'bg-gray-800 text-gray-300'
            }`}
          >
            Grid
          </button>
          <button 
            onClick={() => setViewMode('zen')}
            className={`px-3 py-1 text-sm rounded-md ${
              viewMode === 'zen' 
                ? 'bg-unplayed-mint text-black' 
                : 'bg-gray-800 text-gray-300'
            }`}
          >
            Zen
          </button>
        </div>
      </div>
      
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-4">
          {sampleGames.map((game) => (
            <div 
              key={game.id}
              className="relative overflow-hidden rounded-md transition-transform duration-300 hover:scale-105"
              onMouseEnter={() => setHoveredGame(game.id)}
              onMouseLeave={() => setHoveredGame(null)}
            >
              <img 
                src={game.image} 
                alt={game.title} 
                className="w-full h-auto object-cover"
              />
              
              <div className={`absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-2 flex flex-col justify-end transition-opacity duration-300 ${
                hoveredGame === game.id ? 'opacity-100' : 'opacity-0'
              }`}>
                <p className="text-white text-xs font-medium truncate">{game.title}</p>
                <p className="text-unplayed-mint text-xs">Never played</p>
              </div>
              
              <div className="absolute top-1 right-1 bg-unplayed-red/80 rounded-full w-3 h-3" title="Unplayed"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="h-64 overflow-hidden relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-2xl text-gray-500 italic">Zen Mode</p>
          </div>
          
          {sampleGames.map((game, index) => (
            <div 
              key={game.id}
              className="absolute opacity-0 transition-all duration-[4s] animate-fade-in"
              style={{
                top: `${Math.random() * 80}%`,
                left: `${Math.random() * 80}%`,
                animationDelay: `${index * 2}s`,
                animationDuration: '8s',
                animationIterationCount: 'infinite',
                animationDirection: 'alternate'
              }}
            >
              <p className="text-unplayed-mint text-sm opacity-70">{game.title}</p>
            </div>
          ))}
        </div>
      )}
      
      <div className="text-center mt-6">
        <p className="text-gray-400">
          Showing 10 of 137 unplayed games
        </p>
        <button className="btn-secondary mt-3">
          View Full Library
        </button>
      </div>
    </div>
  );
};

export default LibraryPreview;
