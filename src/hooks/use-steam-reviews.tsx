
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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

interface SteamReviewsData {
  reviews: SteamReview[];
  query_summary: {
    num_reviews: number;
    review_score: number;
    review_score_desc: string;
    total_positive: number;
    total_negative: number;
    total_reviews: number;
  };
  fallbackLevel: number;
}

/**
 * Custom hook for fetching a positive Steam review for a game
 */
const useSteamReviews = (gameId: number | null) => {
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [fallbackLevel, setFallbackLevel] = useState(0);
  const [shouldFetch, setShouldFetch] = useState(false); // New state to control fetching

  // The main query to fetch reviews using the edge function
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['steamReviews', gameId, fallbackLevel],
    queryFn: async () => {
      if (!gameId) return null;

      try {
        console.log(`Calling fetch-steam-reviews for game ${gameId}, fallback level: ${fallbackLevel}`);
        
        const { data: responseData, error } = await supabase.functions.invoke('fetch-steam-reviews', {
          body: { gameId, fallbackLevel }
        });

        if (error) {
          throw new Error(`Edge function error: ${error.message}`);
        }

        if (!responseData.success) {
          if (responseData.needsFallback && fallbackLevel < 2) {
            // Trigger next fallback level
            setFallbackLevel(responseData.nextFallbackLevel);
            return null;
          }
          throw new Error(responseData.message || 'Failed to fetch reviews');
        }

        return responseData.data as SteamReviewsData;
      } catch (err) {
        console.error('Steam reviews fetch error:', err);
        throw err;
      }
    },
    enabled: !!gameId && shouldFetch, // Only fetch when explicitly triggered
    retry: 1,
    retryDelay: 1000,
  });

  // Get the current review based on index
  const currentReview = data?.reviews && data.reviews.length > 0 
    ? data.reviews[currentReviewIndex % data.reviews.length] 
    : null;
  
  // Function to trigger fetching reviews
  const fetchReviews = () => {
    setShouldFetch(true);
  };
  
  // Function to cycle to the next review
  const cycleNextReview = () => {
    if (data?.reviews && data.reviews.length > 0) {
      setCurrentReviewIndex((prevIndex) => (prevIndex + 1) % data.reviews.length);
    }
  };

  // Function to try another fallback level
  const tryAnotherFallback = () => {
    if (fallbackLevel < 2) {
      setFallbackLevel(prev => prev + 1);
      setCurrentReviewIndex(0); // Reset review index for new data
    } else {
      toast.error("No reviews available", {
        description: "We couldn't find any glowing words for this game.",
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
    hasFetched: shouldFetch && !isLoading, // Whether we've attempted to fetch
    fetchReviews,
    cycleNextReview,
    tryAnotherFallback,
    fallbackLevel,
    totalReviews: data?.query_summary?.total_reviews || 0
  };
};

export default useSteamReviews;
