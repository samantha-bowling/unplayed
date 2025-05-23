
import React, { useState } from 'react';
import { GamePick } from '@/types/picks.types';
import { GameListItem } from '@/types/unplayed-data.types';
import { Clock } from 'lucide-react';
import { getBestGameImage } from '@/utils/image-utils';

// Categories for the mood-based filtering with icons
const moodIcons: Record<string, string> = {
  'cozy': '🏠',
  'adventure': '🧭',
  'challenge': '💪',
  'story': '📖',
  'quick': '⚡'
};

interface GamePickCardProps {
  game: GameListItem;
  pick?: GamePick;
  compact?: boolean;
  onClick?: () => void;
}

const GamePickCard: React.FC<GamePickCardProps> = ({ 
  game, 
  pick,
  compact = false,
  onClick
}) => {
  const [imageError, setImageError] = useState(false);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Use getBestGameImage utility for robust image fallback
  const gameImage = getBestGameImage(game.header_image || game.image, game.image_url);

  const handleImageError = () => {
    setImageError(true);
  };

  if (compact) {
    return (
      <div className="bg-black/30 rounded p-2 text-sm flex items-center">
        <div className="w-8 h-8 mr-2 rounded overflow-hidden bg-gray-800 flex-shrink-0">
          {imageError ? (
            <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
              🎮
            </div>
          ) : (
            <img 
              src={gameImage} 
              alt={game.name} 
              className="w-full h-full object-cover" 
              onError={handleImageError}
            />
          )}
        </div>
        <div className="overflow-hidden">
          <span className="text-gray-300 truncate block">{game.name}</span>
          {pick && (
            <span className="text-gray-500 text-xs">
              {formatDate(pick.picked_at)}
              {pick.filters?.mood && (
                <span className="ml-1">{moodIcons[pick.filters.mood] || ''}</span>
              )}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="pixel-card" onClick={onClick}>
      <div className="w-full h-36 mb-2 rounded-md overflow-hidden bg-gray-800">
        {imageError ? (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-2xl mb-1">🎮</div>
              <div className="text-xs">No image</div>
            </div>
          </div>
        ) : (
          <img 
            src={gameImage} 
            alt={game.name} 
            className="w-full h-full object-cover" 
            onError={handleImageError}
          />
        )}
      </div>
      
      <h4 className="text-lg font-medium text-white mb-1">{game.name}</h4>
      
      <div className="flex items-center text-gray-400 text-sm mb-2">
        <Clock className="h-4 w-4 mr-1" />
        <span>{game.playtimeMinutes === 0 ? 'Never played' : `${Math.round(game.playtimeMinutes/60)} hrs`}</span>
      </div>
      
      {pick && pick.filters?.mood && (
        <div className="text-unplayed-mint text-xs">
          Picked with mood: {moodIcons[pick.filters.mood]} {pick.filters.mood}
        </div>
      )}
      
      {pick && (
        <div className="text-gray-500 text-xs mt-1">
          Picked on {formatDate(pick.picked_at)}
        </div>
      )}
    </div>
  );
};

export default GamePickCard;
