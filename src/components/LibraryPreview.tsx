import { useState, useEffect, useRef } from 'react';
import { withDemoIndicator, WithDemoProps } from './withDemoIndicator';
import { useAuth } from '@/context/AuthContext';
import { useZenMode } from '@/context/ZenModeContext';
import { useDemoMode } from '@/context/DemoModeContext';
import ZenModeToggle from './ZenModeToggle';
import { Maximize, LayoutGrid, List } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

// Sample data - in a real app, this would come from the Steam API
const sampleGames = [{
  id: 1,
  title: "The Witcher 3: Wild Hunt",
  image: "https://cdn.cloudflare.steamstatic.com/steam/apps/292030/capsule_184x69.jpg",
  playtime: 0
}, {
  id: 2,
  title: "Hades",
  image: "https://cdn.cloudflare.steamstatic.com/steam/apps/1145360/capsule_184x69.jpg",
  playtime: 0
}, {
  id: 3,
  title: "Stardew Valley",
  image: "https://cdn.cloudflare.steamstatic.com/steam/apps/413150/capsule_184x69.jpg",
  playtime: 0
}, {
  id: 4,
  title: "Cyberpunk 2077",
  image: "https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/capsule_184x69.jpg",
  playtime: 0
}, {
  id: 5,
  title: "Hollow Knight",
  image: "https://cdn.cloudflare.steamstatic.com/steam/apps/367520/capsule_184x69.jpg",
  playtime: 0
}, {
  id: 6,
  title: "Disco Elysium",
  image: "https://cdn.cloudflare.steamstatic.com/steam/apps/632470/capsule_184x69.jpg",
  playtime: 0
}, {
  id: 7,
  title: "Divinity: Original Sin 2",
  image: "https://cdn.cloudflare.steamstatic.com/steam/apps/435150/capsule_184x69.jpg",
  playtime: 0
}, {
  id: 8,
  title: "Red Dead Redemption 2",
  image: "https://cdn.cloudflare.steamstatic.com/steam/apps/1174180/capsule_184x69.jpg",
  playtime: 0
}, {
  id: 9,
  title: "Civilization VI",
  image: "https://cdn.cloudflare.steamstatic.com/steam/apps/289070/capsule_184x69.jpg",
  playtime: 0
}, {
  id: 10,
  title: "Terraria",
  image: "https://cdn.cloudflare.steamstatic.com/steam/apps/105600/capsule_184x69.jpg",
  playtime: 0
}];

interface LibraryPreviewProps extends WithDemoProps {
  zenModeFullScreen?: boolean;
}

// Helper function to generate positions based on grid
const generateZenPositions = (count: number, isFullScreen: boolean) => {
  const positions = [];
  const gridSize = Math.ceil(Math.sqrt(count * 2)); // Create a grid with enough cells
  const cellWidth = 100 / gridSize;
  const cellHeight = 100 / gridSize;

  // Create a grid of possible positions
  const grid = [];
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      grid.push({
        x: j * cellWidth + (cellWidth * 0.5),
        y: i * cellHeight + (cellHeight * 0.5),
      });
    }
  }
  
  // Shuffle the grid to get random positions
  const shuffledGrid = [...grid].sort(() => Math.random() - 0.5);
  
  // Take the positions we need
  for (let i = 0; i < count; i++) {
    if (i < shuffledGrid.length) {
      const randX = shuffledGrid[i].x + (Math.random() * cellWidth * 0.5 - cellWidth * 0.25);
      const randY = shuffledGrid[i].y + (Math.random() * cellHeight * 0.5 - cellHeight * 0.25);
      
      positions.push({
        left: `${randX}%`,
        top: `${randY}%`,
        delay: i * 1.5, // Stagger the animations
        duration: 3 + Math.random() * 2, // Random duration between 3-5s
        fontSize: isFullScreen ? 
          `${1 + Math.random() * 0.5}rem` : // Larger font in fullscreen: 1-1.5rem
          `${0.75 + Math.random() * 0.25}rem` // Normal size: 0.75-1rem
      });
    }
  }
  
  return positions;
};

