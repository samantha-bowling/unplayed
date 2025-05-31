
import React from 'react';
import { GameDustBreakdown } from '@/hooks/use-dust-breakdowns';
import PlayNowButton from './PlayNowButton';

interface GameOpportunityCardProps {
  game: GameDustBreakdown;
  title: string;
  subtitle: string;
  highlight?: string;
}

const GameOpportunityCard: React.FC<GameOpportunityCardProps> = ({
  game,
  title,
  subtitle,
  highlight
}) => {
  return (
    <div className="bg-black/30 rounded-lg p-4">
      <h3 className="text-lg font-medium mb-3">{title}</h3>
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0">
          {game.imageUrl ? (
            <img 
              src={game.imageUrl} 
              alt={game.gameName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-600 flex items-center justify-center text-xs text-gray-400">
              No Image
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-white truncate mb-1">
            {game.gameName}
          </p>
          <p className="text-xs text-gray-400 mb-1">
            {subtitle}
          </p>
          {highlight && (
            <p className="text-xs text-unplayed-amber font-medium">
              {highlight}
            </p>
          )}
        </div>
        <div className="flex-shrink-0">
          <PlayNowButton
            gameId={game.gameId}
            gameName={game.gameName}
            className="text-xs px-2 py-1"
          />
        </div>
      </div>
    </div>
  );
};

export default GameOpportunityCard;
