
import React, { useState, useMemo, useCallback } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { ScrollArea } from '@/components/ui/scroll-area';
import ShelfLifeHeader from '@/components/shelf-life/ShelfLifeHeader';
import ShelfLifeDescription from '@/components/shelf-life/ShelfLifeDescription';
import ShelfLifeGameItem from '@/components/shelf-life/ShelfLifeGameItem';
import ShelfLifeFooter from '@/components/shelf-life/ShelfLifeFooter';
import { calculateReleaseAge, formatDate } from '@/utils/shelf-life-date-utils';

interface ShelfLifeProps {
  onJumpToGame?: (gameId: number) => void;
  onMarkAsPlayed?: (gameId: number) => void;
}

const ShelfLife = React.memo<ShelfLifeProps>(({
  onJumpToGame,
  onMarkAsPlayed
}: ShelfLifeProps) => {
  const [hoveredGame, setHoveredGame] = useState<number | null>(null);
  const [displayCount, setDisplayCount] = useState<string>("10");
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const { data: dashboardData } = useDashboardData();

  // Memoize the shelf life data and slicing - now respects the selected display count
  const { allOldestGames, oldestGames } = useMemo(() => {
    const allGames = dashboardData.shelfLife || [];
    const displayCountNum = parseInt(displayCount);
    const slicedGames = allGames.slice(0, displayCountNum);
    
    return {
      allOldestGames: allGames,
      oldestGames: slicedGames
    };
  }, [dashboardData.shelfLife, displayCount]);

  // Memoized callbacks
  const handleMarkAsPlayed = useCallback((gameId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMarkAsPlayed) {
      onMarkAsPlayed(gameId);
    }
  }, [onMarkAsPlayed]);

  const handleJumpToGame = useCallback((gameId: number) => {
    if (onJumpToGame) {
      onJumpToGame(gameId);
    }
  }, [onJumpToGame]);

  const handlePickFromOldest = useCallback(() => {
    // Since picker page is removed, we can navigate to library instead
    console.log('Navigate to library to see oldest games');
  }, []);

  const handleMouseEnter = useCallback((gameId: number) => {
    setHoveredGame(gameId);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredGame(null);
  }, []);

  const handleImageError = useCallback((gameId: number) => {
    setImageErrors(prev => new Set(prev).add(gameId));
  }, []);

  // Memoized game items to prevent recreation
  const gameItems = useMemo(() => 
    oldestGames.map((game: any, index) => (
      <ShelfLifeGameItem
        key={game.id}
        game={game}
        index={index}
        hoveredGame={hoveredGame}
        imageErrors={imageErrors}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onJumpToGame={handleJumpToGame}
        onMarkAsPlayed={onMarkAsPlayed ? handleMarkAsPlayed : undefined}
        onImageError={handleImageError}
        calculateReleaseAge={calculateReleaseAge}
        formatDate={formatDate}
      />
    )), 
    [oldestGames, hoveredGame, imageErrors, handleJumpToGame, handleMouseEnter, handleMouseLeave, handleMarkAsPlayed, onMarkAsPlayed, handleImageError]
  );

  return (
    <div className="terminal-container w-full h-[650px] flex flex-col p-4">
      <ShelfLifeHeader
        displayCount={displayCount}
        setDisplayCount={setDisplayCount}
        onPickFromOldest={handlePickFromOldest}
        hasGames={oldestGames.length > 0}
      />
      
      <ShelfLifeDescription />
      
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full pr-2">
          <div className="space-y-2">
            {gameItems}
          </div>
        </ScrollArea>
      </div>
      
      <ShelfLifeFooter
        oldestGames={oldestGames}
        allOldestGames={allOldestGames}
        displayCount={displayCount}
      />
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for optimal re-rendering
  return (
    prevProps.onJumpToGame === nextProps.onJumpToGame &&
    nextProps.onMarkAsPlayed === nextProps.onMarkAsPlayed
  );
});

ShelfLife.displayName = 'ShelfLife';

export default ShelfLife;
