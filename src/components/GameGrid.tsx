import React, { useMemo, memo, useState, useEffect, useRef } from 'react';
import GameCard from './GameCard';
import GameCardSkeleton from './GameCardSkeleton';
import VirtualGameGrid from './VirtualGameGrid';
import { LibraryGame } from '@/hooks/use-library-data';
import { Loader2 } from 'lucide-react';
import { useProgressiveLoading } from '@/hooks/use-progressive-loading';
import { preprocessGameData, areGamesEqual, ProcessedGameData } from '@/utils/game-grid-utils';
import { useDemoMode } from '@/context/DemoModeContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import EnhancedErrorBoundary from './EnhancedErrorBoundary';

interface GameGridProps {
  games: LibraryGame[];
  isLoading: boolean;
  onMarkAsPlayed: (userGameId: string) => void;
  onToggleHidden: (userGameId: string, hidden: boolean) => void;
  onSaveNote: (userGameId: string, note: string) => void;
  focusedGameId?: number | null;
}

const GameGrid: React.FC<GameGridProps> = memo(({
  games,
  isLoading,
  onMarkAsPlayed,
  onToggleHidden,
  onSaveNote,
  focusedGameId = null
}) => {
  const { isDemo } = useDemoMode();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = useState({ width: 800, height: 600 });
  
  // Use virtual scrolling for large collections
  const shouldUseVirtualScrolling = games.length > 100;
  
  // Container resize observer for virtual scrolling
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setContainerDimensions({ width: width || 800, height: Math.min(height || 600, 800) });
      }
    };

    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
      updateDimensions(); // Initial measurement
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Pre-process game data to avoid repeated calculations
  const processedGames = useMemo(() => preprocessGameData(games), [games]);
  
  // Use progressive loading hook
  const { visibleItems, hasMore, loadMore, isProgressive } = useProgressiveLoading({
    totalItems: processedGames.length,
    isLoading,
    batchSize: 8,
    isDemo
  });

  // Memoize the displayed games to avoid re-slicing on every render
  const displayedGames = useMemo(() => 
    processedGames.slice(0, visibleItems), 
    [processedGames, visibleItems]
  );

  // Memoize the skeleton cards to avoid recreating on every render
  const skeletonCards = useMemo(() => 
    Array.from({ length: 8 }).map((_, index) => (
      <div key={`skeleton-${index}`} className="animate-pulse opacity-70">
        <GameCardSkeleton />
      </div>
    )), 
    []
  );

  // If initially loading, show skeleton cards
  if (isLoading) {
    return (
      <div>
        <div className="mb-4 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-unplayed-mint mr-2" />
          <p className="text-gray-400">Loading your game collection...</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {skeletonCards}
        </div>
      </div>
    );
  }

  if (!games || games.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="bg-unplayed-mint/10 p-6 rounded-full mb-4">
          <span className="text-4xl">🎮</span>
        </div>
        <h3 className="text-xl font-medium mb-2">No games found</h3>
        <p className="text-gray-400 max-w-md">
          No games match your current filters, or your collection is empty.
          Try adjusting your search filters or adding games to your library.
        </p>
      </div>
    );
  }

  return (
    <EnhancedErrorBoundary componentName="GameGrid">
      <div ref={containerRef}>
        {shouldUseVirtualScrolling ? (
          <VirtualGameGrid
            games={games}
            isLoading={isLoading}
            onMarkAsPlayed={onMarkAsPlayed}
            onToggleHidden={onToggleHidden}
            onSaveNote={onSaveNote}
            focusedGameId={focusedGameId}
            containerHeight={containerDimensions.height}
            containerWidth={containerDimensions.width}
          />
        ) : (
          <ScrollArea className="max-h-[70vh] w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-2">
              {displayedGames.map((game) => {
                const isFocused = focusedGameId === game.gameId;
                
                return (
                  <div 
                    key={game.userGameId} 
                    id={game.id}
                    className={`transition-all duration-300 ${isFocused ? 'scale-105 ring-2 ring-unplayed-mint rounded-lg shadow-lg shadow-unplayed-mint/25' : ''}`}
                  >
                    <GameCard
                      id={game.userGameId}
                      gameId={game.gameId}
                      title={game.title}
                      imageUrl={game.imageUrl}
                      dustScore={game.dustScore}
                      playtimeMinutes={game.playtimeMinutes}
                      isHidden={game.isHidden}
                      notes={game.notes}
                      onMarkAsPlayed={() => onMarkAsPlayed(game.userGameId)}
                      onToggleHidden={() => onToggleHidden(game.userGameId, !(game.isHidden))}
                      onSaveNote={(note) => onSaveNote(game.userGameId, note)}
                    />
                  </div>
                );
              })}
              
              {/* Show skeleton cards for the next batch that's loading (only in progressive mode) */}
              {isProgressive && hasMore && (
                <>
                  {Array.from({ length: Math.min(8, processedGames.length - visibleItems) }).map((_, index) => (
                    <div key={`loading-${index}`} className="animate-pulse opacity-70">
                      <GameCardSkeleton />
                    </div>
                  ))}
                </>
              )}
            </div>
          </ScrollArea>
        )}
        
        {/* Load more button for larger collections (only in progressive mode and not using virtual scrolling) */}
        {!shouldUseVirtualScrolling && isProgressive && hasMore && (
          <div className="flex justify-center mt-8">
            <button
              className="px-4 py-2 bg-unplayed-mint/20 hover:bg-unplayed-mint/30 transition-colors rounded-md text-unplayed-mint flex items-center"
              onClick={loadMore}
            >
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading {Math.min(8, processedGames.length - visibleItems)} more games...
            </button>
          </div>
        )}
      </div>
    </EnhancedErrorBoundary>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memoization
  return (
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.focusedGameId === nextProps.focusedGameId &&
    areGamesEqual(prevProps.games, nextProps.games)
  );
});

GameGrid.displayName = 'GameGrid';

export default GameGrid;
