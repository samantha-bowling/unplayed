
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { gameId, fallbackLevel = 0 } = await req.json();

    if (!gameId) {
      throw new Error('Game ID is required');
    }

    console.log(`Fetching Steam reviews for game ${gameId}, fallback level: ${fallbackLevel}`);

    // Build the review query URL with appropriate parameters
    const baseUrl = `https://store.steampowered.com/appreviews/${gameId}?json=1`;
    
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

    const url = `${baseUrl}${params}`;
    console.log(`Requesting Steam API: ${url}`);

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Steam API request failed: ${response.statusText}`);
    }

    const data: SteamReviewsResponse = await response.json();
    
    console.log(`Steam API response: success=${data.success}, reviews count=${data.reviews?.length || 0}`);

    // Check if we got reviews or need to try next fallback
    if (data.success === 1 && (!data.reviews || data.reviews.length === 0) && fallbackLevel < 2) {
      console.log(`No reviews found at fallback level ${fallbackLevel}, suggesting next level`);
      return new Response(JSON.stringify({ 
        success: false, 
        needsFallback: true, 
        nextFallbackLevel: fallbackLevel + 1,
        message: 'No reviews found with current filters'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Return the successful response
    return new Response(JSON.stringify({
      success: true,
      data: {
        reviews: data.reviews || [],
        query_summary: data.query_summary,
        fallbackLevel
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in fetch-steam-reviews function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
