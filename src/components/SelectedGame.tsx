
import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, RotateCcw, ExternalLink } from 'lucide-react';
import { GameListItem } from '@/types/unplayed-data.types';
import { getBestGameImage } from '@/utils/image-utils';
import { formatPlaytime } from '@/utils/format-utils';

interface SelectedGameProps {
  game: GameListItem;
  onPlayGame: () => void;
  onRollAgain: () => void;
  disabled?: boolean;
}

const SelectedGame: React.FC<SelectedGameProps> = ({ 
  game, 
  onPlayGame, 
  onRollAgain,
  disabled = false
}) => {
  const gameImage = getBestGameImage(game.headerImage, game.imageUrl, game.id);
  
  const handleViewOnSteam = () => {
    const steamStoreUrl = `https://store.steampowered.com/app/${game.id}`;
    window.open(steamStoreUrl, '_blank');
  };

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
      <div className="flex items-start space-x-4 mb-6">
        <img 
          src={gameImage} 
          alt={game.name}
          className="w-20 h-20 object-cover rounded"
        />
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-white mb-2">{game.name}</h2>
          <div className="flex flex-wrap gap-2 mb-2">
            {game.genres && game.genres.slice(0, 3).map(genre => (
              <span key={genre} className="px-2 py-1 text-xs bg-blue-600/20 text-blue-300 rounded">
                {genre}
              </span>
            ))}
          </div>
          <p className="text-sm text-gray-400">
            Playtime: {formatPlaytime(game.playtimeMinutes)}
          </p>
        </div>
      </div>
      
      <div className="flex gap-3">
        <Button 
          onClick={onPlayGame}
          className="flex-1 bg-green-600 hover:bg-green-700"
          disabled={disabled}
        >
          <Play className="w-4 h-4 mr-2" />
          Play Now
        </Button>
        
        <Button 
          variant="outline" 
          onClick={onRollAgain}
          className="border-gray-600 hover:bg-gray-800"
          disabled={disabled}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Roll Again
        </Button>
        
        <Button 
          variant="outline" 
          onClick={handleViewOnSteam}
          className="border-gray-600 hover:bg-gray-800"
          disabled={disabled}
        >
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default SelectedGame;
