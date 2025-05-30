
import React, { useState, useMemo } from 'react';
import { Search, Filter, SortAsc, SortDesc, Grid, List, Maximize, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLibraryData } from '@/hooks/use-library-data';
import { usePaginatedLibrary } from '@/hooks/use-paginated-library';
import GameCard from '@/components/GameCard';
import FloatingIcons from '@/components/FloatingIcons';
import FloatingGameNames from '@/components/FloatingGameNames';
import { useFullScreenMode } from '@/context/FullScreenModeContext';

const LibraryGamesTab = () => {
  const { isFullScreenMode, toggleFullScreenMode } = useFullScreenMode();
  const [viewMode, setViewMode] = useState<'grid' | 'zen'>('grid');
  const [pageSize, setPageSize] = useState(24);
  
  const {
    games: paginatedGames,
    isLoading,
    pagination,
    filters,
    sortBy,
    sortDirection,
    updateSearchFilter,
    toggleHideIgnored,
    toggleOnlyUnplayed,
    resetFilters,
    goToPage,
    nextPage,
    previousPage,
    setPageSize: updatePageSize,
    updateSort,
    markAsPlayed,
    toggleGameHidden,
    saveGameNote,
  } = usePaginatedLibrary();

  // Extract game names for zen mode - use CURRENT PAGE games (what user sees)
  const gameNames = useMemo(() => {
    return paginatedGames.map(game => game.name);
  }, [paginatedGames]);

  const handlePageSizeChange = (newSize: string) => {
    const size = parseInt(newSize);
    setPageSize(size);
    updatePageSize(size);
  };

  const handleMarkAsPlayed = async (userGameId: string) => {
    await markAsPlayed(userGameId);
  };

  const handleToggleHidden = async (userGameId: string, currentHidden: boolean) => {
    await toggleGameHidden(userGameId, !currentHidden);
  };

  const handleSaveNote = async (userGameId: string, note: string) => {
    await saveGameNote(userGameId, note);
  };

  if (viewMode === 'zen') {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-black z-[9999] overflow-hidden">
        <div className="w-full h-full relative">
          {/* Exit Zen button - positioned in top-left */}
          <div className="absolute top-4 left-4 z-10 opacity-40 hover:opacity-100 transition-opacity duration-300">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('grid')}
              className="bg-black/50 border-gray-700 hover:bg-black/70"
            >
              Exit Zen
            </Button>
          </div>
          
          <div className="absolute inset-0 overflow-hidden">
            <FloatingIcons count={5} />
            <FloatingGameNames gameNames={gameNames} count={Math.min(8, gameNames.length)} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search games..."
                    value={filters.search}
                    onChange={(e) => updateSearchFilter(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Search games by name</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Select value={sortBy} onValueChange={updateSort}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="dust_score">Dust Score</SelectItem>
                    <SelectItem value="playtime_minutes">Playtime</SelectItem>
                    <SelectItem value="last_played_date">Last Played</SelectItem>
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
            onClick={() => updateSort(sortBy)}
          >
            {sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          </Button>
        </div>
        
        <div className="flex gap-2 items-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="8">8</SelectItem>
                    <SelectItem value="16">16</SelectItem>
                    <SelectItem value="24">24</SelectItem>
                    <SelectItem value="48">48</SelectItem>
                    <SelectItem value="96">96</SelectItem>
                  </SelectContent>
                </Select>
              </TooltipTrigger>
              <TooltipContent>
                <p>Games per page</p>
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

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-400">
        <span>
          Showing {paginatedGames.length} of {pagination.totalItems} games
        </span>
        <span>
          Page {pagination.currentPage} of {pagination.totalPages}
        </span>
      </div>

      {/* Games Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: pageSize }).map((_, i) => (
            <div key={i} className="aspect-video bg-gray-800 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : paginatedGames.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {paginatedGames.map(game => (
            <GameCard
              key={game.userGame.id}
              id={game.userGame.id}
              gameId={game.id}
              title={game.name}
              imageUrl={game.image_url}
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
      ) : (
        <div className="text-center py-12 text-gray-400">
          <p>No games found matching your criteria.</p>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={previousPage}
            disabled={!pagination.hasPreviousPage}
          >
            Previous
          </Button>
          
          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <Button
                  key={page}
                  variant={pagination.currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => goToPage(page)}
                  className="w-8 h-8 p-0"
                >
                  {page}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={nextPage}
            disabled={!pagination.hasNextPage}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default LibraryGamesTab;
