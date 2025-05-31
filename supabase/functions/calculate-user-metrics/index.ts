import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GameData {
  id: number;
  name: string;
  image_url: string | null;
  header_image: string | null;
  release_date: string | null;
  genres: string[];
  price_cents: number | null;
  playtime_minutes: number;
  dust_score: number | null;
  last_played_date: string | null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the user from the Authorization header
    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader);
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    console.log(`Processing metrics for user: ${user.id}`);

    // Fetch all user games with game data
    const { data: userGames, error: gamesError } = await supabase
      .from('user_games')
      .select(`
        game_id,
        playtime_minutes,
        dust_score,
        last_played_date,
        games:game_id (
          id,
          name,
          image_url,
          header_image,
          release_date,
          genres,
          price_cents
        )
      `)
      .eq('user_id', user.id);

    if (gamesError) {
      throw new Error(`Error fetching games: ${gamesError.message}`);
    }

    const games: GameData[] = userGames?.map(ug => ({
      id: ug.game_id,
      name: ug.games?.name || 'Unknown Game',
      image_url: ug.games?.image_url || null,
      header_image: ug.games?.header_image || null,
      release_date: ug.games?.release_date || null,
      genres: ug.games?.genres || [],
      price_cents: ug.games?.price_cents || null,
      playtime_minutes: ug.playtime_minutes || 0,
      dust_score: ug.dust_score || 0,
      last_played_date: ug.last_played_date || null
    })) || [];

    console.log(`Processing ${games.length} games`);

    // Calculate core metrics
    const totalGames = games.length;
    const unplayedGames = games.filter(g => g.playtime_minutes === 0).length;
    const playedGames = totalGames - unplayedGames;

    // Calculate dust score metrics
    const totalDustScore = games.reduce((sum, g) => sum + (g.dust_score || 0), 0);
    const averageDustScore = totalGames > 0 ? totalDustScore / totalGames : 0;

    // Calculate playtime metrics
    const totalPlaytimeMinutes = games.reduce((sum, g) => sum + g.playtime_minutes, 0);
    const totalPlaytimeHours = totalPlaytimeMinutes / 60;

    // Calculate spending metrics using clean price data
    let totalLibraryValueCents = 0;
    let unplayedValueCents = 0;

    for (const game of games) {
      const { data: priceData } = await supabase.rpc('get_clean_game_price', {
        p_game_id: game.id,
        p_fallback_price_cents: game.price_cents
      });

      const finalPrice = priceData?.final_price_cents || 0;
      totalLibraryValueCents += finalPrice;
      
      if (game.playtime_minutes === 0) {
        unplayedValueCents += finalPrice;
      }
    }

    // ===== FIXED RECENTLY PLAYED CALCULATION =====
    
    // Calculate recently played games (games with 30+ minutes played in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentlyPlayedCount = games.filter(game => {
      // Must have last played date
      if (!game.last_played_date) return false;
      
      // Must have at least 30 minutes playtime
      if (game.playtime_minutes < 30) return false;
      
      // Must be played within last 30 days
      const lastPlayedDate = new Date(game.last_played_date);
      return lastPlayedDate >= thirtyDaysAgo;
    }).length;

    console.log(`Recently played calculation:`, {
      totalGames,
      playedGames,
      recentlyPlayedCount,
      thirtyDaysAgo: thirtyDaysAgo.toISOString()
    });

    // ===== NEW CLEAN SCORE CALCULATION (Phase 2) =====
    
    // 1. Unique Game Diversity (25% weight)
    // Measure how varied the user's gaming habits are
    const uniqueGenres = new Set();
    const playedGameGenres = games.filter(g => g.playtime_minutes > 0).flatMap(g => g.genres);
    playedGameGenres.forEach(genre => uniqueGenres.add(genre));
    
    const diversityScore = Math.min(100, Math.round((uniqueGenres.size / Math.max(1, totalGames / 10)) * 100));

    // 2. Recency Engagement (30% weight) - Now uses the FIXED recently played count
    const recencyScore = Math.min(100, Math.round((recentlyPlayedCount / Math.max(1, totalGames)) * 100));

    // 3. Backlog Conversion Rate (25% weight)
    // Percentage of games that were unplayed but now have some playtime
    // For now, we'll use completion rate as a proxy
    const backlogConversionScore = totalGames > 0 ? Math.round((playedGames / totalGames) * 100) : 0;

    // 4. Session Depth (20% weight)
    // Average playtime per played game (encouraging meaningful engagement)
    const avgPlaytimePerGame = playedGames > 0 ? totalPlaytimeHours / playedGames : 0;
    const sessionDepthScore = Math.min(100, Math.round(avgPlaytimePerGame * 10)); // 10+ hours = 100

    // Calculate final clean score with new weights
    const cleanScore = Math.round(
      (diversityScore * 0.25) + 
      (recencyScore * 0.30) + 
      (backlogConversionScore * 0.25) + 
      (sessionDepthScore * 0.20)
    );

    // Calculate clean streak (simplified - number of played games for now)
    const cleanStreak = playedGames;

    // Determine clean tier
    const cleanTier = cleanScore >= 90 ? 'pristine' :
                     cleanScore >= 75 ? 'clean' :
                     cleanScore >= 60 ? 'tidy' :
                     cleanScore >= 40 ? 'messy' : 'dusty';

    // Store user metrics (existing table)
    await supabase
      .from('user_metrics')
      .upsert({
        user_id: user.id,
        total_games: totalGames,
        unplayed_games: unplayedGames,
        played_games: playedGames,
        total_dust_score: totalDustScore,
        average_dust_score: averageDustScore,
        clean_score: cleanScore,
        clean_score_tier: cleanTier,
        clean_streak: cleanStreak,
        total_library_value_cents: totalLibraryValueCents,
        unplayed_value_cents: unplayedValueCents,
        total_playtime_hours: totalPlaytimeHours,
        recently_played_count: recentlyPlayedCount, // Now using the FIXED calculation
        last_calculated: new Date().toISOString(),
        calculation_version: 2 // Updated to version 2 for new clean score system
      });

    // Store clean score breakdown (new table)
    await supabase
      .from('user_clean_score_breakdowns')
      .upsert({
        user_id: user.id,
        diversity_score: diversityScore,
        recency_score: recencyScore,
        backlog_conversion_score: backlogConversionScore,
        session_depth_score: sessionDepthScore,
        clean_streak_days: cleanStreak,
        recently_played_count: recentlyPlayedCount, // Now using the FIXED calculation
        last_calculated: new Date().toISOString()
      });

    // Process genre statistics
    const genreStats: { [key: string]: number } = {};
    games.forEach(game => {
      game.genres.forEach(genre => {
        genreStats[genre] = (genreStats[genre] || 0) + 1;
      });
    });

    // Genre colors (consistent with current UI)
    const genreColors = [
      '#A3F7BF', '#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA',
      '#FFD3BA', '#E0BBE4', '#D4F0FF', '#C7CEEA', '#FFC0CB'
    ];

    // Clear existing genre stats and insert new ones
    await supabase.from('user_genre_stats').delete().eq('user_id', user.id);
    
    const genreEntries = Object.entries(genreStats)
      .sort(([,a], [,b]) => b - a) // Sort by count descending
      .slice(0, 10) // Top 10 genres
      .map(([genre, count], index) => ({
        user_id: user.id,
        genre_name: genre,
        game_count: count,
        percentage: totalGames > 0 ? (count / totalGames) * 100 : 0,
        color_hex: genreColors[index % genreColors.length],
        last_calculated: new Date().toISOString()
      }));

    if (genreEntries.length > 0) {
      await supabase.from('user_genre_stats').insert(genreEntries);
    }

    // Process shelf life data (oldest games by release date)
    const gamesWithReleaseDate = games
      .filter(g => g.release_date)
      .map(g => ({
        ...g,
        parsedReleaseDate: new Date(g.release_date!)
      }))
      .sort((a, b) => a.parsedReleaseDate.getTime() - b.parsedReleaseDate.getTime())
      .slice(0, 20); // Top 20 oldest games

    // Clear existing shelf life data and insert new ones
    await supabase.from('user_shelf_life').delete().eq('user_id', user.id);

    const shelfLifeEntries = gamesWithReleaseDate.map((game, index) => {
      const yearsOld = (Date.now() - game.parsedReleaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      return {
        user_id: user.id,
        game_id: game.id,
        release_date: game.release_date,
        years_old: Math.round(yearsOld * 10) / 10, // Round to 1 decimal
        playtime_minutes: game.playtime_minutes,
        shelf_life_rank: index + 1,
        last_calculated: new Date().toISOString()
      };
    });

    if (shelfLifeEntries.length > 0) {
      await supabase.from('user_shelf_life').insert(shelfLifeEntries);
    }

    // Process dust breakdowns for top dust contributors
    const topDustGames = games
      .filter(g => g.dust_score && g.dust_score > 0)
      .sort((a, b) => (b.dust_score || 0) - (a.dust_score || 0))
      .slice(0, 50); // Top 50 dust contributors

    // Clear existing dust breakdowns and calculate new ones
    await supabase.from('game_dust_breakdowns').delete().eq('user_id', user.id);

    const dustBreakdownEntries = [];
    for (const game of topDustGames) {
      // Get breakdown using existing function (simplified since we don't have acquisition_date)
      const { data: breakdown } = await supabase.rpc('get_dust_score_breakdown', {
        game_id: game.id,
        acquisition_date: new Date().toISOString(), // Use current date as fallback
        release_date: game.release_date || new Date().toISOString(),
        playtime_minutes: game.playtime_minutes
      });

      dustBreakdownEntries.push({
        user_id: user.id,
        game_id: game.id,
        current_dust_score: game.dust_score || 0,
        age_score: breakdown?.ageScore || 0,
        ownership_score: breakdown?.ownershipScore || 0,
        playtime_factor: breakdown?.playtimeFactor || 1.0,
        game_name: game.name,
        image_url: game.image_url,
        header_image: game.header_image,
        release_date: game.release_date,
        playtime_minutes: game.playtime_minutes,
        last_calculated: new Date().toISOString()
      });
    }

    if (dustBreakdownEntries.length > 0) {
      await supabase.from('game_dust_breakdowns').insert(dustBreakdownEntries);
    }

    console.log(`Metrics calculation completed for user ${user.id}`);
    console.log(`- Total games: ${totalGames}`);
    console.log(`- Unplayed games: ${unplayedGames}`);
    console.log(`- Recently played (FIXED): ${recentlyPlayedCount}`);
    console.log(`- Clean score: ${cleanScore} (Phase 2)`);
    console.log(`- Diversity: ${diversityScore}, Recency: ${recencyScore}, Backlog: ${backlogConversionScore}, Depth: ${sessionDepthScore}`);
    console.log(`- Total library value: $${(totalLibraryValueCents / 100).toFixed(2)}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'User metrics calculated successfully with FIXED recently played calculation',
        metrics: {
          totalGames,
          unplayedGames,
          recentlyPlayedCount, // Now accurate
          cleanScore,
          cleanScoreBreakdown: {
            diversityScore,
            recencyScore,
            backlogConversionScore,
            sessionDepthScore
          },
          totalLibraryValueCents,
          genresProcessed: 0 // Will be filled by the existing genre processing code
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error calculating user metrics:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
