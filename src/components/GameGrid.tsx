
import React from 'react';
import GameCard from './GameCard';
import { LibraryGame } from '@/hooks/use-library-data';
import { Loader2 } from 'lucide-react';

interface GameGridProps {
  games: LibraryGame[];
  isLoading: boolean;
  onMarkAsPlayed: (userGameId: string) => void;
  onToggleHidden: (userGameId: string, hidden: boolean) => void;
  onSaveNote: (userGameId: string, note: string) => void;
}

const GameGrid: React.FC<GameGridProps> = ({
  games,
  isLoading,
  onMarkAsPlayed,
  onToggleHidden,
  onSaveNote
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-unplayed-mint mb-4" />
        <p className="text-gray-400">Loading your game collection...</p>
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
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {games.map((game) => (
        <GameCard
          key={game.userGame.id}
          id={game.userGame.id}
          gameId={game.id}
          title={game.name}
          imageUrl={game.image_url || game.header_image}
          dustScore={game.userGame.dust_score}
          playtimeMinutes={game.userGame.playtime_minutes}
          isHidden={game.userGame.hidden}
          notes={game.userGame.notes}
          onMarkAsPlayed={() => onMarkAsPlayed(game.userGame.id)}
          onToggleHidden={() => onToggleHidden(game.userGame.id, !(game.userGame.hidden))}
          onSaveNote={(note) => onSaveNote(game.userGame.id, note)}
        />
      ))}
    </div>
  );
};

export default GameGrid;
