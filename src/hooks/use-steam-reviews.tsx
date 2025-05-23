
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
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Function to build the review query URL with appropriate parameters
  const buildReviewUrl = (id: number, fallbackLevel: number) => {
    const baseUrl = `https://store.steampowered.com/appreviews/${id}?json=1`;

    let params = '';
    switch (fallbackLevel) {
      case 0: // First attempt: recent positive reviews
        params = '&filter=recent&review_type=positive&num_per_page=10&purchase_type=all';
        break;
      case 1: // Second attempt: any positive review
        params = '&review_type=positive&purchase_type=all&num_per_page=10';
        break;
      case 2: // Final attempt: positive reviews in English
        params = '&review_type=positive&language=english&purchase_type=all&num_per_page=10';
        break;
      default:
        params = '&review_type=positive&purchase_type=all';
    }

    return `${baseUrl}${params}`;
  };

  // Enhanced fetch function with timeout and better error handling
  const fetchWithTimeout = async (url: string, timeout = 10000): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        },
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      throw error;
    }
  };

  // The main query to fetch reviews
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['steamReviews', gameId, fallbackLevel],
    queryFn: async () => {
      if (!gameId) return null;

      setFetchError(null);

      try {
        const url = buildReviewUrl(gameId, fallbackLevel);
        console.log(`Fetching Steam reviews from: ${url}`);
        
        const response = await fetchWithTimeout(url);
        
        if (!response.ok) {
          throw new Error(`Steam API returned ${response.status}: ${response.statusText}`);
        }

        const data: SteamReviewsResponse = await response.json();
        
        // Check if we got a valid response
        if (data.success !== 1) {
          throw new Error('Steam API returned unsuccessful response');
        }
        
        // If no reviews found and we can try another fallback
        if (!data.reviews || data.reviews.length === 0) {
          if (fallbackLevel < 2) {
            console.log(`No reviews found at level ${fallbackLevel}, trying next fallback`);
            setFallbackLevel(prev => prev + 1);
            return null; // This will trigger a refetch with new fallback level
          } else {
            console.log('No reviews found at any fallback level');
            return { success: 1, reviews: [], query_summary: data.query_summary };
          }
        }
        
        console.log(`Found ${data.reviews.length} reviews for game ${gameId}`);
        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        console.error('Steam review fetch error:', errorMessage);
        
        // Handle CORS errors specifically
        if (errorMessage.includes('CORS') || errorMessage.includes('Network request failed')) {
          setFetchError('Unable to fetch reviews due to browser security restrictions');
        } else if (errorMessage.includes('timed out')) {
          setFetchError('Request timed out - Steam servers may be slow');
        } else if (fallbackLevel < 2) {
          // Try next fallback level for other errors
          console.log(`Error at level ${fallbackLevel}, trying next fallback: ${errorMessage}`);
          setFallbackLevel(prev => prev + 1);
          return null;
        } else {
          setFetchError(`Failed to fetch reviews: ${errorMessage}`);
        }
        
        throw err;
      }
    },
    enabled: !!gameId,
    retry: (failureCount, error) => {
      // Only retry on network errors, not on CORS or API errors
      const errorMessage = error?.message || '';
      if (errorMessage.includes('CORS') || errorMessage.includes('Steam API returned')) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: attempt => Math.min(1000 * 2 ** attempt, 5000),
  });

  // Get the current review based on index
  const currentReview = data?.reviews && data.reviews.length > 0 
    ? data.reviews[currentReviewIndex % data.reviews.length] 
    : null;
  
  // Function to cycle to the next review
  const cycleNextReview = () => {
    if (data?.reviews && data.reviews.length > 0) {
      setCurrentReviewIndex((prevIndex) => (prevIndex + 1) % data.reviews.length);
    } else {
      // Try to refetch if we don't have reviews
      refetch();
    }
  };

  // Function to reset and try again
  const retryFetch = () => {
    setFallbackLevel(0);
    setCurrentReviewIndex(0);
    setFetchError(null);
    refetch();
  };

  return {
    review: currentReview,
    reviews: data?.reviews || [],
    isLoading,
    isError: isError || !!fetchError,
    error: fetchError || error?.message,
    hasReviews: data?.reviews && data.reviews.length > 0,
    cycleNextReview,
    retryFetch,
    fallbackLevel,
    totalReviews: data?.query_summary?.total_reviews || 0,
    reviewScore: data?.query_summary?.review_score_desc || null,
  };
};

export default useSteamReviews;
