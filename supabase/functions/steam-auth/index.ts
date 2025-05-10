
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://gwmygthanyycveyqqspr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3bXlndGhhbnl5Y3ZleXFxc3ByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3NTAxMjUsImV4cCI6MjA2MjMyNjEyNX0.zrL5sYy8LE4ErMRL-W-yuZZR10EYyrgIS9Kj-EfUw80";
const STEAM_API_KEY = "38839F6C16BC7EC93D3A2DA41DEE8D70";

// Use environment variable for the return URL with fallback
const STEAM_RETURN_URL = Deno.env.get("STEAM_RETURN_URL") || "https://unplayed.wtf/api/auth/steam/callback";

// The frontend URL - dynamic based on the domain
const FRONTEND_URL = Deno.env.get("FRONTEND_URL") || "https://unplayed.wtf";

// Get the domain for realm from the return URL
const getDomainFromUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.hostname}`;
  } catch (e) {
    console.error("Failed to parse URL:", e);
    return "https://unplayed.wtf";
  }
};

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
    
    // Get the domain to use as realm from the return URL
    const realm = getDomainFromUrl(STEAM_RETURN_URL);
    
    console.log(`Using realm: ${realm} and return URL: ${STEAM_RETURN_URL}`);
    
    const params = new URLSearchParams({
      'openid.ns': 'http://specs.openid.net/auth/2.0',
      'openid.mode': 'checkid_setup',
      'openid.return_to': `${STEAM_RETURN_URL}?state=${encodeURIComponent(state)}`,
      'openid.realm': realm,
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
    
    // Send verification request to Steam with user agent header
    const verifyResponse = await fetch(`${STEAM_LOGIN_URL}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'UnplayedWTF Steam Authentication Service'
      },
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
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'UnplayedWTF Steam User Service'
      }
    });
    
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
      const ownedGamesResponse = await fetch(ownedGamesUrl, {
        headers: {
          'User-Agent': 'UnplayedWTF Steam Library Service'
        }
      });
      
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
      const recentGamesResponse = await fetch(recentGamesUrl, {
        headers: {
          'User-Agent': 'UnplayedWTF Steam Activity Service'
        }
      });
      
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

