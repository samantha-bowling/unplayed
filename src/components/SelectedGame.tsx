
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Clock, ExternalLink } from 'lucide-react';
import { GameListItem } from '@/types/unplayed-data.types';
import GameReviewCard from './GameReviewCard';
import useSteamReviews from '@/hooks/use-steam-reviews';
import { getBestGameImage } from '@/utils/image-utils';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface SelectedGameProps {
  game: GameListItem;
  onPlayGame: () => void;
  onRollAgain: () => void;
}

const SelectedGame: React.FC<SelectedGameProps> = ({ game, onPlayGame, onRollAgain }) => {
  const [showReview, setShowReview] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { 
    review, 
    isLoading, 
    hasReviews,
    cycleNextReview 
  } = useSteamReviews(showReview ? game.id : null);

  const handleGetReason = () => {
    setShowReview(true);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  // Get the best available image with fallback
  const gameImage = imageError ? '/placeholder.svg' : getBestGameImage(
    game.header_image || null, 
    game.image || null, 
    game.id
  );

  return (
    <div className="pixel-card animate-fade-in">
      <AspectRatio ratio={16 / 9} className="mb-4">
        <img 
          src={gameImage} 
          alt={game.name} 
          className="w-full h-full object-cover rounded-md" 
          onError={handleImageError}
        />
      </AspectRatio>
      
      <h3 className="text-xl font-bold text-white mb-2">{game.name}</h3>
      
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
          Fate has spoken: Play <span className="text-unplayed-pink">{game.name}</span>
        </p>
      </div>
      
      {!showReview ? (
        <div className="mt-4 text-center">
          <Button 
            variant="outline"
            size="sm"
            onClick={handleGetReason}
            className="text-sm"
          >
            Give me a reason to play
          </Button>
        </div>
      ) : (
        <GameReviewCard 
          review={review} 
          isLoading={isLoading}
          onGetAnotherReview={cycleNextReview}
          gameId={game.id}
        />
      )}
    </div>
  );
};

export default SelectedGame;
