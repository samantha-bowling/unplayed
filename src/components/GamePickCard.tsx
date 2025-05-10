
import React from 'react';
import { GamePick } from '@/hooks/use-game-picks';
import { GameListItem } from '@/types/unplayed-data.types';
import { Clock } from 'lucide-react';

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
}

const GamePickCard: React.FC<GamePickCardProps> = ({ 
  game, 
  pick,
  compact = false 
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (compact) {
    return (
      <div className="bg-black/30 rounded p-2 text-sm flex items-center">
        <img src={game.image} alt={game.title} className="w-8 h-8 object-cover rounded mr-2" />
        <div className="overflow-hidden">
          <span className="text-gray-300 truncate block">{game.title}</span>
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
    <div className="pixel-card">
      <img src={game.image} alt={game.title} className="w-full h-36 object-cover rounded-md mb-2" />
      
      <h4 className="text-lg font-medium text-white mb-1">{game.title}</h4>
      
      <div className="flex items-center text-gray-400 text-sm mb-2">
        <Clock className="h-4 w-4 mr-1" />
        <span>{game.playtime === 0 ? 'Never played' : `${game.playtime} hrs`}</span>
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
