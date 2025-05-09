import { useState, useEffect, useRef } from 'react';
import { withDemoIndicator, WithDemoProps } from './withDemoIndicator';
import { useAuth } from '@/context/AuthContext';
import { useZenMode } from '@/context/ZenModeContext';
import ZenModeToggle from './ZenModeToggle';
import { Maximize, LayoutGrid, List } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

// Sample data - in a real app, this would come from the Steam API
const sampleGames = [
  // ... keep existing code (sampleGames array)
];

interface LibraryPreviewProps extends WithDemoProps {
  zenModeFullScreen?: boolean;
}

// Helper function to generate positions based on grid with enhanced randomization
const generateZenPositions = (count: number, isFullScreen: boolean) => {
  const positions = [];
  // Use a larger grid size for better distribution
  const gridSize = Math.ceil(Math.sqrt(count * 3)); 
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
  
  // Take the positions we need with enhanced randomization
  for (let i = 0; i < count; i++) {
    if (i < shuffledGrid.length) {
      // Increase randomization factor for more spread out positions
      const randX = shuffledGrid[i].x + (Math.random() * cellWidth * 0.8 - cellWidth * 0.4);
      const randY = shuffledGrid[i].y + (Math.random() * cellHeight * 0.8 - cellHeight * 0.4);
      
      // Add more variation to animations
      const baseDelay = i * 0.8; // Reduced delay between items
      const randomDelay = baseDelay + Math.random() * 1.2; // Add some randomness to delays
      
      // More varied durations
      const baseDuration = 3 + Math.random() * 4;
      
      // Add different movement patterns
      const movementType = Math.floor(Math.random() * 4); // 0-3 different movement types
      
      // Randomize font sizes more
      const fontSize = isFullScreen ? 
        `${0.9 + Math.random() * 0.8}rem` : // More varied font in fullscreen: 0.9-1.7rem
        `${0.7 + Math.random() * 0.5}rem`; // Normal size: 0.7-1.2rem
        
      // Random opacity variation
      const opacity = 0.7 + Math.random() * 0.3;
      
      // Add random z-index for better layering
      const zIndex = Math.floor(Math.random() * 20);
      
      positions.push({
        left: `${randX}%`,
        top: `${randY}%`,
        delay: randomDelay, 
        duration: baseDuration,
        fontSize: fontSize,
        movementType: movementType,
        opacity: opacity,
        zIndex: zIndex
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
  
  // Generate new positions with enhanced randomization when switching to zen mode or when full screen changes
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

  // Helper function to determine animation properties based on movement type
  const getAnimationStyle = (position: any) => {
    const baseStyle = {
      top: position?.top || '50%',
      left: position?.left || '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: position?.zIndex || Math.floor(Math.random() * 10),
      opacity: 0,
    };
    
    // Different animation patterns based on movement type
    let animationName = 'zen-float';
    switch (position?.movementType) {
      case 0:
        animationName = 'zen-float'; // Default side to side
        break;
      case 1:
        animationName = 'zen-bounce'; // Up and down
        break;
      case 2:
        animationName = 'zen-circle'; // Circular motion
        break;
      case 3:
        animationName = 'zen-pulse'; // Pulse/scale
        break;
      default:
        animationName = 'zen-float';
    }
    
    return {
      ...baseStyle,
      animation: `${animationName} ${position?.duration || 4}s ease-in-out infinite alternate, 
                  zen-fade-in 2s ease-out forwards`,
      animationDelay: `${position?.delay || 0}s`,
    };
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
        <div className={`${isFullScreenMode ? 'h-[calc(100vh-100px)]' : 'h-64'} overflow-hidden relative w-full zen-view-container`}>
          {sampleGames.map((game, index) => (
            <div
              key={game.id}
              className="absolute transition-all zen-game-item"
              style={getAnimationStyle(zenPositions[index])}
            >
              <p className="text-unplayed-mint whitespace-nowrap text-glow" 
                 style={{ 
                   fontSize: zenPositions[index]?.fontSize || '1rem',
                   opacity: zenPositions[index]?.opacity || 0.8,
                 }}>
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
            Showing 10 of 137 unplayed games
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
