import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { v4 as uuidv4 } from "https://esm.sh/uuid@9.0.0";
import { create, getNumericDate } from "https://deno.land/x/djwt@v2.9/mod.ts";

const SUPABASE_URL = "https://gwmygthanyycveyqqspr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3bXlndGhhbnl5Y3ZleXFxc3ByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3NTAxMjUsImV4cCI6MjA2MjMyNjEyNX0.zrL5sYy8LE4ErMRL-W-yuZZR10EYyrgIS9Kj-EfUw80";
const STEAM_API_KEY = "38839F6C16BC7EC93D3A2DA41DEE8D70";

// Dynamic environment detection and URL configuration
const getEnvironment = (request: Request) => {
  const host = request.headers.get('host') || '';
  const origin = request.headers.get('origin') || '';
  const referer = request.headers.get('referer') || '';
  const sourceHeader = request.headers.get('x-steam-auth-source') || '';
  
  console.log(`[Steam Auth] Detecting environment:
    Host: ${host}
    Origin: ${origin}
    Referer: ${referer}
    Source: ${sourceHeader}
  `);

  // Check if running in specific environments
  const isNetlifyPreview = host.includes('netlify.app') && !host.includes('unplayed.wtf');
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
  const isProduction = host.includes('unplayed.wtf') || sourceHeader === 'netlify';
  
  return { isNetlifyPreview, isLocalhost, isProduction };
};

// Get environment-appropriate URLs for auth flow
const getConfiguredUrls = (request: Request) => {
  // First check environment variables (highest priority)
  const envFrontendUrl = Deno.env.get("FRONTEND_URL");
  const envReturnUrl = Deno.env.get("STEAM_RETURN_URL");
  
  // Then determine environment
  const { isNetlifyPreview, isLocalhost, isProduction } = getEnvironment(request);
  
  // Default production URLs as fallback
  const PROD_FRONTEND_URL = "https://unplayed.wtf";
  const PROD_RETURN_URL = "https://unplayed.wtf/api/auth/steam/callback";
  
  // Set appropriate URLs based on environment
  let frontendUrl = envFrontendUrl || PROD_FRONTEND_URL;
  let returnUrl = envReturnUrl || PROD_RETURN_URL;
  
  // Override if in Netlify preview or development
  if (isNetlifyPreview) {
    const host = request.headers.get('host') || '';
    const origin = request.headers.get('origin') || '';
    // Use netlify preview URL if available
    frontendUrl = origin || `https://${host}`;
    returnUrl = `${frontendUrl}/api/auth/steam/callback`;
  } else if (isLocalhost) {
    const host = request.headers.get('host') || '';
    const protocol = host.startsWith('localhost') ? 'http://' : 'https://';
    frontendUrl = `${protocol}${host}`;
    returnUrl = `${frontendUrl}/api/auth/steam/callback`;
  }
  
  console.log(`[Steam Auth] Using URLs:
    Frontend URL: ${frontendUrl}
    Return URL: ${returnUrl}
    From environment vars: ${!!envFrontendUrl}, ${!!envReturnUrl}
    Environment: ${isProduction ? 'Production' : isNetlifyPreview ? 'Preview' : isLocalhost ? 'Local' : 'Unknown'}
  `);
  
  return { frontendUrl, returnUrl };
};

// Get the domain for realm from the return URL - Improved implementation
const getDomainFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    console.log(`[Steam Auth] Parsing URL: ${url}, resulting domain: ${urlObj.protocol}//${urlObj.hostname}`);
    return `${urlObj.protocol}//${urlObj.hostname}`;
  } catch (e) {
    console.error("[Steam Auth] Failed to parse URL:", url, e);
    return "https://unplayed.wtf"; // Default fallback
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
  errorId?: string;
}

type SteamAPIError = {
  type: 'steam_api_error';
  message: string;
  details?: any;
  errorId?: string;
}

type TokenError = {
  type: 'token_error';
  message: string;
  details?: any;
  errorId?: string;
}

type DatabaseError = {
  type: 'database_error';
  message: string;
  details?: any;
  errorId?: string;
}

