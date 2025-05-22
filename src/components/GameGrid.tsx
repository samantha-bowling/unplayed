
import React, { useEffect, useState } from 'react';
import GameCard from './GameCard';
import GameCardSkeleton from './GameCardSkeleton';
import { LibraryGame } from '@/hooks/use-library-data';
import { Loader2 } from 'lucide-react';
import { getBestGameImage } from '@/utils/image-utils';

interface GameGridProps {
  games: LibraryGame[];
  isLoading: boolean;
  onMarkAsPlayed: (userGameId: string) => void;
  onToggleHidden: (userGameId: string, hidden: boolean) => void;
  onSaveNote: (userGameId: string, note: string) => void;
  focusedGameId?: number | null;
}

const GameGrid: React.FC<GameGridProps> = ({
  games,
  isLoading,
  onMarkAsPlayed,
  onToggleHidden,
  onSaveNote,
  focusedGameId = null
}) => {
  // State for progressive loading effect
  const [visibleGames, setVisibleGames] = useState<number>(0);
  const gamesPerBatch = 8; // Number of games to load at once
  const totalGames = games.length;
  
  // Reset visible games when games array changes
  useEffect(() => {
    if (!isLoading && games.length > 0) {
      // Initially show first batch, then gradually add more
      const timer = setTimeout(() => {
        setVisibleGames(Math.min(gamesPerBatch, totalGames));
      }, 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [games, isLoading, totalGames]);
  
  // Add more games as user scrolls
  useEffect(() => {
    if (visibleGames < totalGames) {
      const handleScroll = () => {
        const scrolledToBottom = 
          window.innerHeight + window.pageYOffset >= document.body.offsetHeight - 500;
        
        if (scrolledToBottom) {
          // Add next batch of games
          setVisibleGames(prev => Math.min(prev + gamesPerBatch, totalGames));
        }
      };
      
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
    return undefined;
  }, [visibleGames, totalGames]);

  // If initially loading, show skeleton cards
  if (isLoading) {
    return (
      <div>
        <div className="mb-4 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-unplayed-mint mr-2" />
          <p className="text-gray-400">Loading your game collection...</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={`skeleton-${index}`} className="animate-pulse opacity-70">
              <GameCardSkeleton />
            </div>
          ))}
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

  // Only display the number of games that should be visible
  const displayedGames = games.slice(0, visibleGames);

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {displayedGames.map((game) => {
          // Get the best image using our utility
          const imageUrl = getBestGameImage(game.header_image, game.image_url);
          
          return (
            <div 
              key={game.userGame.id} 
              id={`game-${game.id}`}
              className={`transition-all duration-300 ${focusedGameId === game.id ? 'scale-105 ring-2 ring-unplayed-mint rounded-lg shadow-lg shadow-unplayed-mint/25' : ''}`}
            >
              <GameCard
                id={game.userGame.id}
                gameId={game.id}
                title={game.name}
                imageUrl={imageUrl}
                dustScore={game.userGame.dust_score}
                playtimeMinutes={game.userGame.playtime_minutes}
                isHidden={game.userGame.hidden}
                notes={game.userGame.notes}
                onMarkAsPlayed={() => onMarkAsPlayed(game.userGame.id)}
                onToggleHidden={() => onToggleHidden(game.userGame.id, !(game.userGame.hidden))}
                onSaveNote={(note) => onSaveNote(game.userGame.id, note)}
              />
            </div>
          );
        })}
        
        {/* Show skeleton cards for the next batch that's loading */}
        {visibleGames < totalGames && (
          <>
            {Array.from({ length: Math.min(gamesPerBatch, totalGames - visibleGames) }).map((_, index) => (
              <div key={`loading-${index}`} className="animate-pulse opacity-70">
                <GameCardSkeleton />
              </div>
            ))}
          </>
        )}
      </div>
      
      {/* Load more button for larger collections */}
      {visibleGames < totalGames && (
        <div className="flex justify-center mt-8">
          <button
            className="px-4 py-2 bg-unplayed-mint/20 hover:bg-unplayed-mint/30 transition-colors rounded-md text-unplayed-mint flex items-center"
            onClick={() => setVisibleGames(prev => Math.min(prev + gamesPerBatch, totalGames))}
          >
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Loading {Math.min(gamesPerBatch, totalGames - visibleGames)} more games...
          </button>
        </div>
      )}
    </div>
  );
};

export default GameGrid;
