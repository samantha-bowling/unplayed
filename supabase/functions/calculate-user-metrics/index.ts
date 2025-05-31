
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
  metacritic_score: number | null;
  playtime_minutes: number;
  dust_score: number | null;
  last_played_date: string | null;
}

// Enhanced 5-factor dust score calculation
function calculateEnhancedDustScore(
  releaseDate: string | null,
  playtimeMinutes: number,
  priceCents: number = 0,
  genres: string[] = [],
  metacriticScore: number | null = null
): {
  qualityScore: number;
  priceScore: number;
  ageScore: number;
  genreScore: number;
  playtimeFactor: number;
  totalScore: number;
} {
  // 1. Age Score (based on release date)
  const ageScore = (() => {
    if (!releaseDate) return 15;
    const release = new Date(releaseDate);
    const now = new Date();
    const yearsOld = (now.getTime() - release.getTime()) / (1000 * 60 * 60 * 24 * 365);
    
    if (yearsOld >= 15) return 30;
    if (yearsOld >= 10) return 25;
    if (yearsOld >= 5) return 20;
    if (yearsOld >= 2) return 15;
    if (yearsOld >= 1) return 10;
    return 5;
  })();

  // 2. Quality Score (high quality = high dust when unplayed)
  const qualityScore = (() => {
    if (!metacriticScore) return 10;
    if (metacriticScore >= 90) return 20;
    if (metacriticScore >= 80) return 17;
    if (metacriticScore >= 70) return 14;
    if (metacriticScore >= 60) return 10;
    return 6;
  })();

  // 3. Price Score (higher price = higher dust potential)
  const priceScore = (() => {
    if (priceCents >= 6000) return 15;
    if (priceCents >= 4000) return 12;
    if (priceCents >= 2000) return 10;
    if (priceCents >= 1000) return 8;
    if (priceCents > 0) return 5;
    if (priceCents === 0) return 2;
    return 7;
  })();

  // 4. Genre Score
  const genreScore = (() => {
    if (!genres || genres.length === 0) return 7;
    
    const dustyGenres = ['Strategy', 'Simulation', 'RPG', 'Turn-Based Strategy', 'Grand Strategy'];
    const quickGenres = ['Action', 'Arcade', 'Racing', 'Sports', 'Fighting'];
    
    const hasDustyGenre = genres.some(genre => 
      dustyGenres.some(dusty => genre.toLowerCase().includes(dusty.toLowerCase()))
    );
    const hasQuickGenre = genres.some(genre => 
      quickGenres.some(quick => genre.toLowerCase().includes(quick.toLowerCase()))
    );
    
    if (hasDustyGenre) return 10;
    if (hasQuickGenre) return 5;
    return 7;
  })();

  // 5. Playtime Factor
  const playtimeFactor = (() => {
    const minutes = playtimeMinutes || 0;
    if (minutes === 0) return 1.0;
    if (minutes < 30) return 0.9;
    if (minutes < 120) return 0.6;
    if (minutes < 360) return 0.3;
    return 0.1;
  })();

  // Calculate total dust score
  const baseScore = ageScore + qualityScore + priceScore + genreScore;
  const totalScore = Math.max(1, Math.min(100, Math.floor(baseScore * playtimeFactor)));

  return {
    qualityScore,
    priceScore,
    ageScore,
    genreScore,
    playtimeFactor,
    totalScore
  };
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

    console.log(`Processing enhanced metrics for user: ${user.id}`);

    // Fetch ALL user games with game data (removed slice limit)
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
          price_cents,
          metacritic_score
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
      metacritic_score: ug.games?.metacritic_score || null,
      playtime_minutes: ug.playtime_minutes || 0,
      dust_score: ug.dust_score || 0,
      last_played_date: ug.last_played_date || null
    })) || [];

    console.log(`Processing ${games.length} games with enhanced 5-factor scoring`);

    // Provide user feedback for large libraries
    let processingMessage = 'Enhanced dust scores calculated successfully';
    if (games.length >= 500) {
      processingMessage = `Processing large library of ${games.length} games completed with enhanced scoring`;
    } else if (games.length >= 100) {
      processingMessage = `Processing ${games.length} games completed with enhanced scoring`;
    }

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

    // Calculate recently played games (simplified)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentlyPlayedCount = games.filter(game => {
      if (!game.last_played_date) return false;
      const lastPlayedDate = new Date(game.last_played_date);
      return lastPlayedDate >= thirtyDaysAgo;
    }).length;

    console.log(`Recently played calculation: ${recentlyPlayedCount} games`);

    // Enhanced clean score calculation
    const uniqueGenres = new Set();
    const playedGameGenres = games.filter(g => g.playtime_minutes > 0).flatMap(g => g.genres);
    playedGameGenres.forEach(genre => uniqueGenres.add(genre));
    
    const diversityScore = Math.min(100, Math.round((uniqueGenres.size / Math.max(1, totalGames / 10)) * 100));
    const recencyScore = Math.min(100, Math.round((recentlyPlayedCount / Math.max(1, totalGames)) * 100));
    const backlogConversionScore = totalGames > 0 ? Math.round((playedGames / totalGames) * 100) : 0;
    const avgPlaytimePerGame = playedGames > 0 ? totalPlaytimeHours / playedGames : 0;
    const sessionDepthScore = Math.min(100, Math.round(avgPlaytimePerGame * 10));

    const cleanScore = Math.round(
      (diversityScore * 0.25) + 
      (recencyScore * 0.30) + 
      (backlogConversionScore * 0.25) + 
      (sessionDepthScore * 0.20)
    );

    const cleanStreak = playedGames;
    const cleanTier = cleanScore >= 90 ? 'pristine' :
                     cleanScore >= 75 ? 'clean' :
                     cleanScore >= 60 ? 'tidy' :
                     cleanScore >= 40 ? 'messy' : 'dusty';

    // Store user metrics
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
        recently_played_count: recentlyPlayedCount,
        last_calculated: new Date().toISOString(),
        calculation_version: 3
      });

    // Store clean score breakdown
    await supabase
      .from('user_clean_score_breakdowns')
      .upsert({
        user_id: user.id,
        diversity_score: diversityScore,
        recency_score: recencyScore,
        backlog_conversion_score: backlogConversionScore,
        session_depth_score: sessionDepthScore,
        clean_streak_days: cleanStreak,
        recently_played_count: recentlyPlayedCount,
        last_calculated: new Date().toISOString()
      });

    // Process genre statistics
    const genreStats: { [key: string]: number } = {};
    games.forEach(game => {
      game.genres.forEach(genre => {
        genreStats[genre] = (genreStats[genre] || 0) + 1;
      });
    });

    const genreColors = [
      '#A3F7BF', '#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA',
      '#FFD3BA', '#E0BBE4', '#D4F0FF', '#C7CEEA', '#FFC0CB'
    ];

    await supabase.from('user_genre_stats').delete().eq('user_id', user.id);
    
    const genreEntries = Object.entries(genreStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
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

    // Process shelf life data
    const gamesWithReleaseDate = games
      .filter(g => g.release_date)
      .map(g => ({
        ...g,
        parsedReleaseDate: new Date(g.release_date!)
      }))
      .sort((a, b) => a.parsedReleaseDate.getTime() - b.parsedReleaseDate.getTime())
      .slice(0, 20);

    await supabase.from('user_shelf_life').delete().eq('user_id', user.id);

    const shelfLifeEntries = gamesWithReleaseDate.map((game, index) => {
      const yearsOld = (Date.now() - game.parsedReleaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      return {
        user_id: user.id,
        game_id: game.id,
        release_date: game.release_date,
        years_old: Math.round(yearsOld * 10) / 10,
        playtime_minutes: game.playtime_minutes,
        shelf_life_rank: index + 1,
        last_calculated: new Date().toISOString()
      };
    });

    if (shelfLifeEntries.length > 0) {
      await supabase.from('user_shelf_life').insert(shelfLifeEntries);
    }

    // Process enhanced dust breakdowns for ALL games with dust scores (removed limit)
    const allDustGames = games
      .filter(g => g.dust_score && g.dust_score > 0)
      .sort((a, b) => (b.dust_score || 0) - (a.dust_score || 0));

    await supabase.from('game_dust_breakdowns').delete().eq('user_id', user.id);

    const dustBreakdownEntries = [];
    for (const game of allDustGames) {
      // Calculate enhanced 5-factor breakdown for each game
      const breakdown = calculateEnhancedDustScore(
        game.release_date,
        game.playtime_minutes,
        game.price_cents || 0,
        game.genres,
        game.metacritic_score
      );

      dustBreakdownEntries.push({
        user_id: user.id,
        game_id: game.id,
        current_dust_score: breakdown.totalScore,
        age_score: breakdown.ageScore,
        ownership_score: breakdown.priceScore, // Map for compatibility
        quality_score: breakdown.qualityScore,
        price_score: breakdown.priceScore,
        genre_score: breakdown.genreScore,
        playtime_factor: breakdown.playtimeFactor,
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

    console.log(`Enhanced metrics calculation completed for user ${user.id}`);
    console.log(`- Total games processed: ${totalGames}`);
    console.log(`- Dust breakdowns created: ${dustBreakdownEntries.length}`);
    console.log(`- Clean score: ${cleanScore} (Enhanced Phase 2)`);
    console.log(`- Enhanced 5-factor scoring: Quality/Price/Age/Genre/Playtime`);

    return new Response(
      JSON.stringify({
        success: true,
        message: processingMessage,
        metrics: {
          totalGames,
          unplayedGames,
          recentlyPlayedCount,
          cleanScore,
          dustBreakdownsCreated: dustBreakdownEntries.length,
          enhancedScoring: true,
          cleanScoreBreakdown: {
            diversityScore,
            recencyScore,
            backlogConversionScore,
            sessionDepthScore
          },
          totalLibraryValueCents
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error calculating enhanced user metrics:', error);
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
