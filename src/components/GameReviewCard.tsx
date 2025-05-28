
import React from 'react';
import { Button } from '@/components/ui/button';
import { SteamIcon } from '@/components/icons/SteamIcon';
import { ExternalLink } from 'lucide-react';

interface GameReviewCardProps {
  review: {
    review: string;
    author?: {
      steamid?: string;
      playtime_forever?: number;
    };
    timestamp_created?: number;
    language?: string;
  } | null;
  isLoading: boolean;
  hasFetched: boolean;
  onGetReview: () => void;
  onGetAnotherReview: () => void;
  gameId?: number;
}

const GameReviewCard: React.FC<GameReviewCardProps> = ({ 
  review, 
  isLoading, 
  hasFetched,
  onGetReview,
  onGetAnotherReview,
  gameId
}) => {
  // Show initial "Get Review" button if we haven't fetched yet
  if (!hasFetched) {
    return (
      <div className="mt-4 p-4 bg-gray-800/50 rounded-md border border-gray-700 text-center">
        <Button 
          onClick={onGetReview}
          className="bg-unplayed-amber hover:bg-unplayed-amber/80 text-black font-semibold"
          disabled={isLoading}
        >
          {isLoading ? 'Finding reasons...' : 'Give me a reason to play'}
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mt-4 p-3 bg-gray-800/50 rounded-md animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-1/2"></div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="mt-4 p-3 bg-gray-800/50 rounded-md">
        <p className="text-gray-400 italic text-center">
          We couldn't find any glowing words, but who knows — maybe <span className="text-unplayed-mint">you'll</span> be the first!
        </p>
      </div>
    );
  }

  // Format playtime to be more readable
  const formatPlaytime = (minutes?: number) => {
    if (!minutes) return 'Unknown';
    
    const hours = Math.floor(minutes / 60);
    if (hours < 1) return 'Less than 1 hour';
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  };

  // Format review date
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '';
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  // Handle special characters and formatting in review text
  const formatReviewText = (text: string) => {
    // Very basic sanitization - a more comprehensive approach would use a proper HTML sanitizer
    return text
      .replace(/\\r\\n|\\n|\\r/g, '\n') // Convert escape sequences to actual line breaks
      .replace(/\[b\](.*?)\[\/b\]/g, '<strong>$1</strong>') // Convert BBCode bold to HTML
      .replace(/\[i\](.*?)\[\/i\]/g, '<em>$1</em>'); // Convert BBCode italics to HTML
  };

  return (
    <div className="mt-4 p-3 bg-gray-800/50 rounded-md border border-gray-700">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center">
          <SteamIcon className="h-4 w-4 mr-2" />
          <span className="text-sm text-gray-400">Steam Review</span>
        </div>
        {review.language && review.language !== 'english' && (
          <span className="text-xs px-2 py-0.5 bg-gray-700 rounded text-gray-300">
            {review.language.toUpperCase()}
          </span>
        )}
      </div>
      
      <div 
        className="text-sm text-gray-200 mb-3 whitespace-pre-wrap" 
        dangerouslySetInnerHTML={{ __html: formatReviewText(review.review) }}
      ></div>
      
      <div className="flex justify-between items-center text-xs text-gray-400 mt-2 pt-2 border-t border-gray-700">
        <div>
          {review.author?.playtime_forever !== undefined && (
            <span>Playtime: {formatPlaytime(review.author.playtime_forever)}</span>
          )}
          {review.timestamp_created && (
            <span className="ml-2">• {formatDate(review.timestamp_created)}</span>
          )}
        </div>
        
        <div className="flex">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onGetAnotherReview}
            className="text-xs h-7 px-2"
          >
            Another review
          </Button>
          
          {gameId && (
            <a
              href={`https://store.steampowered.com/app/${gameId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-unplayed-amber flex items-center ml-2"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Steam
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameReviewCard;
