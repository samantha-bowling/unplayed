
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import LibraryFilters from '@/components/LibraryFilters';
import GameGrid from '@/components/GameGrid';
import PaginatedGameGrid from '@/components/PaginatedGameGrid';
import LibraryPreview from '@/components/LibraryPreview';
import { SortOption } from '@/hooks/use-library-data';

interface LibraryContentProps {
  games: any[];
  isLoading: boolean;
  error: any;
  filters: any;
  updateSearchFilter: (search: string) => void;
  toggleHideIgnored: () => void;
  toggleOnlyUnplayed: () => void;
  updateSelectedGenre: (genre: string) => void;
  resetFilters: () => void;
  sortBy: SortOption;
  sortDirection: 'asc' | 'desc';
  updateSort: (sortBy: SortOption, direction?: 'asc' | 'desc') => void;
  viewMode: 'grid' | 'zen';
  updateViewMode: (mode: 'grid' | 'zen') => void;
  usePagination: boolean;
  paginatedData?: any;
  legacyData?: any;
  onMarkAsPlayed: (userGameId: string) => void;
  onToggleHidden: (userGameId: string, hidden: boolean) => void;
  onSaveNote: (userGameId: string, note: string) => void;
  focusedGameId: number | null;
}

const LibraryContent: React.FC<LibraryContentProps> = ({
  games,
  isLoading,
  error,
  filters,
  updateSearchFilter,
  toggleHideIgnored,
  toggleOnlyUnplayed,
  updateSelectedGenre,
  resetFilters,
  sortBy,
  sortDirection,
  updateSort,
  viewMode,
  updateViewMode,
  usePagination,
  paginatedData,
  legacyData,
  onMarkAsPlayed,
  onToggleHidden,
  onSaveNote,
  focusedGameId
}) => {
  const gameGridRef = useRef<HTMLDivElement>(null);

  // Create a wrapper function that matches LibraryFilters' expected signature
  const handleSortChange = (option: SortOption) => {
    updateSort(option);
  };

  return (
    <>
      {/* Library filters */}
      <LibraryFilters
        searchQuery={filters.search}
        onSearchChange={updateSearchFilter}
        hideIgnored={filters.hideIgnored}
        onHideIgnoredChange={toggleHideIgnored}
        onlyUnplayed={filters.onlyUnplayed}
        onOnlyUnplayedChange={toggleOnlyUnplayed}
        selectedGenre={filters.selectedGenre}
        onGenreChange={updateSelectedGenre}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
        onResetFilters={resetFilters}
      />
      
      {/* Section header for library with game count */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-medium text-unplayed-mint flex items-center">
          <Sparkles className="mr-2 h-4 w-4" />
          Explore Your Collection
          {!isLoading && games.length > 0 && (
            <span className="ml-2 text-sm text-gray-400">
              ({usePagination ? `${paginatedData?.pagination.totalItems} games` : `${games.length} games`})
            </span>
          )}
        </h2>
        
        {/* Library view toggle */}
        <div className="flex space-x-2">
          <Button
            variant={viewMode === 'grid' ? "default" : "outline"}
            size="sm"
            onClick={() => updateViewMode('grid')}
            className={viewMode === 'grid' ? "bg-unplayed-mint hover:bg-unplayed-mint/90 transition-all" : "transition-all"}
          >
            Grid View
          </Button>
          <Button
            variant={viewMode === 'zen' ? "default" : "outline"}
            size="sm"
            onClick={() => updateViewMode('zen')}
            className={viewMode === 'zen' ? "bg-unplayed-mint hover:bg-unplayed-mint/90 transition-all" : "transition-all"}
          >
            Zen View
          </Button>
        </div>
      </div>
      
      {/* Game display - either grid or zen mode */}
      <div ref={gameGridRef}>
        {viewMode === 'grid' ? (
          usePagination ? (
            <PaginatedGameGrid 
              games={paginatedData.games}
              isLoading={paginatedData.isLoading}
              onMarkAsPlayed={onMarkAsPlayed}
              onToggleHidden={onToggleHidden}
              onSaveNote={onSaveNote}
              focusedGameId={focusedGameId}
              pagination={paginatedData.pagination}
              goToPage={paginatedData.goToPage}
              nextPage={paginatedData.nextPage}
              previousPage={paginatedData.previousPage}
              setPageSize={paginatedData.setPageSize}
            />
          ) : (
            <GameGrid 
              games={legacyData.games}
              isLoading={legacyData.isLoading}
              onMarkAsPlayed={onMarkAsPlayed}
              onToggleHidden={onToggleHidden}
              onSaveNote={onSaveNote}
              focusedGameId={focusedGameId}
            />
          )
        ) : (
          <LibraryPreview
            viewMode="zen"
            onViewModeChange={updateViewMode}
            games={games}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="my-8 p-4 border border-unplayed-red rounded-lg bg-unplayed-red/10 text-center">
          <p className="text-unplayed-red mb-2">Error loading your game library</p>
          <p className="text-sm text-gray-400 mb-4">{(error as Error).message}</p>
          <Button 
            variant="outline" 
            className="border-unplayed-red text-unplayed-red hover:bg-unplayed-red/10"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      )}
    </>
  );
};

export default LibraryContent;