// Create a shared admin client utility function
const createAdminClient = () => {
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!serviceRoleKey) {
    console.error("SERVICE ROLE KEY IS MISSING");
    throw new Error("Service role key not available for admin operations");
  }
  
  return createClient(
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
};

// Function to generate an error redirect URL - Enhanced with more detailed errors
function generateErrorRedirect(req: Request, code: string, message: string, details?: any): string {
  // Generate a unique error ID for tracking
  const errorId = uuidv4();
  
  // Get the appropriate frontend URL based on environment
  const { frontendUrl } = getConfiguredUrls(req);
  
  // Log the error with the unique ID for tracking
  console.error(`[${errorId}] Steam Auth Error:`, { 
    code, 
    message, 
    details,
    timestamp: new Date().toISOString(),
    headers: Object.fromEntries([...req.headers.entries()])
  });
  
  // Create the error URL - direct to login-error page
  const url = new URL(`${frontendUrl}/login-error`);
  url.searchParams.append('error_code', code);
  url.searchParams.append('error_message', encodeURIComponent(message));
  url.searchParams.append('error_id', errorId);
  
  if (details) {
    try {
      url.searchParams.append('error_details', encodeURIComponent(JSON.stringify(details)));
    } catch (e) {
      console.error("[Steam Auth] Failed to stringify error details:", e);
    }
  }
  
  console.log(`[Steam Auth] Generated error redirect URL: ${url.toString()}`);
  return url.toString();
}

