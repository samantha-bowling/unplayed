
import React from 'react';
import { useUnifiedLibraryData } from '@/hooks/useUnifiedLibraryData';
import GameCard from './GameCard';
import { Button } from './ui/button';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { isGameUnplayed } from '@/utils/game-definitions';

const LibraryPreview = () => {
  const { data: unifiedData, isLoading } = useUnifiedLibraryData();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Your Library Preview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-700 rounded-lg aspect-square"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!unifiedData?.length) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Your Library Preview</h3>
        <p className="text-gray-400">No games found in your library.</p>
      </div>
    );
  }

  // UPDATED: Use standardized game classification logic
  const unplayedGames = unifiedData.filter(game => 
    isGameUnplayed(game.playtime_minutes)
  );

  const gamesToShow = unplayedGames.slice(0, 6);

  // Handler functions for GameCard (preview doesn't need full functionality)
  const handleMarkAsPlayed = () => {
    console.log('Mark as played - preview mode');
  };

  const handleToggleHidden = () => {
    console.log('Toggle hidden - preview mode');
  };

  const handleSaveNote = (note: string) => {
    console.log('Save note - preview mode:', note);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Your Unplayed Games</h3>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate('/library')}
          className="flex items-center gap-2"
        >
          View All <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {gamesToShow.map((game) => (
          <GameCard
            key={game.id}
            id={game.id}
            gameId={game.game_id}
            title={game.games.name}
            imageUrl={game.games.image_url}
            headerImage={game.games.header_image}
            dustScore={game.dust_score}
            playtimeMinutes={game.playtime_minutes}
            isHidden={game.hidden}
            notes={game.notes}
            onMarkAsPlayed={handleMarkAsPlayed}
            onToggleHidden={handleToggleHidden}
            onSaveNote={handleSaveNote}
          />
        ))}
      </div>
      
      {unplayedGames.length > 6 && (
        <div className="text-center pt-4">
          <p className="text-sm text-gray-400">
            And {unplayedGames.length - 6} more unplayed games...
          </p>
        </div>
      )}
    </div>
  );
};

export default LibraryPreview;