const LibraryPreview = ({
  isDemo = false,
  zenModeFullScreen = false
}: LibraryPreviewProps) => {
  const { signInWithSteam } = useAuth();
  const { demoData } = useDemoMode();
  const {
    isZenMode,
    enterZenMode,
    focusedComponent,
    componentSettings,
    updateComponentSettings
  } = useZenMode();

  // Initialize viewMode from ZenMode context if available, otherwise default to 'grid'
  const [viewMode, setViewMode] = useState<'grid' | 'zen'>(
    (focusedComponent === 'library' && componentSettings.library?.viewMode) || 'grid'
  );
  
  const [hoveredGame, setHoveredGame] = useState<number | null>(null);
  const [zenPositions, setZenPositions] = useState<any[]>([]);
  
  // Ref to track if positions have been generated
  const positionsGeneratedRef = useRef(false);

  // Determine if we should show in full screen zen mode
  const isFullScreenMode = zenModeFullScreen && isZenMode;
  
  // Update the context whenever viewMode changes
  useEffect(() => {
    if (focusedComponent === 'library') {
      updateComponentSettings('library', { viewMode });
    }
  }, [viewMode, focusedComponent, updateComponentSettings]);
  
  // Generate new positions when switching to zen mode or when full screen changes
  useEffect(() => {
    if (viewMode === 'zen' || positionsGeneratedRef.current === false) {
      const newPositions = generateZenPositions(sampleGames.length, isFullScreenMode);
      setZenPositions(newPositions);
      positionsGeneratedRef.current = true;
    }
  }, [viewMode, isFullScreenMode]);
  
  // When entering full screen, make sure the context has the current view mode
  const handleEnterFullScreen = () => {
    enterZenMode('library', { viewMode });
    
    // Regenerate positions for zen mode when entering fullscreen
    if (viewMode === 'zen') {
      const newPositions = generateZenPositions(sampleGames.length, true);
      setZenPositions(newPositions);
    }
  };
  
  // Handle view mode change
  const handleViewModeChange = (newMode: 'grid' | 'zen') => {
    setViewMode(newMode);
    if (focusedComponent === 'library') {
      updateComponentSettings('library', { viewMode: newMode });
    }
    
    // Regenerate positions when switching to zen mode
    if (newMode === 'zen') {
      const newPositions = generateZenPositions(sampleGames.length, isFullScreenMode);
      setZenPositions(newPositions);
    }
  };

  return (
    <div className={`${isFullScreenMode ? 'library-fullscreen' : 'terminal-container w-full'} ${isDemo ? 'relative' : ''}`}>
      {/* Show the zen mode toggle in the corner when in full screen mode */}
      {isFullScreenMode && (
        <div className="absolute top-4 right-4 z-10 opacity-30 hover:opacity-100 transition-opacity duration-300">
          <ZenModeToggle />
        </div>
      )}
      
      {/* View mode controls - show in both regular and full screen mode */}
      <div className={`flex justify-between items-center mb-4 ${isFullScreenMode ? 'px-8 pt-8' : ''}`}>
        <h3 className="terminal-header text-2xl">Your Unplayed Library</h3>
        
        <div className="flex space-x-2">
          <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && handleViewModeChange(value as 'grid' | 'zen')}>
            <ToggleGroupItem value="grid" aria-label="Grid View" className="px-3 py-1">
              <LayoutGrid className="h-4 w-4 mr-1" />
              Grid
            </ToggleGroupItem>
            <ToggleGroupItem value="zen" aria-label="Zen View" className="px-3 py-1">
              <List className="h-4 w-4 mr-1" />
              Zen
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
      
      {/* Grid view mode */}
      {viewMode === 'grid' ? (
        <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-4 ${isFullScreenMode ? 'p-8 pt-0' : ''}`}>
          {sampleGames.map(game => (
            <div
              key={game.id}
              className={`relative overflow-hidden rounded-md transition-transform duration-300 hover:scale-105 ${isFullScreenMode ? 'library-game-fullscreen' : ''}`}
              onMouseEnter={() => setHoveredGame(game.id)}
              onMouseLeave={() => setHoveredGame(null)}
            >
              <img src={game.image} alt={game.title} className="w-full h-auto object-cover" />
              
              <div className={`absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-2 flex flex-col justify-end transition-opacity duration-300 ${hoveredGame === game.id || isFullScreenMode ? 'opacity-100' : 'opacity-0'}`}>
                <p className="text-white text-xs font-medium truncate">{game.title}</p>
                <p className="text-unplayed-mint text-xs">Never played</p>
              </div>
              
              <div className="absolute top-1 right-1 bg-unplayed-red/80 rounded-full w-3 h-3" title="Unplayed"></div>
            </div>
          ))}
        </div>
      ) : (
        // Enhanced Zen view mode
        <div className={`${isFullScreenMode ? 'h-[calc(100vh-100px)]' : 'h-64'} overflow-hidden relative w-full`}>
          {sampleGames.map((game, index) => (
            <div
              key={game.id}
              className="absolute transition-all zen-game-item"
              style={{
                top: zenPositions[index]?.top || '50%',
                left: zenPositions[index]?.left || '50%',
                transform: 'translate(-50%, -50%)',
                animationDelay: `${zenPositions[index]?.delay || index}s`,
                zIndex: Math.floor(Math.random() * 10),
                opacity: 0,
                animation: `zen-float ${zenPositions[index]?.duration || 4}s ease-in-out infinite alternate, 
                            zen-fade-in 2s ease-out forwards`,
              }}
            >
              <p className="text-unplayed-mint whitespace-nowrap text-glow" 
                 style={{ fontSize: zenPositions[index]?.fontSize || '1rem' }}>
                {game.title}
              </p>
            </div>
          ))}
        </div>
      )}
      
      {/* Only show these controls when not in full screen zen mode */}
      {!isFullScreenMode && (
        <div className="text-center mt-6">
          <p className="text-gray-400">
            Showing 10 of {isDemo ? demoData.totalGames : 137} unplayed games
          </p>
          <div className="flex justify-center gap-2 mt-3">
            {isDemo ? (
              <button onClick={() => signInWithSteam()} className="btn-secondary">
                Connect Steam to View Your Library
              </button>
            ) : (
              <button className="btn-secondary">
                View Full Library
              </button>
            )}
            <button 
              onClick={handleEnterFullScreen} 
              className="btn-primary flex items-center" 
              title="Enter full-screen mode"
            >
              <Maximize className="h-4 w-4 mr-1" />
              Full Screen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default withDemoIndicator(LibraryPreview);
