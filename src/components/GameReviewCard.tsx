
import React from 'react';
import { Button } from '@/components/ui/button';
import { BookOpenCheck } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import parse from 'html-react-parser';
import { sanitizeReviewHtml, convertBBCodeToHtml } from '@/lib/sanitize';

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
  isDemo?: boolean;
}

const GameReviewCard: React.FC<GameReviewCardProps> = ({ 
  review, 
  isLoading, 
  hasFetched,
  onGetReview,
  onGetAnotherReview,
  gameId,
  isDemo = false
}) => {
  const handleGetReview = () => {
    if (isDemo) {
      toast({
        title: "Demo Mode",
        description: "Sign in to fetch real Steam reviews that will motivate you to play!",
      });
      return;
    }
    onGetReview();
  };

  // Show initial "Get Review" button if we haven't fetched yet
  if (!hasFetched) {
    const reasonButton = (
      <Button 
        onClick={handleGetReview}
        className="bg-unplayed-amber hover:bg-unplayed-amber/80 text-black font-semibold w-full"
        disabled={isLoading}
      >
        {isLoading ? 'Finding reasons...' : 'Give me a reason to play'}
      </Button>
    );

    return (
      <div className="mt-4 p-4 bg-gray-800/50 rounded-md border border-gray-700 text-center">
        {isDemo ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                {reasonButton}
              </TooltipTrigger>
              <TooltipContent>
                <p>Fetch a positive Steam review to give you motivation to play this game!</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          reasonButton
        )}
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

  // Safe review content component
  const SafeReviewContent = ({ content }: { content: string }) => {
    const processed = convertBBCodeToHtml(content);
    const sanitized = sanitizeReviewHtml(processed);
    return <div className="text-sm text-gray-200 mb-3 whitespace-pre-wrap">{parse(sanitized)}</div>;
  };

  return (
    <div className="mt-4 p-3 bg-gray-800/50 rounded-md border border-gray-700">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center">
          <BookOpenCheck className="h-4 w-4 mr-2" />
          <span className="text-sm text-gray-400">Steam Review</span>
        </div>
        {review.language && review.language !== 'english' && (
          <span className="text-xs px-2 py-0.5 bg-gray-700 rounded text-gray-300">
            {review.language.toUpperCase()}
          </span>
        )}
      </div>
      
      <SafeReviewContent content={review.review} />
      
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
        </div>
      </div>
    </div>
  );
};

export default GameReviewCard;
