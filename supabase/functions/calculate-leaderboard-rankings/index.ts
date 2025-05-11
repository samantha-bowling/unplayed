
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

// Constants
const BATCH_SIZE = 50; // Process 50 users at a time to avoid memory issues

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

    // Get the previous snapshot date (for calculating rank changes)
    const { data: previousSnapshotData, error: previousError } = await supabase
      .from('leaderboard_snapshots')
      .select('snapshot_date')
      .order('snapshot_date', { ascending: false })
      .limit(1);

    if (previousError) throw previousError;

    const previousSnapshotDate = previousSnapshotData && previousSnapshotData.length > 0 
      ? previousSnapshotData[0].snapshot_date 
      : null;

    console.log(`Previous snapshot date: ${previousSnapshotDate || 'none'}`);

    // Process users in batches
    const batches = [];
    for (let i = 0; i < eligibleUsers.length; i += BATCH_SIZE) {
      batches.push(eligibleUsers.slice(i, i + BATCH_SIZE));
    }

    // Process batches in sequence
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const userBatch = batches[batchIndex];
      console.log(`Processing batch ${batchIndex + 1}/${batches.length} (${userBatch.length} users)`);
      
      // Process each user in the batch
      const leaderboardEntries = [];
      
      for (const user of userBatch) {
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

          // Get previous rankings for this user
          const { data: previousEntry } = await supabase
            .from('leaderboard_snapshots')
            .select('ranking')
            .eq('user_id', user.id)
            .eq('snapshot_date', previousSnapshotDate)
            .limit(1);

          // Store previous ranking if it exists
          const previousRanking = previousEntry && previousEntry.length > 0 ? previousEntry[0].ranking : null;

          // Add to batch for upsert
          leaderboardEntries.push({
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
            previous_ranking: previousRanking, // Store the previous ranking
          });
        } catch (err) {
          console.error(`Error processing user ${user.id}:`, err);
          // Continue with next user
        }
      }

      // Bulk upsert all leaderboard entries for this batch
      if (leaderboardEntries.length > 0) {
        const { error: upsertError } = await supabase
          .from('leaderboard_snapshots')
          .upsert(leaderboardEntries);

        if (upsertError) {
          console.error(`Error upserting batch ${batchIndex + 1}:`, upsertError);
        } else {
          console.log(`Successfully upserted ${leaderboardEntries.length} leaderboard entries for batch ${batchIndex + 1}`);
        }
      }
    }
    
    // Update rankings with a direct SQL query for better performance
    // For dust score rankings
    const { error: dustRankError } = await supabase.rpc('update_leaderboard_dust_rankings', { snapshot_timestamp: timestamp });
    if (dustRankError) {
      console.error('Error updating dust rankings:', dustRankError);
    }
    
    // For clean score rankings
    const { error: cleanRankError } = await supabase.rpc('update_leaderboard_clean_rankings', { snapshot_timestamp: timestamp });
    if (cleanRankError) {
      console.error('Error updating clean rankings:', cleanRankError);
    }

    // Calculate rank changes by comparing new rankings with previous ones
    if (previousSnapshotDate) {
      console.log('Calculating rank changes...');
      
      // We need to use raw SQL for this more complex update
      const { error: rankChangeError } = await supabase.rpc('update_rank_changes', { 
        current_snapshot: timestamp,
        previous_snapshot: previousSnapshotDate 
      });
      
      if (rankChangeError) {
        console.error('Error calculating rank changes:', rankChangeError);
        
        // Fallback: manually update rank changes
        console.log('Using fallback method to calculate rank changes...');
        
        const { data: currentEntries } = await supabase
          .from('leaderboard_snapshots')
          .select('id, user_id, ranking, previous_ranking')
          .eq('snapshot_date', timestamp);
          
        if (currentEntries) {
          for (const entry of currentEntries) {
            if (entry.previous_ranking !== null && entry.ranking !== null) {
              const rankChange = entry.previous_ranking - entry.ranking; // Positive means improved rank
              
              await supabase
                .from('leaderboard_snapshots')
                .update({ rank_change: rankChange })
                .eq('id', entry.id);
            }
          }
          console.log('Finished fallback rank change calculations');
        }
      } else {
        console.log('Rank changes calculated successfully');
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
