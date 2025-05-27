import { useState, useEffect, useRef } from 'react';
import { withDemoIndicator, WithDemoProps } from './withDemoIndicator';
import { useAuth } from '@/context/AuthContext';
import { useFullScreenMode } from '@/context/FullScreenModeContext';
import useUnplayedData from '@/hooks/use-unplayed-data';
import FullScreenModeToggle from './FullScreenModeToggle';
import { Maximize, LayoutGrid, List, Loader2, ChevronRight } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { LibraryGame } from '@/hooks/use-library-data';
import FloatingIcons from '@/components/FloatingIcons';
import { getBestGameImage } from '@/utils/image-utils';
import { Link } from 'react-router-dom';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface LibraryPreviewProps extends WithDemoProps {
  zenModeFullScreen?: boolean;
  viewMode?: 'grid' | 'zen';
  onViewModeChange?: (mode: 'grid' | 'zen') => void;
  games?: LibraryGame[];
  isLoading?: boolean;
}

// Helper function to generate positions based on grid with stable animations
const generateZenPositions = (count: number, isFullScreen: boolean) => {
  const positions = [];
  const gridSize = Math.ceil(Math.sqrt(count * 1.5)); // Create a grid with enough cells
  const cellWidth = 100 / gridSize;
  const cellHeight = 100 / gridSize;

  // Create a grid of possible positions
  const grid = [];
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      grid.push({
        x: j * cellWidth + cellWidth * 0.5,
        y: i * cellHeight + cellHeight * 0.5
      });
    }
  }

  // Shuffle the grid to get random positions
  const shuffledGrid = [...grid].sort(() => Math.random() - 0.5);

  // Take the positions we need
  for (let i = 0; i < count; i++) {
    if (i < shuffledGrid.length) {
      // Use more predictable positions with smaller random variations
      const randX = shuffledGrid[i].x + (Math.random() * cellWidth * 0.3 - cellWidth * 0.15);
      const randY = shuffledGrid[i].y + (Math.random() * cellHeight * 0.3 - cellHeight * 0.15);
      
      // Create more stable animation patterns
      const animationDirectionX = Math.random() > 0.5 ? 1 : -1;
      const animationDirectionY = Math.random() > 0.5 ? 1 : -1;
      const animationDistance = 1 + Math.random() * 1.5; // Reduced movement range (1-2.5%)
      
      positions.push({
        left: `${randX}%`,
        top: `${randY}%`,
        delay: i * 0.5, // Reduced delay for smoother appearance
        // Stagger the animations with more predictable durations
        duration: 4 + Math.random() * 2, // 4-6s duration for smoother motion
        // Font size adjustments based on screen mode
        fontSize: isFullScreen ? `${0.9 + Math.random() * 0.4}rem` : // Fullscreen: 0.9-1.3rem
          `${0.7 + Math.random() * 0.3}rem`, // Normal size: 0.7-1rem
        animDirectionX: animationDirectionX,
        animDirectionY: animationDirectionY,
        animDistance: animationDistance,
        initialRotation: Math.random() * 4 - 2, // Reduced rotation between -2 and 2 degrees
        hoverColor: Math.random() > 0.5 ? 'hover:text-unplayed-pink' : 'hover:text-unplayed-amber',
        uniqueId: `zen-${i}-${Math.random().toString(36).substring(2, 9)}` // Add unique ID for stability
      });
    }
  }
  return positions;
};

