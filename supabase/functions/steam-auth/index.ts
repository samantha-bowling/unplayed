
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://gwmygthanyycveyqqspr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3bXlndGhhbnl5Y3ZleXFxc3ByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3NTAxMjUsImV4cCI6MjA2MjMyNjEyNX0.zrL5sYy8LE4ErMRL-W-yuZZR10EYyrgIS9Kj-EfUw80";
const STEAM_API_KEY = "38839F6C16BC7EC93D3A2DA41DEE8D70";

// The deployed URL of this edge function will be used for Steam's OpenID return_to parameter
const STEAM_RETURN_URL = "https://gwmygthanyycveyqqspr.supabase.co/functions/v1/steam-auth/callback";

// The frontend URL - where to redirect after successful auth
const FRONTEND_URL = "https://unplayed.wtf";

// Steam OpenID endpoint
const STEAM_LOGIN_URL = "https://steamcommunity.com/openid/login";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Error types for better error handling
type AuthError = {
  type: 'auth_error';
  code: string;
  message: string;
  details?: any;
}

type SteamAPIError = {
  type: 'steam_api_error';
  message: string;
  details?: any;
}

type TokenError = {
  type: 'token_error';
  message: string;
  details?: any;
}

type DatabaseError = {
  type: 'database_error';
  message: string;
  details?: any;
}

// Function to generate an error redirect URL
function generateErrorRedirect(code: string, message: string): string {
  const url = new URL(FRONTEND_URL + '/auth');
  url.searchParams.append('error_code', code);
  url.searchParams.append('error_message', encodeURIComponent(message));
  return url.toString();
}

