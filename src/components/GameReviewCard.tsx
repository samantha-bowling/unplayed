
import React from 'react';
import { Button } from '@/components/ui/button';
import { SteamIcon } from '@/components/icons/SteamIcon';
import { ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';

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
  isError?: boolean;
  error?: string;
  onGetAnotherReview: () => void;
  onRetryFetch?: () => void;
  gameId?: number;
  reviewScore?: string | null;
}

const GameReviewCard: React.FC<GameReviewCardProps> = ({ 
  review, 
  isLoading, 
  isError,
  error,
  onGetAnotherReview,
  onRetryFetch,
  gameId,
  reviewScore
}) => {
  if (isLoading) {
    return (
      <div className="mt-4 p-3 bg-gray-800/50 rounded-md">
        <div className="flex items-center mb-3">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-unplayed-mint mr-2"></div>
          <span className="text-sm text-gray-400">Fetching Steam reviews...</span>
        </div>
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          <div className="h-4 bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (isError || error) {
    return (
      <div className="mt-4 p-3 bg-gray-800/50 rounded-md border border-red-500/30">
        <div className="flex items-center mb-2">
          <AlertCircle className="h-4 w-4 text-red-400 mr-2" />
          <span className="text-sm text-red-400">Failed to fetch reviews</span>
        </div>
        <p className="text-gray-400 text-sm mb-3">
          {error || 'Unable to load Steam reviews at this time.'}
        </p>
        <div className="flex justify-between items-center">
          <p className="text-xs text-gray-500">
            This may be due to browser security restrictions or Steam API issues.
          </p>
          {onRetryFetch && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onRetryFetch}
              className="text-xs h-7 px-2 text-unplayed-mint hover:text-unplayed-mint/80"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="mt-4 p-3 bg-gray-800/50 rounded-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <SteamIcon className="h-4 w-4 mr-2" />
            <span className="text-sm text-gray-400">No reviews found</span>
          </div>
          {reviewScore && (
            <span className="text-xs px-2 py-0.5 bg-gray-700 rounded text-gray-300">
              {reviewScore}
            </span>
          )}
        </div>
        <p className="text-gray-400 italic text-center">
          We couldn't find any glowing words, but who knows — maybe <span className="text-unplayed-mint">you'll</span> be the first!
        </p>
        {onRetryFetch && (
          <div className="mt-3 text-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onRetryFetch}
              className="text-xs h-7 px-2"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Try again
            </Button>
          </div>
        )}
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
    return text
      .replace(/\\r\\n|\\n|\\r/g, '\n')
      .replace(/\[b\](.*?)\[\/b\]/g, '<strong>$1</strong>')
      .replace(/\[i\](.*?)\[\/i\]/g, '<em>$1</em>');
  };

  return (
    <div className="mt-4 p-3 bg-gray-800/50 rounded-md border border-gray-700">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center">
          <SteamIcon className="h-4 w-4 mr-2" />
          <span className="text-sm text-gray-400">Steam Review</span>
          {reviewScore && (
            <span className="ml-2 text-xs px-2 py-0.5 bg-unplayed-mint/20 rounded text-unplayed-mint">
              {reviewScore}
            </span>
          )}
        </div>
        {review.language && review.language !== 'english' && (
          <span className="text-xs px-2 py-0.5 bg-gray-700 rounded text-gray-300">
            {review.language.toUpperCase()}
          </span>
        )}
      </div>
      
      <div 
        className="text-sm text-gray-200 mb-3 whitespace-pre-wrap max-h-32 overflow-y-auto" 
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