// Function to handle the authentication URL generation - with improved logging and error handling
async function handleLogin(req: Request) {
  try {
    const { frontendUrl, returnUrl } = getConfiguredUrls(req);
    const url = new URL(req.url);
    const redirectTo = url.searchParams.get('redirectTo') || '';
    const origin = req.headers.get('origin') || frontendUrl;

    // Log request details for debugging
    console.log(`[Steam Auth] Login request:
      Origin: ${origin}
      URL: ${req.url}
      Headers: ${JSON.stringify(Object.fromEntries([...req.headers.entries()]), null, 2)}
      RedirectTo: ${redirectTo}
    `);
    
    // Generate a state parameter to prevent CSRF attacks and store the redirectTo
    const state = btoa(JSON.stringify({ 
      redirectTo,
      source: req.headers.get('referer') || 'direct',
      timestamp: Date.now()
    }));
    
    // Get the domain to use as realm from the return URL
    const realm = getDomainFromUrl(returnUrl);
    
    console.log(`[Steam Auth] Using realm: ${realm} and return URL: ${returnUrl}`);
    
    const params = new URLSearchParams({
      'openid.ns': 'http://specs.openid.net/auth/2.0',
      'openid.mode': 'checkid_setup',
      'openid.return_to': `${returnUrl}?state=${encodeURIComponent(state)}`,
      'openid.realm': realm,
      'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
      'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
    });

    const loginUrl = `${STEAM_LOGIN_URL}?${params.toString()}`;
    
    console.log(`[Steam Auth] Generated Steam login URL: ${loginUrl}`);
    
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
          details: error.message,
          errorId: uuidv4()
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
}

// Function to verify the OpenID authentication with Steam - With improved retry logic
async function verifyAuthentication(params: URLSearchParams, retryCount = 0): Promise<boolean> {
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

    console.log(`[Steam Auth] Verifying authentication with Steam... (attempt ${retryCount + 1})`);
    
    // Send verification request to Steam with user agent header
    const verifyResponse = await fetch(`${STEAM_LOGIN_URL}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'UnplayedWTF Steam Authentication Service'
      },
      body: verifyParams.toString(),
    });

    if (!verifyResponse.ok) {
      console.error(`[Steam Auth] Verification failed with status: ${verifyResponse.status}`);
      if (retryCount < 2) {
        console.log(`[Steam Auth] Retrying verification (${retryCount + 1}/2)...`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        return verifyAuthentication(params, retryCount + 1);
      }
      throw new Error(`Verification request failed with status ${verifyResponse.status}`);
    }

    const verifyText = await verifyResponse.text();
    console.log(`[Steam Auth] Verification response: ${verifyText}`);
    const isValid = verifyText.includes('is_valid:true');
    
    console.log(`[Steam Auth] Authentication verification result: ${isValid ? 'Valid' : 'Invalid'}`);
    
    return isValid;
  } catch (error) {
    console.error("Authentication verification failed:", error);
    if (retryCount < 2) {
      console.log(`[Steam Auth] Retrying verification after error (${retryCount + 1}/2)...`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
      return verifyAuthentication(params, retryCount + 1);
    }
    throw {
      type: 'auth_error',
      code: 'verification_failed',
      message: 'Steam authentication verification failed',
      details: error.message,
      errorId: uuidv4()
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
      details: error.message,
      errorId: uuidv4()
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
    
    // Create admin client with service role
    const adminClient = createAdminClient();
    
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
      details: error,
      errorId: uuidv4()
    };
  }
}

// Function to handle the callback from Steam OpenID - With enhanced error handling and JWT generation
async function handleCallback(request: Request) {
  try {
    const url = new URL(request.url);
    const params = url.searchParams;
    const { frontendUrl } = getConfiguredUrls(request);
    
    console.log(`[Steam Auth] Received authentication callback from Steam
      URL: ${request.url}
      Headers: ${JSON.stringify(Object.fromEntries([...request.headers.entries()]), null, 2)}
    `);
    
    // Get state parameter (if it exists)
    const stateParam = params.get('state');
    let redirectTo = '';
    let source = 'direct';
    
    if (stateParam) {
      try {
        const stateObj = JSON.parse(atob(decodeURIComponent(stateParam)));
        redirectTo = stateObj.redirectTo || '';
        source = stateObj.source || 'direct';
        console.log(`[Steam Auth] Retrieved redirect URL from state: ${redirectTo}, source: ${source}`);
      } catch (e) {
        console.error("Failed to parse state parameter:", e);
      }
    }
    
    // Extract the Steam ID from the OpenID response
    const claimed_id = params.get('openid.claimed_id');
    if (!claimed_id) {
      console.error("Missing claimed_id in Steam response");
      return Response.redirect(
        generateErrorRedirect(request, 'invalid_response', 'Invalid authentication response from Steam'), 
        302
      );
    }

    console.log(`[Steam Auth] Processing authentication callback with claimed_id: ${claimed_id}`);
    
    // Verify the authentication with Steam
    const isValid = await verifyAuthentication(params);
    if (!isValid) {
      console.error("Steam authentication verification failed");
      return Response.redirect(
        generateErrorRedirect(request, 'verification_failed', 'Authentication verification failed with Steam'), 
        302
      );
    }

    // Extract the Steam ID from the claimed_id using regex for safety
    // Format: http://steamcommunity.com/openid/id/[STEAM_ID]
    const steamId = claimed_id.match(/\/(\d{17})$/)?.[1];
    
    if (!steamId) {
      console.error("Could not extract Steam ID from claimed_id:", claimed_id);
      return Response.redirect(
        generateErrorRedirect(request, 'missing_steam_id', 'Could not extract Steam ID from the response'), 
        302
      );
    }

    console.log(`[Steam Auth] Extracted Steam ID: ${steamId}`);
    
    // Get extended user data from Steam API
    console.log("[Steam Auth] Fetching extended Steam user data...");
    const steamUserData = await getExtendedSteamUserData(steamId);
    
    if (!steamUserData) {
      console.error("Failed to fetch Steam user data");
      return Response.redirect(
        generateErrorRedirect(request, 'missing_user_info', 'Could not fetch Steam user info'), 
        302
      );
    }

    console.log(`[Steam Auth] Successfully retrieved data for user: ${steamUserData.personaname}`);

    // Initialize the Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    try {
      // First, see if we already have this Steam ID in our database
      const { data: existingUserData, error: lookupError } = await supabase
        .from('users')
        .select('id, last_sync')
        .eq('steam_id', steamId)
        .maybeSingle();
      
      if (lookupError) {
        throw lookupError;
      }
      
      let userId: string;
      let shouldImportLibrary = true;
      
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
        
        console.log(`[Steam Auth] Created new user with ID: ${userId}`);
        // For new users, always import library
        shouldImportLibrary = true;
      } else {
        // Existing user - update their profile data
        userId = existingUserData.id;
        
        // Rate limiting: Check if we've synced recently (within last 2 minutes)
        const lastSync = existingUserData.last_sync ? new Date(existingUserData.last_sync) : null;
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000); // 2 minutes ago
        
        if (lastSync && lastSync > twoMinutesAgo) {
          console.log(`[Steam Auth] Skipping library import - last sync was recent: ${lastSync.toISOString()}`);
          shouldImportLibrary = false;
        } else {
          console.log(`[Steam Auth] Library import allowed - last sync: ${lastSync?.toISOString() || 'never'}`);
          shouldImportLibrary = true;
        }
        
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
        
        console.log(`[Steam Auth] Updated existing user with ID: ${userId}`);
      }
      
      // Process game library data in the background if available AND allowed by rate limiting
      if (shouldImportLibrary && steamUserData.library?.games?.length > 0) {
        try {
          if (existingUserData) {
            // Update existing user's library
            EdgeRuntime.waitUntil(updateGameLibrary(supabase, userId, steamId, steamUserData.library));
          } else {
            // Import library for new user
            EdgeRuntime.waitUntil(processGameLibrary(supabase, userId, steamId, steamUserData.library));
          }
        } catch (error) {
          console.error("Error starting game library import/update:", error);
          // Non-fatal error, continue with auth flow
        }
      }
      
      // Verify we have the JWT secret for token generation
      const jwtSecret = Deno.env.get('SUPABASE_JWT_SECRET');
      if (!jwtSecret) {
        console.error("[Steam Auth] JWT SECRET IS MISSING FOR TOKEN CREATION");
        return Response.redirect(
          generateErrorRedirect(request, 'auth_setup_error', 'Server authentication configuration error - Missing JWT secret'),
          302
        );
      }
      
      // Manually generate JWT token
      console.log(`[Steam Auth] Generating JWT for user ID: ${userId}`);
      
      try {
        // Create JWT payload
        const payload = {
          aud: "authenticated",
          sub: userId,
          email: `steam_${steamId}@unplayed.wtf`,
          app_metadata: {
            provider: "steam"
          },
          user_metadata: {
            steam_id: steamId,
            name: steamUserData.personaname,
            avatar_url: steamUserData.avatarmedium
          },
          role: "authenticated",
          iat: getNumericDate(0),
          exp: getNumericDate(60 * 60), // 1 hour expiry
        };
        
        // Create the JWT token
        const access_token = await create(
          { alg: "HS256", typ: "JWT" },
          payload,
          new TextEncoder().encode(jwtSecret)
        );
        
        console.log("[Steam Auth] JWT token generated successfully");
        
        // Mark the last sync time
        await supabase
          .from('users')
          .update({ last_sync: new Date().toISOString() })
          .eq('id', userId)
          .then(
            () => console.log("[Steam Auth] Updated last_sync timestamp"),
            (error) => console.error("[Steam Auth] Failed to update last_sync timestamp:", error)
          );
          
        // Build redirect URL with tokens
        const redirectPath = '/auth'; // Always redirect to auth page first
        
        // Determine the appropriate URL depending on environment
        const redirectUrl = new URL(frontendUrl + redirectPath);
        
        // Add tokens and user data parameters for client-side session establishment
        redirectUrl.searchParams.append('access_token', access_token);
        redirectUrl.searchParams.append('refresh_token', ''); // No refresh token with manual JWT
        redirectUrl.searchParams.append('steam_id', steamId);
        redirectUrl.searchParams.append('user_id', userId);
        redirectUrl.searchParams.append('auth_success', 'true');
        
        // Pass along the original target destination
        if (redirectTo) {
          redirectUrl.searchParams.append('redirectTo', redirectTo);
        }
        
        // Add analytics tracking for the source
        if (source) {
          redirectUrl.searchParams.append('auth_source', source);
        }
        
        console.log(`[Steam Auth] Authentication successful. Redirecting to: ${redirectUrl.toString()}`);
        
        return Response.redirect(redirectUrl.toString(), 302);
      } catch (jwtError) {
        console.error("[Steam Auth] Error generating JWT:", jwtError);
        return Response.redirect(
          generateErrorRedirect(request, 'token_generation_error', 'Failed to generate authentication token'),
          302
        );
      }
      
    } catch (error) {
      console.error("[Steam Auth] Error in authentication process:", error);
      
      const errorCode = error.code || 'unknown_error';
      const errorMessage = error.message || 'Authentication process failed';
      
      return Response.redirect(
        generateErrorRedirect(request, errorCode, errorMessage, error),
        302
      );
    }

  } catch (error) {
    console.error("[Steam Auth] Callback error:", error);
    return Response.redirect(
      generateErrorRedirect(request, 'callback_error', 'Error processing authentication callback', error),
      302
    );
  }
}

// Process game library data for a new user
async function processGameLibrary(supabase: any, userId: string, steamId: string, libraryData: any) {
  try {
    console.log(`[Steam Auth] Starting game library import for user: ${userId}`);
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
        console.error(`[Steam Auth] Error upserting games batch ${i}-${i+50}:`, gamesError);
      } else {
        console.log(`[Steam Auth] Processed games batch ${i}-${i+50} of ${libraryData.games.length}`);
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
        console.error(`[Steam Auth] Error upserting user_games batch ${i}-${i+50}:`, userGamesError);
      } else {
        console.log(`[Steam Auth] Processed user_games batch ${i}-${i+50} of ${userGamesData.length}`);
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`[Steam Auth] Game library import completed in ${duration}ms for user: ${userId}`);
    
  } catch (error) {
    console.error("[Steam Auth] Error processing game library:", error);
  }
}

// Update existing user's game library data
async function updateGameLibrary(supabase: any, userId: string, steamId: string, libraryData: any) {
  try {
    console.log(`[Steam Auth] Starting game library update for user: ${userId}`);
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
          () => console.log(`[Steam Auth] Updated games batch ${i}-${i+50} of ${libraryData.games.length}`),
          (error) => console.error(`[Steam Auth] Error updating games batch ${i}-${i+50}:`, error)
        );
    }
    
    // Get existing user_games to compare
    const { data: existingUserGames, error: fetchError } = await supabase
      .from('user_games')
      .select('game_id, playtime_minutes, last_played_date')
      .eq('user_id', userId);
    
    if (fetchError) {
      console.error("[Steam Auth] Error fetching existing user_games:", fetchError);
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
    
    console.log(`[Steam Auth] Found ${updates.length} games to update and ${newEntries.length} new games`);
    
    // Process updates in batches
    for (let i = 0; i < updates.length; i += 50) {
      const updateBatch = updates.slice(i, i + 50);
      
      await supabase
        .from('user_games')
        .upsert(updateBatch, { onConflict: 'user_id,game_id' })
        .then(
          () => console.log(`[Steam Auth] Updated user_games batch ${i}-${i+50} of ${updates.length}`),
          (error) => console.error(`[Steam Auth] Error updating user_games batch ${i}-${i+50}:`, error)
        );
    }
    
    // Process new entries in batches
    for (let i = 0; i < newEntries.length; i += 50) {
      const newBatch = newEntries.slice(i, i + 50);
      
      await supabase
        .from('user_games')
        .insert(newBatch)
        .then(
          () => console.log(`[Steam Auth] Inserted new user_games batch ${i}-${i+50} of ${newEntries.length}`),
          (error) => console.error(`[Steam Auth] Error inserting user_games batch ${i}-${i+50}:`, error)
        );
    }
    
    const duration = Date.now() - startTime;
    console.log(`[Steam Auth] Game library update completed in ${duration}ms for user: ${userId}`);
    
  } catch (error) {
    console.error("[Steam Auth] Error updating game library:", error);
  }
}

// Health Check endpoint - Enhanced with more diagnostic information
async function handleHealthCheck(req: Request) {
  const { frontendUrl, returnUrl } = getConfiguredUrls(req);
  const { isNetlifyPreview, isLocalhost, isProduction } = getEnvironment(req);
  
  const url = new URL(req.url);
  const headers = Object.fromEntries(req.headers.entries());
  
  return new Response(JSON.stringify({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: {
      isProduction,
      isNetlifyPreview,
      isLocalhost,
      detected_env: isProduction ? 'production' : isNetlifyPreview ? 'preview' : isLocalhost ? 'local' : 'unknown'
    },
    urls: {
      steam_return_url: returnUrl,
      frontend_url: frontendUrl,
    },
    request: {
      origin: headers['origin'] || 'Unknown',
      host: headers['host'] || 'Unknown',
      x_forwarded_host: headers['x-forwarded-host'] || 'Not set',
      url: req.url,
    },
    env_vars: {
      steam_return_url_set: !!Deno.env.get("STEAM_RETURN_URL"),
      frontend_url_set: !!Deno.env.get("FRONTEND_URL"),
      service_role_key_set: !!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
      jwt_secret_set: !!Deno.env.get("SUPABASE_JWT_SECRET"),
    }
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

// Enhanced debug endpoint for troubleshooting the edge function environment
async function handleDebug(req: Request) {
  // Get request information
  const url = new URL(req.url);
  const headers = Object.fromEntries(req.headers.entries());
  const { frontendUrl, returnUrl } = getConfiguredUrls(req);
  const { isNetlifyPreview, isLocalhost, isProduction } = getEnvironment(req);
  
  // Check for environment variables
  const serviceRoleKeyPresent = !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const steamApiKeyPresent = !!STEAM_API_KEY;
  const jwtSecretPresent = !!Deno.env.get('SUPABASE_JWT_SECRET');
  
  // Check for potential configuration issues
  const potentialIssues = [];
  if (!serviceRoleKeyPresent) {
    potentialIssues.push("SUPABASE_SERVICE_ROLE_KEY is missing");
  }
  if (!jwtSecretPresent) {
    potentialIssues.push("SUPABASE_JWT_SECRET is missing");
  }
  if (returnUrl === "https://unplayed.wtf/api/auth/steam/callback" && headers['host']?.includes('localhost')) {
    potentialIssues.push("Using production STEAM_RETURN_URL in development environment");
  }
  
  // Construct debug information
  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: {
      isProduction,
      isNetlifyPreview,
      isLocalhost,
      detected_env: isProduction ? 'production' : isNetlifyPreview ? 'preview' : isLocalhost ? 'local' : 'unknown',
      deno: Deno.version,
      frontendUrl,
      returnUrl,
      serviceRoleKeyPresent,
      steamApiKeyPresent,
      jwtSecretPresent,
      realm: getDomainFromUrl(returnUrl),
      potentialIssues
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
        'x-forwarded-host': headers['x-forwarded-host'],
        'x-forwarded-proto': headers['x-forwarded-proto']
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

// Main handler function - Enhanced with better error logging
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.split('/').pop();

  try {
    // Add request logging for debugging
    console.log(`[Steam Auth] Request received: ${req.method} ${url.pathname}`);
    
    switch (path) {
      case 'login':
        return await handleLogin(req);
      case 'callback':
        return await handleCallback(req);
      case 'health':
        return await handleHealthCheck(req);
      case 'debug':
        return await handleDebug(req);
      default:
        console.log(`[Steam Auth] Unknown path requested: ${path}`);
        return new Response(JSON.stringify({ 
          error: {
            type: 'not_found',
            code: 'invalid_endpoint',
            message: 'Endpoint not found',
            requestedPath: url.pathname,
            errorId: uuidv4()
          }
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        });
    }
  } catch (error) {
    console.error("[Steam Auth] Unhandled error in request handler:", error);
    const errorId = uuidv4();
    return new Response(JSON.stringify({ 
      error: {
        type: 'server_error',
        code: 'unhandled_error',
        message: 'Internal server error',
        details: error.message || String(error),
        path: url.pathname,
        errorId
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