// Function to create a user directly in Supabase auth system - Now only using admin methods
async function createSupabaseUser(steamId: string, steamName: string, steamAvatar: string): Promise<string> {
  try {
    console.log(`Creating new Supabase user for Steam ID: ${steamId}`);
    
    // Verify we have the service role key
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!serviceRoleKey) {
      console.error("SERVICE ROLE KEY IS MISSING");
      throw new Error("Service role key not available for admin operations");
    }
    
    // Create admin client with service role
    const adminClient = createClient(
      SUPABASE_URL,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        }
      }
    );
    
    // Create a unique, valid email from the Steam ID
    const email = `steam_${steamId}@unplayed.wtf`;
    
    console.log(`Using admin client to create or retrieve user with email: ${email}`);
    
    // Try to find if the user already exists
    const { data: existingUsers, error: searchError } = await adminClient.auth.admin.listUsers({
      filter: { email: email }
    });
    
    if (searchError) {
      console.error("Error searching for existing user:", searchError);
      throw searchError;
    }
    
    let userId: string;
    
    // Check if user exists
    if (existingUsers && existingUsers.users.length > 0) {
      userId = existingUsers.users[0].id;
      console.log(`Found existing user with ID: ${userId}`);
      
      // Update user metadata
      const { error: updateError } = await adminClient.auth.admin.updateUserById(
        userId,
        {
          user_metadata: {
            steam_id: steamId,
            name: steamName,
            avatar_url: steamAvatar,
            provider: 'steam'
          }
        }
      );
      
      if (updateError) {
        console.error("Error updating user metadata:", updateError);
        // Non-fatal error, continue
      }
    } else {
      // Create new user with admin API
      console.log("No existing user found, creating new user");
      const { data: newUserData, error: createError } = await adminClient.auth.admin.createUser({
        email: email,
        email_confirm: true, // Auto-confirm the email
        user_metadata: {
          steam_id: steamId,
          name: steamName,
          avatar_url: steamAvatar,
          provider: 'steam'
        }
      });
      
      if (createError) {
        console.error("Error creating new user:", createError);
        throw createError;
      }
      
      if (!newUserData?.user) {
        throw new Error("No user returned after creation");
      }
      
      userId = newUserData.user.id;
      console.log(`Created new user with ID: ${userId}`);
    }
    
    return userId;
  } catch (error) {
    console.error("Error creating Supabase user:", error);
    throw {
      type: 'auth_error',
      code: 'user_creation_failed',
      message: `Failed to create user account: ${error.message}`,
      details: error
    };
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
    
    try {
      // First, see if we already have this Steam ID in our database
      const { data: existingUserData, error: lookupError } = await supabase
        .from('users')
        .select('id')
        .eq('steam_id', steamId)
        .maybeSingle();
      
      if (lookupError) {
        throw lookupError;
      }
      
      let userId: string;
      
      if (!existingUserData) {
        // New user - create Supabase auth account and profile
        userId = await createSupabaseUser(
          steamId, 
          steamUserData.personaname, 
          steamUserData.avatarmedium
        );
        
        // Create user profile in our users table
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: userId,
            steam_id: steamId,
            steam_name: steamUserData.personaname,
            steam_avatar: steamUserData.avatarmedium
          });
          
        if (insertError) {
          console.error("Error creating user profile:", insertError);
          throw insertError;
        }
        
        console.log(`Created new user with ID: ${userId}`);
        
        // Process game library data in the background if available
        if (steamUserData.library?.games?.length > 0) {
          try {
            EdgeRuntime.waitUntil(processGameLibrary(supabase, userId, steamId, steamUserData.library));
          } catch (error) {
            console.error("Error starting game library import:", error);
            // Non-fatal error, continue with auth flow
          }
        }
      } else {
        // Existing user - update their profile data
        userId = existingUserData.id;
        
        const { error: updateError } = await supabase
          .from('users')
          .update({
            steam_name: steamUserData.personaname,
            steam_avatar: steamUserData.avatarmedium,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
          
        if (updateError) {
          console.error("Error updating user profile:", updateError);
          // Non-fatal error, continue
        }
        
        console.log(`Updated existing user with ID: ${userId}`);
        
        // Update their game library in the background
        if (steamUserData.library?.games?.length > 0) {
          try {
            EdgeRuntime.waitUntil(updateGameLibrary(supabase, userId, steamId, steamUserData.library));
          } catch (error) {
            console.error("Error starting game library update:", error);
            // Non-fatal error, continue
          }
        }
      }
      
      // Verify we have the service role key for auth operations
      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      if (!serviceRoleKey) {
        console.error("SERVICE ROLE KEY IS MISSING FOR SESSION CREATION");
        return Response.redirect(
          generateErrorRedirect('auth_setup_error', 'Server authentication configuration error'),
          302
        );
      }
      
      // Create admin client for authentication
      const adminClient = createClient(SUPABASE_URL, serviceRoleKey);
      
      // Create a session for the user using admin API
      console.log(`Creating session for user ID: ${userId}`);
      const { data: signInData, error: signInError } = await adminClient.auth.admin.generateLink({
        type: 'magiclink',
        email: `steam_${steamId}@unplayed.wtf`,
        options: {
          redirectTo: FRONTEND_URL + (redirectTo || '/')
        }
      });
      
      if (signInError || !signInData) {
        console.error("Error generating auth link:", signInError);
        return Response.redirect(
          generateErrorRedirect('session_creation_error', 'Failed to create authentication session'),
          302
        );
      }
      
      console.log("Admin session created successfully");
      
      // Mark the last sync time
      await supabase
        .from('users')
        .update({ last_sync: new Date().toISOString() })
        .eq('id', userId)
        .then(
          () => console.log("Updated last_sync timestamp"),
          (error) => console.error("Failed to update last_sync timestamp:", error)
        );
        
      // Redirect with the token parameters
      const redirectUrl = new URL(FRONTEND_URL + (redirectTo || '/'));
      
      // Add JWT and user data parameters
      redirectUrl.searchParams.append('steam_id', steamId);
      redirectUrl.searchParams.append('user_id', userId);
      redirectUrl.searchParams.append('auth_success', 'true');
      
      console.log(`Authentication successful. Redirecting to: ${redirectUrl.toString()}`);
      
      return Response.redirect(redirectUrl.toString(), 302);
      
    } catch (error) {
      console.error("Error in authentication process:", error);
      
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
  return new Response(JSON.stringify({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    steam_return_url: STEAM_RETURN_URL,
    frontend_url: FRONTEND_URL
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

// Debug endpoint for troubleshooting the edge function environment
async function handleDebug(req: Request) {
  // Get request information
  const url = new URL(req.url);
  const headers = Object.fromEntries(req.headers.entries());
  
  // Check for environment variables
  const serviceRoleKeyPresent = !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const steamApiKeyPresent = !!STEAM_API_KEY;
  const steamReturnUrlValue = STEAM_RETURN_URL;
  const frontendUrlValue = FRONTEND_URL;
  
  // Construct debug information
  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: {
      deno: Deno.version,
      supabaseUrl: SUPABASE_URL,
      steamReturnUrl: steamReturnUrlValue,
      frontendUrl: frontendUrlValue,
      serviceRoleKeyPresent,
      steamApiKeyPresent,
      realm: getDomainFromUrl(STEAM_RETURN_URL)
    },
    config: {
      corsHeaders,
    },
    request: {
      url: req.url,
      method: req.method,
      headers: {
        // Only include safe headers
        'user-agent': headers['user-agent'],
        'content-type': headers['content-type'],
        'origin': headers['origin'],
        'referer': headers['referer'],
        'host': headers['host'],
        'x-netlify-source': headers['x-netlify-source'],
        'x-steam-auth-source': headers['x-steam-auth-source'],
      },
      path: url.pathname,
      query: Object.fromEntries(url.searchParams.entries()),
    }
  };
  
  return new Response(
    JSON.stringify(debugInfo, null, 2),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    }
  );
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
      case 'debug':
        return await handleDebug(req);
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
