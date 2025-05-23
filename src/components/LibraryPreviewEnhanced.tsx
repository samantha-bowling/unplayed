
import { useState, useEffect, useMemo } from 'react';
import { withDemoIndicator, WithDemoProps } from './withDemoIndicator';
import { useAuth } from '@/context/AuthContext';
import { useFullScreenMode } from '@/context/FullScreenModeContext';
import useUnplayedData from '@/hooks/use-unplayed-data';
import FullScreenModeToggle from './FullScreenModeToggle';
import { Maximize, LayoutGrid, List, Loader2, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from '@/components/ui/button';

interface LibraryPreviewEnhancedProps extends WithDemoProps {
  zenModeFullScreen?: boolean;
  viewMode?: 'grid' | 'zen';
  onViewModeChange?: (mode: 'grid' | 'zen') => void;
  games?: LibraryGame[];
  isLoading?: boolean;
}

type SortOption = 'name-asc' | 'name-desc' | 'release-asc' | 'release-desc' | 'random';

const LibraryPreviewEnhanced = ({
  isDemo = false,
  zenModeFullScreen = false,
  viewMode: propViewMode,
  onViewModeChange,
  games: propGames,
  isLoading = false
}: LibraryPreviewEnhancedProps) => {
  const { user } = useAuth();
  const { data: unplayedData } = useUnplayedData();
  const {
    isFullScreenMode,
    enterFullScreenMode,
    focusedComponent,
    componentSettings,
    updateComponentSettings
  } = useFullScreenMode();

  const [viewMode, setViewMode] = useState<'grid' | 'zen'>(
    propViewMode || (focusedComponent === 'library' && componentSettings.library?.viewMode) || 'grid'
  );
  const [displayCount, setDisplayCount] = useState<number>(8);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortOption, setSortOption] = useState<SortOption>('name-asc');
  const [zenPositions, setZenPositions] = useState<any[]>([]);
  const [iconCount, setIconCount] = useState(0);

  const showFullScreenMode = zenModeFullScreen && isFullScreenMode;
  const displayGames = propGames || unplayedData.library || [];

  // Sort games based on selected option
  const sortedGames = useMemo(() => {
    if (!displayGames || displayGames.length === 0) return [];
    
    const gamesCopy = [...displayGames];
    
    switch (sortOption) {
      case 'name-asc':
        return gamesCopy.sort((a, b) => {
          const nameA = a.name || '';
          const nameB = b.name || '';
          return nameA.localeCompare(nameB);
        });
      case 'name-desc':
        return gamesCopy.sort((a, b) => {
          const nameA = a.name || '';
          const nameB = b.name || '';
          return nameB.localeCompare(nameA);
        });
      case 'release-asc':
        return gamesCopy.sort((a, b) => {
          const dateA = new Date(a.release_date || '1970-01-01');
          const dateB = new Date(b.release_date || '1970-01-01');
          return dateA.getTime() - dateB.getTime();
        });
      case 'release-desc':
        return gamesCopy.sort((a, b) => {
          const dateA = new Date(a.release_date || '1970-01-01');
          const dateB = new Date(b.release_date || '1970-01-01');
          return dateB.getTime() - dateA.getTime();
        });
      case 'random':
        return gamesCopy.sort(() => Math.random() - 0.5);
      default:
        return gamesCopy;
    }
  }, [displayGames, sortOption]);

  const totalPages = Math.ceil(sortedGames.length / displayCount);
  const startIndex = (currentPage - 1) * displayCount;
  const endIndex = Math.min(startIndex + displayCount, sortedGames.length);
  const currentGames = sortedGames.slice(startIndex, endIndex);

  // Generate zen positions when needed
  useEffect(() => {
    if (viewMode === 'zen' && currentGames.length > 0) {
      const positions = currentGames.map((_, index) => ({
        left: `${10 + Math.random() * 80}%`,
        top: `${10 + Math.random() * 80}%`,
        fontSize: `${0.8 + Math.random() * 0.4}rem`,
        delay: index * 0.1,
        duration: 4 + Math.random() * 2,
        uniqueId: `zen-${index}-${Math.random().toString(36).substring(2, 9)}`
      }));
      setZenPositions(positions);
      setIconCount(Math.min(10, Math.max(3, Math.floor(currentGames.length * 0.15))));
    } else {
      setIconCount(0);
    }
  }, [viewMode, currentGames.length]);

  const handleViewModeChange = (newMode: 'grid' | 'zen') => {
    setViewMode(newMode);
    if (onViewModeChange) {
      onViewModeChange(newMode);
    }
  };

  const handleDisplayCountChange = (value: string) => {
    setDisplayCount(parseInt(value));
    setCurrentPage(1);
  };

  const handleSortChange = (value: SortOption) => {
    setSortOption(value);
    setCurrentPage(1);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleEnterFullScreen = () => {
    enterFullScreenMode('library', { viewMode });
  };

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
      {showFullScreenMode && (
        <div className="absolute top-4 right-4 z-10 opacity-30 hover:opacity-100 transition-opacity duration-300">
          <FullScreenModeToggle />
        </div>
      )}
      
      <div className={`flex justify-between items-center mb-4 ${showFullScreenMode ? 'px-8 pt-8' : ''}`}>
        <h3 className="terminal-header text-2xl">Your Unplayed Library</h3>
        
        <div className="flex items-center gap-2">
          <Select value={displayCount.toString()} onValueChange={handleDisplayCountChange}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="8">8 Games</SelectItem>
              <SelectItem value="12">12 Games</SelectItem>
              <SelectItem value="24">24 Games</SelectItem>
              <SelectItem value="48">48 Games</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortOption} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">A → Z</SelectItem>
              <SelectItem value="name-desc">Z → A</SelectItem>
              <SelectItem value="release-asc">Oldest First</SelectItem>
              <SelectItem value="release-desc">Newest First</SelectItem>
              <SelectItem value="random">Random</SelectItem>
            </SelectContent>
          </Select>
          
          <ToggleGroup type="single" value={viewMode} onValueChange={value => value && handleViewModeChange(value as 'grid' | 'zen')}>
            <ToggleGroupItem value="grid" aria-label="Grid View">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="zen" aria-label="Zen View">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          
          {!showFullScreenMode && (
            <Button 
              onClick={handleEnterFullScreen} 
              variant="outline"
              size="sm"
              className="p-2"
            >
              <Maximize className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      {viewMode === 'grid' ? (
        <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-4 ${showFullScreenMode ? 'p-8 pt-0' : ''}`}>
          {currentGames.map(game => {
            const gameId = game.id;
            const title = game.name;
            const image = getBestGameImage(game.header_image, game.image_url);
            
            return (
              <TooltipProvider key={gameId}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative overflow-hidden rounded-md transition-transform duration-200 hover:scale-105 cursor-pointer">
                      <img 
                        src={image || '/placeholder.svg'} 
                        alt={title} 
                        className="w-full h-auto object-cover" 
                      />
                      
                      <div className="absolute top-1 right-1 bg-unplayed-red/80 rounded-full w-3 h-3" 
                           title="Unplayed Game"></div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <div className="text-center">
                      <p className="font-medium">{title}</p>
                      <p className="text-xs text-gray-400 mt-1">Never played</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      ) : (
        <div className={`${showFullScreenMode ? 'h-[calc(100vh-100px)]' : 'h-64'} overflow-hidden relative w-full`}>
          {iconCount > 0 && (
            <div className="absolute inset-0 pointer-events-none opacity-40">
              <FloatingIcons count={iconCount} />
            </div>
          )}
          
          {currentGames.map((game, index) => {
            const gameId = game.id;
            const title = game.name;
            
            if (!zenPositions[index]) return null;
            
            const position = zenPositions[index];
            
            return (
              <div 
                key={`${gameId}-${position.uniqueId}`}
                className="absolute transition-all zen-game-item"
                style={{
                  top: position.top,
                  left: position.left,
                  transform: 'translate(-50%, -50%)',
                  fontSize: position.fontSize,
                  opacity: 0.8,
                  zIndex: 5,
                }}
              >
                <p className="text-unplayed-mint whitespace-nowrap text-glow">
                  {title}
                </p>
              </div>
            );
          })}
        </div>
      )}
      
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <Button
              onClick={goToPrevPage}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <span className="text-sm text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
        </div>
      )}
      
      {!showFullScreenMode && !propGames && (
        <div className="text-center mt-6 flex flex-col items-center">
          <p className="text-gray-400">
            Showing {currentGames.length} of {unplayedData.totalGames || 0} unplayed games
          </p>
          
          {isDemo ? (
            <div className="mt-4 text-center">
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

export default withDemoIndicator(LibraryPreviewEnhanced);