// Function to handle the authentication URL generation
async function handleLogin(req: Request) {
  try {
    const url = new URL(req.url);
    const redirectTo = url.searchParams.get('redirectTo') || '';

    // Log the request
    console.log(`Handling login request with redirectTo: ${redirectTo}`);
    
    // Generate a state parameter to prevent CSRF attacks and store the redirectTo
    const state = btoa(JSON.stringify({ redirectTo }));
    
    const params = new URLSearchParams({
      'openid.ns': 'http://specs.openid.net/auth/2.0',
      'openid.mode': 'checkid_setup',
      'openid.return_to': `${STEAM_RETURN_URL}?state=${encodeURIComponent(state)}`,
      'openid.realm': STEAM_RETURN_URL,
      'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
      'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
    });

    const loginUrl = `${STEAM_LOGIN_URL}?${params.toString()}`;
    
    console.log(`Generated Steam login URL: ${loginUrl}`);
    
    return new Response(
      JSON.stringify({ url: loginUrl }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Login generation error:", error);
    return new Response(
      JSON.stringify({ 
        error: {
          type: 'auth_error',
          code: 'login_url_generation_failed',
          message: 'Failed to generate login URL',
          details: error.message
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
}

// Function to verify the OpenID authentication with Steam
async function verifyAuthentication(params: URLSearchParams): Promise<boolean> {
  try {
    // Create a copy of the parameters for verification
    const verifyParams = new URLSearchParams();
    
    // Copy all parameters
    for (const [key, value] of params.entries()) {
      // Replace mode from 'id_res' to 'check_authentication'
      if (key === 'openid.mode') {
        verifyParams.append(key, 'check_authentication');
      } else {
        verifyParams.append(key, value);
      }
    }

    console.log("Verifying authentication with Steam...");
    
    // Send verification request to Steam
    const verifyResponse = await fetch(`${STEAM_LOGIN_URL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: verifyParams.toString(),
    });

    const verifyText = await verifyResponse.text();
    const isValid = verifyText.includes('is_valid:true');
    
    console.log(`Authentication verification result: ${isValid ? 'Valid' : 'Invalid'}`);
    
    return isValid;
  } catch (error) {
    console.error("Authentication verification failed:", error);
    throw {
      type: 'auth_error',
      code: 'verification_failed',
      message: 'Steam authentication verification failed',
      details: error.message
    } as AuthError;
  }
}

// Function to get Steam user info using the Steam API
async function getSteamUserInfo(steamId: string): Promise<any> {
  try {
    const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${steamId}`;
    
    console.log(`Fetching Steam user info for steamId: ${steamId}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Steam API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    const player = data?.response?.players?.[0];
    
    if (!player) {
      throw new Error("No player data returned from Steam API");
    }
    
    console.log(`Successfully retrieved Steam user info for: ${player.personaname}`);
    
    return player;
  } catch (error) {
    console.error("Error fetching Steam user info:", error);
    throw {
      type: 'steam_api_error',
      message: 'Failed to fetch user info from Steam API',
      details: error.message
    } as SteamAPIError;
  }
}

// Extended function to get more Steam user data including games
async function getExtendedSteamUserData(steamId: string): Promise<any> {
  try {
    // First get the user's basic info
    const userInfo = await getSteamUserInfo(steamId);
    
    console.log(`Fetching extended data for user: ${userInfo.personaname}`);
    
    // The complete response object we'll build
    const userData = {
      ...userInfo,
      library: null,
      recentGames: null
    };
    
    // Let's try to get the user's owned games (if public)
    try {
      const ownedGamesUrl = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${STEAM_API_KEY}&steamid=${steamId}&format=json&include_appinfo=true&include_played_free_games=true`;
      const ownedGamesResponse = await fetch(ownedGamesUrl);
      
      if (ownedGamesResponse.ok) {
        const ownedGamesData = await ownedGamesResponse.json();
        userData.library = ownedGamesData?.response;
        console.log(`Retrieved ${userData.library?.games?.length || 0} games from user's library`);
      } else {
        console.log(`Failed to get owned games: ${ownedGamesResponse.status} ${ownedGamesResponse.statusText}`);
      }
    } catch (error) {
      console.error("Error fetching owned games:", error);
      // Non-fatal error, continue
    }
    
    // Get recently played games
    try {
      const recentGamesUrl = `https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/?key=${STEAM_API_KEY}&steamid=${steamId}&format=json`;
      const recentGamesResponse = await fetch(recentGamesUrl);
      
      if (recentGamesResponse.ok) {
        const recentGamesData = await recentGamesResponse.json();
        userData.recentGames = recentGamesData?.response;
        console.log(`Retrieved ${userData.recentGames?.games?.length || 0} recently played games`);
      } else {
        console.log(`Failed to get recent games: ${recentGamesResponse.status} ${recentGamesResponse.statusText}`);
      }
    } catch (error) {
      console.error("Error fetching recent games:", error);
      // Non-fatal error, continue
    }
    
    return userData;
  } catch (error) {
    console.error("Error in extended data fetch:", error);
    throw error;
  }
}

// Function to handle the callback from Steam OpenID
async function handleCallback(request: Request) {
  try {
    const url = new URL(request.url);
    const params = url.searchParams;
    
    console.log("Received authentication callback from Steam");
    
    // Get state parameter (if it exists)
    const stateParam = params.get('state');
    let redirectTo = '';
    
    if (stateParam) {
      try {
        const stateObj = JSON.parse(atob(decodeURIComponent(stateParam)));
        redirectTo = stateObj.redirectTo || '';
        console.log(`Retrieved redirect URL from state: ${redirectTo}`);
      } catch (e) {
        console.error("Failed to parse state parameter:", e);
      }
    }
    
    // Extract the Steam ID from the OpenID response
    const claimed_id = params.get('openid.claimed_id');
    if (!claimed_id) {
      console.error("Missing claimed_id in Steam response");
      return Response.redirect(
        generateErrorRedirect('invalid_response', 'Invalid authentication response from Steam'), 
        302
      );
    }

    console.log(`Processing authentication callback with claimed_id: ${claimed_id}`);
    
    // Verify the authentication with Steam
    const isValid = await verifyAuthentication(params);
    if (!isValid) {
      console.error("Steam authentication verification failed");
      return Response.redirect(
        generateErrorRedirect('verification_failed', 'Authentication verification failed with Steam'), 
        302
      );
    }

    // Extract the Steam ID from the claimed_id
    // Format: http://steamcommunity.com/openid/id/[STEAM_ID]
    const steamId = claimed_id.split('/').pop();
    
    if (!steamId) {
      console.error("Could not extract Steam ID from claimed_id");
      return Response.redirect(
        generateErrorRedirect('missing_steam_id', 'Could not extract Steam ID from the response'), 
        302
      );
    }

    console.log(`Extracted Steam ID: ${steamId}`);
    
    // Get extended user data from Steam API
    console.log("Fetching extended Steam user data...");
    const steamUserData = await getExtendedSteamUserData(steamId);
    
    if (!steamUserData) {
      console.error("Failed to fetch Steam user data");
      return Response.redirect(
        generateErrorRedirect('missing_user_info', 'Could not fetch Steam user info'), 
        302
      );
    }

    console.log(`Successfully retrieved data for user: ${steamUserData.personaname}`);

    // Initialize the Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Try to find an existing user with this Steam ID
    const { data: existingUser, error: userLookupError } = await supabase
      .from('users')
      .select('id')
      .eq('steam_id', steamId)
      .maybeSingle();
    
    let userId;
    
    if (userLookupError && userLookupError.code !== 'PGRST116') {
      console.error("User lookup error:", userLookupError);
      return Response.redirect(
        generateErrorRedirect('user_lookup_failed', 'Failed to check for existing user'), 
        302
      );
    }
    
    try {
      if (!existingUser) {
        // If user doesn't exist, sign them up
        console.log("Creating new user for Steam ID:", steamId);
        
        // Try to sign up or sign in the user with custom JWT claims including Steam info
        const { data: authData, error: authError } = await supabase.auth.signInWithOAuth({
          provider: 'discord', // We're using Discord as a proxy since Supabase doesn't support Steam directly
          options: {
            skipBrowserRedirect: true,
            queryParams: {
              // This is just to make Supabase happy - we'll override with our Steam data
              prompt: 'none',
            },
          }
        });

        if (authError) {
          console.error("Auth error during sign up:", authError);
          return Response.redirect(
            generateErrorRedirect('signup_failed', 'Authentication error during sign up'), 
            302
          );
        }
        
        // Get the user ID from the auth response
        const authUserId = (await supabase.auth.getUser()).data.user?.id;
        
        if (!authUserId) {
          console.error("Failed to get user ID for new user");
          return Response.redirect(
            generateErrorRedirect('user_creation_failed', 'Failed to get user ID for new user'), 
            302
          );
        }
        
        // Create user profile in the users table
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: authUserId,
            steam_id: steamId,
            steam_name: steamUserData.personaname,
            steam_avatar: steamUserData.avatarmedium
          });

        if (insertError) {
          console.error("User creation error:", insertError);
          return Response.redirect(
            generateErrorRedirect('profile_creation_failed', 'User creation error'), 
            302
          );
        }
        
        userId = authUserId;
        
        // Process game library data if available
        if (steamUserData.library?.games?.length > 0) {
          console.log(`Processing ${steamUserData.library.games.length} games from user's library`);
          try {
            // Background process game library import
            EdgeRuntime.waitUntil(processGameLibrary(supabase, userId, steamId, steamUserData.library));
          } catch (error) {
            console.error("Error starting game library import:", error);
            // Non-fatal error, continue with auth flow
          }
        } else {
          console.log("No game library data available or private profile");
        }
      } else {
        // User exists, sign them in
        console.log("Existing user found with Steam ID:", steamId);
        
        userId = existingUser.id;
        
        // Update existing user info if needed
        const { error: updateError } = await supabase
          .from('users')
          .update({
            steam_name: steamUserData.personaname,
            steam_avatar: steamUserData.avatarmedium,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (updateError) {
          console.error("User update error:", updateError);
          // Non-fatal error, continue without throwing
        }
        
        // Sign in the existing user
        const { error: signInError } = await supabase.auth.signInWithOAuth({
          provider: 'discord', // Using Discord as proxy
          options: {
            skipBrowserRedirect: true,
            queryParams: {
              prompt: 'none',
            },
          }
        });
        
        if (signInError) {
          console.error("Sign in error for existing user:", signInError);
          return Response.redirect(
            generateErrorRedirect('signin_failed', 'Failed to sign in existing user'), 
            302
          );
        }
        
        // Process game library updates in the background
        if (steamUserData.library?.games?.length > 0) {
          console.log(`Processing ${steamUserData.library.games.length} games for library update`);
          try {
            // Background process game library updates
            EdgeRuntime.waitUntil(updateGameLibrary(supabase, userId, steamId, steamUserData.library));
          } catch (error) {
            console.error("Error starting game library update:", error);
            // Non-fatal error, continue with auth flow
          }
        }
      }
      
      // Generate access token and redirect to frontend with token
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        console.error("Session error:", sessionError);
        return Response.redirect(
          generateErrorRedirect('session_creation_failed', 'Failed to create session'), 
          302
        );
      }

      // Mark the last sync time
      await supabase
        .from('users')
        .update({ last_sync: new Date().toISOString() })
        .eq('id', userId)
        .then(
          () => console.log("Updated last_sync timestamp"),
          (error) => console.error("Failed to update last_sync timestamp:", error)
        );

      // Redirect back to frontend with access token
      const redirectUrl = new URL(FRONTEND_URL + (redirectTo ? redirectTo : ''));
      redirectUrl.searchParams.append('access_token', sessionData.session.access_token);
      redirectUrl.searchParams.append('refresh_token', sessionData.session.refresh_token);
      
      console.log(`Authentication successful. Redirecting to: ${redirectUrl.toString()}`);
      
      return Response.redirect(redirectUrl.toString(), 302);
      
    } catch (error) {
      console.error("Error in authentication process:", error);
      
      // Format the error for the redirect
      const errorCode = error.code || 'unknown_error';
      const errorMessage = error.message || 'Authentication process failed';
      
      return Response.redirect(
        generateErrorRedirect(errorCode, errorMessage),
        302
      );
    }
  } catch (error) {
    console.error("Callback error:", error);
    return Response.redirect(
      generateErrorRedirect('callback_error', 'Error processing authentication callback'),
      302
    );
  }
}

// Process game library data for a new user
async function processGameLibrary(supabase: any, userId: string, steamId: string, libraryData: any) {
  try {
    console.log(`Starting game library import for user: ${userId}`);
    const startTime = Date.now();
    
    if (!libraryData?.games || !libraryData.games.length) {
      console.log("No games to import");
      return;
    }
    
    // First, ensure all games exist in the games table
    for (let i = 0; i < libraryData.games.length; i += 50) { // Process in batches of 50
      const gameBatch = libraryData.games.slice(i, i + 50);
      
      // Prepare data for upsert
      const gameUpserts = gameBatch.map(game => ({
        id: game.appid,
        name: game.name,
        image_url: game.img_icon_url ? `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg` : null,
        header_image: game.img_logo_url ? `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_logo_url}.jpg` : null,
        // We'll get more game details later
      }));
      
      // Upsert games to games table
      const { error: gamesError } = await supabase
        .from('games')
        .upsert(gameUpserts, { onConflict: 'id' });
      
      if (gamesError) {
        console.error(`Error upserting games batch ${i}-${i+50}:`, gamesError);
      } else {
        console.log(`Processed games batch ${i}-${i+50} of ${libraryData.games.length}`);
      }
    }
    
    // Now add user_games entries
    const userGamesData = libraryData.games.map(game => ({
      user_id: userId,
      game_id: game.appid,
      playtime_minutes: game.playtime_forever || 0,
      last_played_date: game.rtime_last_played ? new Date(game.rtime_last_played * 1000).toISOString() : null,
      // Approximating acquisition date from Steam's API data
      acquisition_date: game.rtime_last_played ? new Date(game.rtime_last_played * 1000).toISOString() : new Date().toISOString(),
    }));
    
    // Process in batches
    for (let i = 0; i < userGamesData.length; i += 50) {
      const userGamesBatch = userGamesData.slice(i, i + 50);
      
      const { error: userGamesError } = await supabase
        .from('user_games')
        .upsert(userGamesBatch, { 
          onConflict: 'user_id,game_id',
          ignoreDuplicates: false 
        });
      
      if (userGamesError) {
        console.error(`Error upserting user_games batch ${i}-${i+50}:`, userGamesError);
      } else {
        console.log(`Processed user_games batch ${i}-${i+50} of ${userGamesData.length}`);
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`Game library import completed in ${duration}ms for user: ${userId}`);
    
  } catch (error) {
    console.error("Error processing game library:", error);
  }
}

// Update existing user's game library data
async function updateGameLibrary(supabase: any, userId: string, steamId: string, libraryData: any) {
  try {
    console.log(`Starting game library update for user: ${userId}`);
    const startTime = Date.now();
    
    if (!libraryData?.games || !libraryData.games.length) {
      console.log("No games to update");
      return;
    }
    
    // Similar to processGameLibrary but focusing on updates
    // First ensure games exist
    for (let i = 0; i < libraryData.games.length; i += 50) {
      const gameBatch = libraryData.games.slice(i, i + 50);
      
      // Prepare data for upsert
      const gameUpserts = gameBatch.map(game => ({
        id: game.appid,
        name: game.name,
        image_url: game.img_icon_url ? `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg` : null,
        header_image: game.img_logo_url ? `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_logo_url}.jpg` : null,
      }));
      
      await supabase
        .from('games')
        .upsert(gameUpserts, { onConflict: 'id' })
        .then(
          () => console.log(`Updated games batch ${i}-${i+50} of ${libraryData.games.length}`),
          (error) => console.error(`Error updating games batch ${i}-${i+50}:`, error)
        );
    }
    
    // Get existing user_games to compare
    const { data: existingUserGames, error: fetchError } = await supabase
      .from('user_games')
      .select('game_id, playtime_minutes, last_played_date')
      .eq('user_id', userId);
    
    if (fetchError) {
      console.error("Error fetching existing user_games:", fetchError);
      return;
    }
    
    // Create map of existing games for quick lookup
    const existingGamesMap = new Map();
    existingUserGames?.forEach(game => {
      existingGamesMap.set(game.game_id, {
        playtime_minutes: game.playtime_minutes,
        last_played_date: game.last_played_date
      });
    });
    
    // Prepare updates
    const updates = [];
    const newEntries = [];
    
    libraryData.games.forEach(game => {
      const existing = existingGamesMap.get(game.appid);
      if (existing) {
        // Only update if values changed
        const lastPlayedDate = game.rtime_last_played 
          ? new Date(game.rtime_last_played * 1000).toISOString() 
          : null;
          
        if (existing.playtime_minutes !== game.playtime_forever || 
            existing.last_played_date !== lastPlayedDate) {
          updates.push({
            user_id: userId,
            game_id: game.appid,
            playtime_minutes: game.playtime_forever || 0,
            last_played_date: lastPlayedDate,
          });
        }
      } else {
        // New game not in database
        newEntries.push({
          user_id: userId,
          game_id: game.appid,
          playtime_minutes: game.playtime_forever || 0,
          last_played_date: game.rtime_last_played ? new Date(game.rtime_last_played * 1000).toISOString() : null,
          acquisition_date: new Date().toISOString(), // Best guess for new games
        });
      }
    });
    
    console.log(`Found ${updates.length} games to update and ${newEntries.length} new games`);
    
    // Process updates in batches
    for (let i = 0; i < updates.length; i += 50) {
      const updateBatch = updates.slice(i, i + 50);
      
      await supabase
        .from('user_games')
        .upsert(updateBatch, { onConflict: 'user_id,game_id' })
        .then(
          () => console.log(`Updated user_games batch ${i}-${i+50} of ${updates.length}`),
          (error) => console.error(`Error updating user_games batch ${i}-${i+50}:`, error)
        );
    }
    
    // Process new entries in batches
    for (let i = 0; i < newEntries.length; i += 50) {
      const newBatch = newEntries.slice(i, i + 50);
      
      await supabase
        .from('user_games')
        .insert(newBatch)
        .then(
          () => console.log(`Inserted new user_games batch ${i}-${i+50} of ${newEntries.length}`),
          (error) => console.error(`Error inserting user_games batch ${i}-${i+50}:`, error)
        );
    }
    
    const duration = Date.now() - startTime;
    console.log(`Game library update completed in ${duration}ms for user: ${userId}`);
    
  } catch (error) {
    console.error("Error updating game library:", error);
  }
}

// Health check endpoint
async function handleHealthCheck() {
  return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

// Main handler function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.split('/').pop();

  try {
    // Add request logging for debugging
    console.log(`Request received: ${req.method} ${url.pathname}`);
    
    switch (path) {
      case 'login':
        return await handleLogin(req);
      case 'callback':
        return await handleCallback(req);
      case 'health':
        return await handleHealthCheck();
      default:
        console.log(`Unknown path requested: ${path}`);
        return new Response(JSON.stringify({ 
          error: {
            type: 'not_found',
            code: 'invalid_endpoint',
            message: 'Endpoint not found'
          }
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        });
    }
  } catch (error) {
    console.error("Unhandled error in request handler:", error);
    return new Response(JSON.stringify({ 
      error: {
        type: 'server_error',
        code: 'unhandled_error',
        message: 'Internal server error',
        details: error.message || String(error)
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
