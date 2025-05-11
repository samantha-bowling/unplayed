
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.20.0';

// Set up the Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Handle requests
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // This function needs to be scheduled to run periodically
    const timestamp = new Date().toISOString();
    console.log(`Starting leaderboard calculation at ${timestamp}`);

    // Get all users who opted into the leaderboard (public or anonymous)
    const { data: eligibleUsers, error: userError } = await supabase
      .from('users')
      .select('id, steam_name, leaderboard_visibility')
      .not('leaderboard_visibility', 'eq', 'off');

    if (userError) throw userError;

    console.log(`Found ${eligibleUsers.length} eligible users`);

    // Process each user
    for (const user of eligibleUsers) {
      try {
        // Get user's games
        const { data: userGames, error: gamesError } = await supabase
          .from('user_games')
          .select(`
            id, 
            playtime_minutes, 
            dust_score,
            hidden,
            games:game_id (
              id, 
              price_cents
            )
          `)
          .eq('user_id', user.id)
          .eq('hidden', false);

        if (gamesError) throw gamesError;

        // Calculate user stats
        const totalGames = userGames.length;
        const unplayedGames = userGames.filter(game => !game.playtime_minutes || game.playtime_minutes < 30).length;
        const playedGames = totalGames - unplayedGames;
        const libraryValueCents = userGames.reduce((sum, game) => {
          return sum + (game.games?.price_cents || 0);
        }, 0);

        // Calculate average dust score (dust score / game)
        const dustScore = userGames.reduce((sum, game) => sum + (game.dust_score || 0), 0);
        
        // Calculate clean score (percentage of games played)
        const cleanScore = totalGames > 0 ? Math.round((playedGames / totalGames) * 100) : 0;

        // Create leaderboard snapshot
        await supabase
          .from('leaderboard_snapshots')
          .upsert({
            user_id: user.id,
            snapshot_date: timestamp,
            dust_score: dustScore,
            clean_score: cleanScore,
            total_games: totalGames,
            played_games: playedGames,
            unplayed_games: unplayedGames,
            library_value_cents: libraryValueCents,
            username: user.leaderboard_visibility === 'public' ? user.steam_name : null,
            is_anonymous: user.leaderboard_visibility === 'anonymous',
          });

        console.log(`Processed user ${user.id}: dust=${dustScore}, clean=${cleanScore}, games=${totalGames}`);
      } catch (err) {
        console.error(`Error processing user ${user.id}:`, err);
        // Continue with next user
      }
    }

    // Update rankings for dust score
    const { data: dustRankings, error: dustRankError } = await supabase
      .from('leaderboard_snapshots')
      .select('id, dust_score')
      .eq('snapshot_date', timestamp)
      .order('dust_score', { ascending: false });

    if (!dustRankError && dustRankings) {
      for (let i = 0; i < dustRankings.length; i++) {
        await supabase
          .from('leaderboard_snapshots')
          .update({ ranking: i + 1 })
          .eq('id', dustRankings[i].id);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      processed: eligibleUsers.length,
      timestamp 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    console.error('Error calculating leaderboard:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
