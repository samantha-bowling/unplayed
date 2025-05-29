import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import * as hltb from 'https://esm.sh/howlongtobeat@1.8.0';

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create Supabase client
const supabaseUrl = 'https://gwmygthanyycveyqqspr.supabase.co';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Create HowLongToBeat service
const hltbService = new hltb.HowLongToBeatService();

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Get the request body
    const { game_id, title } = await req.json();
    
    // Validate inputs
    if (!game_id || !title || typeof game_id !== 'number' || typeof title !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid input. Requires game_id (number) and title (string).' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[fetch-hltb-estimate] Processing request for game_id: ${game_id}, title: "${title}"`);
    
    // First check if we already have this game in our database
    const { data: existingEstimate } = await supabase
      .from('game_estimates')
      .select('*')
      .eq('game_id', game_id)
      .single();
      
    if (existingEstimate) {
      console.log(`[fetch-hltb-estimate] Found existing estimate for game_id: ${game_id}`);
      return new Response(JSON.stringify(existingEstimate), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Search HLTB for the game
    console.log(`[fetch-hltb-estimate] Searching HLTB for: "${title}"`);
    const results = await hltbService.search(title);
    
    if (!results || results.length === 0) {
      console.log(`[fetch-hltb-estimate] No results found for: "${title}"`);
      // Store a record with null values so we don't keep searching for this game
      const { error } = await supabase
        .from('game_estimates')
        .insert({
          game_id,
          hltb_title: null,
          main_hours: null,
          main_extra_hours: null,
          completionist_hours: null,
          confidence: 0,
        });
        
      if (error) {
        console.error(`[fetch-hltb-estimate] Error storing null estimate: ${error.message}`);
      }
      
      return new Response(JSON.stringify({ 
        game_id,
        hltb_title: null,
        main_hours: null,
        main_extra_hours: null,
        completionist_hours: null,
        confidence: 0,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Calculate similarity scores for better matching
    const bestMatch = results[0]; // Simple approach: just take the first result
    const confidence = 1.0; // We'll implement better confidence scoring in the future
    
    // Parse the data we need
    const gameData = {
      game_id,
      hltb_title: bestMatch.name,
      main_hours: bestMatch.gameplayMain / 3600, // Convert seconds to hours
      main_extra_hours: bestMatch.gameplayMainExtra / 3600,
      completionist_hours: bestMatch.gameplayCompletionist / 3600,
      confidence,
    };
    
    console.log(`[fetch-hltb-estimate] Found match: "${bestMatch.name}" with main_hours: ${gameData.main_hours}`);
    
    // Store the estimate in our database
    const { error } = await supabase
      .from('game_estimates')
      .insert(gameData);
      
    if (error) {
      console.error(`[fetch-hltb-estimate] Error storing estimate: ${error.message}`);
      throw new Error(`Error storing game estimate: ${error.message}`);
    }
    
    // Return the estimate
    return new Response(JSON.stringify(gameData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error(`[fetch-hltb-estimate] Error: ${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
