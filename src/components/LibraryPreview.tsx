
import React, { useState, useMemo } from 'react';
import { Play, Grid, List, Maximize, Eye, EyeOff, Search, SortAsc, SortDesc, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/context/AuthContext';
import { useDemoMode } from '@/context/DemoModeContext';
import { useFullScreenMode } from '@/context/FullScreenModeContext';
import { useLibraryData } from '@/hooks/use-library-data';
import { getBestGameImageFromDbData } from '@/utils/image-utils';
import SteamLoader from './SteamLoader';
import GameCard from './GameCard';
import ZenLayout from '@/layouts/ZenLayout';

interface LibraryPreviewProps {
  zenModeFullScreen?: boolean;
}

const LibraryPreview: React.FC<LibraryPreviewProps> = ({ zenModeFullScreen = false }) => {
  const { user } = useAuth();
  const { isDemo, demoData } = useDemoMode();
  const { isFullScreenMode, toggleFullScreenMode } = useFullScreenMode();
  const [viewMode, setViewMode] = useState<'grid' | 'zen'>('grid');
  const [limit, setLimit] = useState<number>(12);

  // Use the library data hook without any parameters
  const libraryDataResult = useLibraryData();

  const {
    games: libraryGames,
    isLoading,
    error,
    filters,
    updateSearchFilter,
    toggleHideIgnored,
    toggleOnlyUnplayed,
    sortBy,
    sortDirection,
    updateSort,
    resetFilters
  } = libraryDataResult;

  // Memoize filtered and processed games for performance
  const processedGames = useMemo(() => {
    if (!libraryGames) return [];
    
    const limitedGames = viewMode === 'zen' ? libraryGames : libraryGames.slice(0, limit);
    
    return limitedGames.map(game => ({
      ...game,
      imageUrl: getBestGameImageFromDbData(game, game.id)
    }));
  }, [libraryGames, limit, viewMode]);

  const handleMarkAsPlayed = async (userGameId: string) => {
    // Implementation for marking as played
    console.log('Mark as played:', userGameId);
  };

  const handleToggleHidden = async (userGameId: string, currentHidden: boolean) => {
    // Implementation for toggling hidden
    console.log('Toggle hidden:', userGameId, !currentHidden);
  };

  const handleSaveNote = async (userGameId: string, note: string) => {
    // Implementation for saving note
    console.log('Save note:', userGameId, note);
  };

  const handleSortChange = (newSortBy: string) => {
    if (sortBy === newSortBy) {
      updateSort(sortBy, sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      updateSort(newSortBy as any, 'desc');
    }
  };

  if (zenModeFullScreen || viewMode === 'zen') {
    return (
      <ZenLayout>
        <div className="w-full max-w-7xl mx-auto p-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Zen Mode - Library</h2>
            <div className="flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleFullScreenMode}
                    >
                      <Maximize className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Toggle Full Screen Mode</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                Exit Zen
              </Button>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <SteamLoader message="Loading your library..." size="md" variant="secondary" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {processedGames.map(game => (
                <GameCard
                  key={game.userGame.id}
                  id={game.userGame.id}
                  gameId={game.id}
                  title={game.name}
                  imageUrl={game.imageUrl}
                  headerImage={game.header_image}
                  dustScore={game.userGame.dust_score}
                  playtimeMinutes={game.userGame.playtime_minutes}
                  isHidden={game.userGame.hidden}
                  notes={game.userGame.notes}
                  onMarkAsPlayed={() => handleMarkAsPlayed(game.userGame.id)}
                  onToggleHidden={() => handleToggleHidden(game.userGame.id, game.userGame.hidden || false)}
                  onSaveNote={(note) => handleSaveNote(game.userGame.id, note)}
                />
              ))}
            </div>
          )}
        </div>
      </ZenLayout>
    );
  }

  return (
    <div className="terminal-container">
      <div className="flex items-center justify-between mb-4">
        <h3 className="terminal-header text-2xl">Library Preview</h3>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Select value={limit.toString()} onValueChange={(value) => setLimit(parseInt(value))}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6</SelectItem>
                    <SelectItem value="12">12</SelectItem>
                    <SelectItem value="24">24</SelectItem>
                    <SelectItem value="48">48</SelectItem>
                  </SelectContent>
                </Select>
              </TooltipTrigger>
              <TooltipContent>
                <p>Games to show</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <ToggleGroup type="single" value={viewMode} onValueChange={value => value && setViewMode(value as 'grid' | 'zen')}>
            <ToggleGroupItem value="grid" aria-label="Grid View">
              <Grid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="zen" aria-label="Zen View">
              <Eye className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search games..."
              value={filters.search}
              onChange={(e) => updateSearchFilter(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Select value={sortBy} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="dust_score">Dust Score</SelectItem>
                    <SelectItem value="playtime_minutes">Playtime</SelectItem>
                  </SelectContent>
                </Select>
              </TooltipTrigger>
              <TooltipContent>
                <p>Sort games by different criteria</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSortChange(sortBy)}
          >
            {sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          </Button>
        </div>

        {/* Filter Toggles */}
        <div className="flex gap-2">
          <Button
            variant={filters.onlyUnplayed ? "default" : "outline"}
            size="sm"
            onClick={toggleOnlyUnplayed}
          >
            Only Unplayed
          </Button>
          <Button
            variant={filters.hideIgnored ? "default" : "outline"}
            size="sm"
            onClick={toggleHideIgnored}
          >
            Hide Ignored
          </Button>
          {(filters.search || filters.onlyUnplayed || filters.hideIgnored) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      <div className="terminal-content">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <SteamLoader message="Loading your library..." size="md" variant="secondary" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-400">
            <p>Error loading library: {error.message}</p>
          </div>
        ) : processedGames.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No games found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {processedGames.map(game => (
              <GameCard
                key={game.userGame.id}
                id={game.userGame.id}
                gameId={game.id}
                title={game.name}
                imageUrl={game.imageUrl}
                headerImage={game.header_image}
                dustScore={game.userGame.dust_score}
                playtimeMinutes={game.userGame.playtime_minutes}
                isHidden={game.userGame.hidden}
                notes={game.userGame.notes}
                onMarkAsPlayed={() => handleMarkAsPlayed(game.userGame.id)}
                onToggleHidden={() => handleToggleHidden(game.userGame.id, game.userGame.hidden || false)}
                onSaveNote={(note) => handleSaveNote(game.userGame.id, note)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LibraryPreview;