const LibraryPreview = ({
  isDemo = false,
  zenModeFullScreen = false,
  viewMode: propViewMode,
  onViewModeChange,
  games: propGames,
  isLoading = false
}: LibraryPreviewProps) => {
  const { 
    user 
  } = useAuth();
  const {
    data: unplayedData
  } = useUnplayedData();
  const {
    isFullScreenMode,
    enterFullScreenMode,
    focusedComponent,
    componentSettings,
    updateComponentSettings
  } = useFullScreenMode();

  // Initialize viewMode from props if available, otherwise from FullScreenMode context, or default to 'grid'
  const [viewMode, setViewMode] = useState<'grid' | 'zen'>(
    propViewMode || (focusedComponent === 'library' && componentSettings.library?.viewMode) || 'grid'
  );
  const [hoveredGame, setHoveredGame] = useState<number | null>(null);
  const [zenPositions, setZenPositions] = useState<any[]>([]);
  const [iconCount, setIconCount] = useState(0);
  const [displayCount, setDisplayCount] = useState<number>(8);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Ref to track if positions have been generated
  const positionsGeneratedRef = useRef(false);
  // Ref to track animation frame for cleanup
  const animationFrameRef = useRef<number | null>(null);

  // Determine if we should show in full screen mode
  const showFullScreenMode = zenModeFullScreen && isFullScreenMode;

  // Use games from props if available, otherwise use unplayedData
  const displayGames = propGames || unplayedData.library;
  
  // Calculate the total number of pages
  const totalPages = Math.ceil(displayGames.length / displayCount);
  
  // Get current games based on pagination
  const startIndex = (currentPage - 1) * displayCount;
  const endIndex = Math.min(startIndex + displayCount, displayGames.length);
  const currentGames = displayGames.slice(startIndex, endIndex);

  // Update the context whenever viewMode changes
  useEffect(() => {
    if (focusedComponent === 'library') {
      updateComponentSettings('library', {
        viewMode
      });
    }
    
    // Also update the parent component if onViewModeChange is provided
    if (onViewModeChange) {
      onViewModeChange(viewMode);
    }
  }, [viewMode, focusedComponent, updateComponentSettings, onViewModeChange]);

  // Generate new positions when:
  // 1. Switching to zen mode
  // 2. Full screen state changes
  // 3. Display count changes
  // 4. Current games length changes (pagination)
  useEffect(() => {
    if (viewMode === 'zen') {
      const newPositions = generateZenPositions(currentGames.length, isFullScreenMode);
      setZenPositions(newPositions);
      positionsGeneratedRef.current = true;
      
      // Set icon count - about 20% of game count in zen mode, with reasonable limits
      const gameCount = currentGames.length;
      const newIconCount = Math.min(15, Math.max(5, Math.floor(gameCount * 0.2)));
      setIconCount(newIconCount);
    } else {
      setIconCount(0); // No icons in grid mode
    }
    
    // Clean up any animation frames on component unmount or when dependencies change
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [viewMode, isFullScreenMode, currentGames.length, displayCount]);

  // When entering full screen, make sure the context has the current view mode
  const handleEnterFullScreen = () => {
    enterFullScreenMode('library', {
      viewMode
    });

    // Regenerate positions for zen mode when entering fullscreen
    if (viewMode === 'zen') {
      const newPositions = generateZenPositions(currentGames.length, true);
      setZenPositions(newPositions);
    }
  };

  // Handle view mode change
  const handleViewModeChange = (newMode: 'grid' | 'zen') => {
    setViewMode(newMode);
    if (focusedComponent === 'library') {
      updateComponentSettings('library', {
        viewMode: newMode
      });
    }

    // Regenerate positions when switching to zen mode
    if (newMode === 'zen') {
      const newPositions = generateZenPositions(currentGames.length, isFullScreenMode);
      setZenPositions(newPositions);
      
      // Set icon count for FloatingIcons when switching to zen mode
      const gameCount = currentGames.length;
      const newIconCount = Math.min(15, Math.max(5, Math.floor(gameCount * 0.2)));
      setIconCount(newIconCount);
    } else {
      setIconCount(0); // No icons in grid mode
    }
    
    // Update the parent component if onViewModeChange is provided
    if (onViewModeChange) {
      onViewModeChange(newMode);
    }
  };

  // Handle display count change
  const handleDisplayCountChange = (value: string) => {
    const newDisplayCount = parseInt(value);
    setDisplayCount(newDisplayCount);
    setCurrentPage(1); // Reset to first page when changing display count
  };

  // Handle page change
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-unplayed-mint mb-4" />
        <p className="text-gray-400">Loading your game collection...</p>
      </div>
    );
  }

  return (
    <div className={`${showFullScreenMode ? 'library-fullscreen' : 'terminal-container w-full'} ${isDemo ? 'relative' : ''}`}>
      {/* Show the full screen mode toggle in the corner when in full screen mode */}
      {showFullScreenMode && (
        <div className="absolute top-4 right-4 z-10 opacity-30 hover:opacity-100 transition-opacity duration-300">
          <FullScreenModeToggle />
        </div>
      )}
      
      {/* View mode controls - show in both regular and full screen mode */}
      <div className={`flex justify-between items-center mb-4 ${showFullScreenMode ? 'px-8 pt-8' : ''}`}>
        <h3 className="terminal-header text-2xl">Your Unplayed Library</h3>
        
        <div className="flex space-x-2">
          <Select value={displayCount.toString()} onValueChange={handleDisplayCountChange}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Show" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="8">8 Games</SelectItem>
              <SelectItem value="12">12 Games</SelectItem>
              <SelectItem value="24">24 Games</SelectItem>
              <SelectItem value="48">48 Games</SelectItem>
            </SelectContent>
          </Select>
          
          <ToggleGroup type="single" value={viewMode} onValueChange={value => value && handleViewModeChange(value as 'grid' | 'zen')}>
            <ToggleGroupItem value="grid" aria-label="Grid View" className="px-3 py-1">
              <LayoutGrid className="h-4 w-4 mr-1" />
              Grid
            </ToggleGroupItem>
            <ToggleGroupItem value="zen" aria-label="Zen View" className="px-3 py-1">
              <List className="h-4 w-4 mr-1" />
              Zen
            </ToggleGroupItem>
          </ToggleGroup>
          
          {!showFullScreenMode && (
            <button 
              onClick={handleEnterFullScreen} 
              className="px-3 py-1 bg-black/30 border border-unplayed-mint/30 rounded-md hover:bg-black/50 transition-colors duration-200 flex items-center"
              title="Enter full-screen mode"
            >
              <Maximize className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      
      {/* Grid view mode */}
      {viewMode === 'grid' ? (
        <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-4 ${showFullScreenMode ? 'p-8 pt-0' : ''}`}>
          {currentGames.map(game => {
            // Handle both LibraryGame and GameListItem types
            const gameId = 'id' in game ? game.id : game.gameId;
            const title = 'name' in game ? game.name : game.title;
            
            // Enhanced image handling using our new utility
            const imageUrl = 'image_url' in game ? game.image_url : null;
            const headerImage = 'header_image' in game ? game.header_image : null;
            const image = 'image' in game ? game.image : getBestGameImage(headerImage, imageUrl);
            
            return (
              <div 
                key={gameId}
                className={`relative overflow-hidden rounded-md transition-transform duration-300 hover:scale-105 ${showFullScreenMode ? 'library-game-fullscreen' : ''}`}
                onMouseEnter={() => setHoveredGame(gameId)}
                onMouseLeave={() => setHoveredGame(null)}
              >
                <img 
                  src={image || '/placeholder.svg'} 
                  alt={title} 
                  className="w-full h-auto object-cover" 
                />
                
                <div className={`absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-2 flex flex-col justify-end transition-opacity duration-300 ${hoveredGame === gameId || showFullScreenMode ? 'opacity-100' : 'opacity-0'}`}>
                  <p className="text-white text-xs font-medium truncate">{title}</p>
                  <p className="text-unplayed-mint text-xs">Never played</p>
                </div>
                
                <div 
                  className="absolute top-1 right-1 bg-unplayed-red/80 rounded-full w-3 h-3" 
                  title="Unplayed"
                ></div>
              </div>
            );
          })}
        </div>
      ) : (
        // Enhanced Zen view mode with more stable animations
        <div className={`${showFullScreenMode ? 'h-[calc(100vh-100px)]' : 'h-64'} overflow-hidden relative w-full`}>
          {/* Add floating icons in zen mode */}
          {viewMode === 'zen' && iconCount > 0 && (
            <div className="absolute inset-0 pointer-events-none opacity-40">
              <FloatingIcons count={iconCount} />
            </div>
          )}
          
          {currentGames.map((game, index) => {
            // Handle both LibraryGame and GameListItem types
            const gameId = 'id' in game ? game.id : game.gameId;
            const title = 'name' in game ? game.name : game.title;
            
            // Only render if we have position data for this index
            if (!zenPositions[index]) return null;
            
            const position = zenPositions[index];
            
            return (
              <div 
                key={`${gameId}-${position.uniqueId}`}
                className="absolute transition-all zen-game-item"
                style={{
                  top: position.top || '50%',
                  left: position.left || '50%',
                  transform: `translate(-50%, -50%) rotate(${position.initialRotation || 0}deg)`,
                  opacity: 0.8,
                  animation: `
                    zen-float-stable ${position.duration || 4}s ease-in-out infinite alternate, 
                    zen-fade-in 1.5s ease-out forwards
                  `,
                  // Define custom animation properties in style
                  '--anim-x': `${position.animDirectionX * position.animDistance || 1}%`,
                  '--anim-y': `${position.animDirectionY * position.animDistance || 1}%`,
                  fontSize: position.fontSize || '1rem',
                  zIndex: 5,
                  transition: 'transform 0.3s ease, text-shadow 0.3s ease, color 0.3s ease',
                } as React.CSSProperties}
              >
                <p 
                  className={`text-unplayed-mint whitespace-nowrap text-glow transition-colors duration-300 ${position.hoverColor || ''}`}
                >
                  {title}
                </p>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Pagination controls - display if we have more than one page */}
      {totalPages > 1 && (
        <div className="mt-6 mb-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))} 
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Logic to show correct page numbers
                let pageNum = i + 1;
                
                // If more than 5 pages, adjust the displayed page numbers
                if (totalPages > 5) {
                  if (currentPage <= 3) {
                    // Near the start
                    pageNum = i + 1;
                    if (i === 4) pageNum = totalPages;
                  } else if (currentPage >= totalPages - 2) {
                    // Near the end
                    pageNum = totalPages - 4 + i;
                    if (i === 0) pageNum = 1;
                  } else {
                    // In the middle
                    pageNum = currentPage - 2 + i;
                    if (i === 0) pageNum = 1;
                    if (i === 4) pageNum = totalPages;
                  }
                }
                
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink 
                      isActive={currentPage === pageNum} 
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
      
      {/* Only show these controls when not in full screen mode and when not using as a view mode in library page */}
      {!showFullScreenMode && !propGames && (
        <div className="text-center mt-6 flex flex-col items-center">
          <p className="text-gray-400">
            Showing {currentGames.length} of {unplayedData.totalGames} unplayed games
          </p>
          
          {isDemo ? (
            <div className="mt-auto pt-4 text-center flex justify-center">
              <p className="text-sm text-unplayed-mint">
                You're in Demo Mode. Sign in to track your Unplayed Library.
              </p>
            </div>
          ) : (
            <Link to="/library" className="btn-secondary mt-4 inline-flex items-center gap-2">
              View Full Library
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default withDemoIndicator(LibraryPreview);
