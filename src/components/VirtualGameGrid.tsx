import React, { useMemo, memo, useCallback } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import GameCard from './GameCard';
import { LibraryGame } from '@/hooks/use-library-data';
import { preprocessGameData, ProcessedGameData } from '@/utils/game-grid-utils';
import { useDemoMode } from '@/context/DemoModeContext';

interface VirtualGameGridProps {
  games: LibraryGame[];
  isLoading: boolean;
  onMarkAsPlayed: (userGameId: string) => void;
  onToggleHidden: (userGameId: string, hidden: boolean) => void;
  onSaveNote: (userGameId: string, note: string) => void;
  focusedGameId?: number | null;
  containerHeight?: number;
  containerWidth?: number;
}

interface CellProps {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  data: {
    games: ProcessedGameData[];
    columnsPerRow: number;
    onMarkAsPlayed: (userGameId: string) => void;
    onToggleHidden: (userGameId: string, hidden: boolean) => void;
    onSaveNote: (userGameId: string, note: string) => void;
    focusedGameId?: number | null;
  };
}

const Cell = memo(({ columnIndex, rowIndex, style, data }: CellProps) => {
  const { games, columnsPerRow, onMarkAsPlayed, onToggleHidden, onSaveNote, focusedGameId } = data;
  const gameIndex = rowIndex * columnsPerRow + columnIndex;
  const game = games[gameIndex];

  if (!game) {
    return <div style={style} />;
  }

  const isFocused = focusedGameId === game.gameId;

  return (
    <div style={{ ...style, padding: '8px' }}>
      <div 
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
    </div>
  );
});

Cell.displayName = 'VirtualGameGridCell';

const VirtualGameGrid: React.FC<VirtualGameGridProps> = memo(({
  games,
  isLoading,
  onMarkAsPlayed,
  onToggleHidden,
  onSaveNote,
  focusedGameId,
  containerHeight = 600,
  containerWidth = 800
}) => {
  const { isDemo } = useDemoMode();
  
  // Pre-process game data
  const processedGames = useMemo(() => preprocessGameData(games), [games]);
  
  // Calculate grid dimensions
  const { columnsPerRow, rowCount } = useMemo(() => {
    const minCardWidth = 280;
    const maxColumns = Math.floor(containerWidth / minCardWidth);
    const columns = Math.max(1, Math.min(4, maxColumns));
    const rows = Math.ceil(processedGames.length / columns);
    
    return {
      columnsPerRow: columns,
      rowCount: rows
    };
  }, [containerWidth, processedGames.length]);

  const itemData = useMemo(() => ({
    games: processedGames,
    columnsPerRow,
    onMarkAsPlayed,
    onToggleHidden,
    onSaveNote,
    focusedGameId
  }), [processedGames, columnsPerRow, onMarkAsPlayed, onToggleHidden, onSaveNote, focusedGameId]);

  const columnWidth = useMemo(() => 
    Math.floor(containerWidth / columnsPerRow), 
    [containerWidth, columnsPerRow]
  );

  if (isLoading || processedGames.length === 0) {
    return null; // Let parent handle loading and empty states
  }

  return (
    <Grid
      columnCount={columnsPerRow}
      columnWidth={columnWidth}
      height={containerHeight}
      rowCount={rowCount}
      rowHeight={420}
      width={containerWidth}
      itemData={itemData}
      overscanRowCount={2}
      overscanColumnCount={1}
    >
      {Cell}
    </Grid>
  );
});

VirtualGameGrid.displayName = 'VirtualGameGrid';

export default VirtualGameGrid;