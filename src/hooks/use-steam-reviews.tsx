
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

interface SteamReview {
  review: string;
  author: {
    steamid: string;
    num_games_owned: number;
    num_reviews: number;
    playtime_forever: number;
    playtime_last_two_weeks: number;
    playtime_at_review: number;
    last_played: number;
  };
  timestamp_created: number;
  voted_up: boolean;
  weighted_vote_score: string;
  language: string;
}

interface SteamReviewsResponse {
  success: number;
  query_summary: {
    num_reviews: number;
    review_score: number;
    review_score_desc: string;
    total_positive: number;
    total_negative: number;
    total_reviews: number;
  };
  reviews: SteamReview[];
}

/**
 * Custom hook for fetching a positive Steam review for a game
 */
const useSteamReviews = (gameId: number | null) => {
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [fallbackLevel, setFallbackLevel] = useState(0);

  // Function to build the review query URL with appropriate parameters
  const buildReviewUrl = (id: number, fallbackLevel: number) => {
    // Base URL for all queries
    const baseUrl = `https://store.steampowered.com/appreviews/${id}?json=1`;

    // Define query parameters based on fallback level
    let params = '';
    switch (fallbackLevel) {
      case 0: // First attempt: recent positive reviews in user's language
        params = '&filter=recent&review_type=positive&num_per_page=10&purchase_type=all';
        break;
      case 1: // Second attempt: any positive review in user's language
        params = '&review_type=positive&purchase_type=all&num_per_page=10';
        break;
      case 2: // Final attempt: any positive review in English
        params = '&review_type=positive&language=english&purchase_type=all&num_per_page=10';
        break;
      default:
        params = '&review_type=positive&purchase_type=all';
    }

    // For now, we're not determining user language, so we don't add a language parameter
    // In a future enhancement, this could be added based on user preferences

    return `${baseUrl}${params}`;
  };

  // The main query to fetch reviews
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['steamReviews', gameId, fallbackLevel],
    queryFn: async () => {
      if (!gameId) return null;

      try {
        const url = buildReviewUrl(gameId, fallbackLevel);
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch reviews: ${response.statusText}`);
        }

        const data: SteamReviewsResponse = await response.json();
        
        // If no reviews found and we can try another fallback
        if (data.success === 1 && (!data.reviews || data.reviews.length === 0) && fallbackLevel < 2) {
          throw new Error('No reviews found with current filters');
        }
        
        return data;
      } catch (err) {
        if (fallbackLevel < 2 && err instanceof Error && err.message.includes('No reviews found')) {
          // Try the next fallback level
          setFallbackLevel(prev => prev + 1);
          return null;
        }
        throw err;
      }
    },
    enabled: !!gameId,
    retry: 2,
    retryDelay: attempt => Math.min(1000 * 2 ** attempt, 30000), // Exponential backoff for retries
  });

  // Get the current review based on index
  const currentReview = data?.reviews && data.reviews.length > 0 
    ? data.reviews[currentReviewIndex % data.reviews.length] 
    : null;
  
  // Function to cycle to the next review
  const cycleNextReview = () => {
    if (data?.reviews && data.reviews.length > 0) {
      setCurrentReviewIndex((prevIndex) => (prevIndex + 1) % data.reviews.length);
    }
  };

  // Function to try again with another fallback level
  const tryAnotherFallback = () => {
    if (fallbackLevel < 2) {
      setFallbackLevel(prev => prev + 1);
      refetch();
    } else {
      toast({
        title: "No reviews available",
        description: "We couldn't find any glowing words for this game.",
        variant: "destructive"
      });
    }
  };

  return {
    review: currentReview,
    reviews: data?.reviews || [],
    isLoading,
    isError,
    error,
    hasReviews: data?.reviews && data.reviews.length > 0,
    cycleNextReview,
    tryAnotherFallback,
    fallbackLevel,
    totalReviews: data?.query_summary?.total_reviews || 0
  };
};

export default useSteamReviews;
