
import React from 'react';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import { GameListItem } from '@/types/unplayed-data.types';

interface SelectedGameProps {
  game: GameListItem;
  onPlayGame: () => void;
  onRollAgain: () => void;
}

const SelectedGame: React.FC<SelectedGameProps> = ({ game, onPlayGame, onRollAgain }) => {
  return (
    <div className="pixel-card animate-fade-in">
      <img 
        src={game.imageUrl || ''} 
        alt={game.title} 
        className="w-full h-48 object-cover rounded-md mb-4" 
      />
      
      <h3 className="text-xl font-bold text-white mb-2">{game.title}</h3>
      
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center text-gray-400">
          <Clock className="h-4 w-4 mr-1" />
          <span>Never played</span>
        </div>
      </div>
      
      <div className="flex justify-between space-x-2">
        <Button 
          className="btn-primary flex-grow"
          onClick={onPlayGame}
          disabled={!game.id}
        >
          Play Now
        </Button>
        <Button 
          className="btn-secondary flex-grow" 
          onClick={onRollAgain}
        >
          Roll Again
        </Button>
      </div>
      
      <div className="mt-4 text-center">
        <p className="text-unplayed-amber font-medium">
          Fate has spoken: Play <span className="text-unplayed-pink">{game.title}</span>
        </p>
      </div>
    </div>
  );
};

export default SelectedGame;
