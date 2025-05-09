
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

// Function to handle the authentication URL generation
async function handleLogin(req: Request) {
  try {
    const url = new URL(req.url);
    const redirectTo = url.searchParams.get('redirectTo') || '';
    
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

// Function to handle the callback from Steam OpenID
async function handleCallback(request: Request) {
  try {
    const url = new URL(request.url);
    const params = url.searchParams;
    
    // Get state parameter (if it exists)
    const stateParam = params.get('state');
    let redirectTo = '';
    
    if (stateParam) {
      try {
        const stateObj = JSON.parse(atob(decodeURIComponent(stateParam)));
        redirectTo = stateObj.redirectTo || '';
      } catch (e) {
        console.error("Failed to parse state parameter:", e);
      }
    }
    
    // Extract the Steam ID from the OpenID response
    const claimed_id = params.get('openid.claimed_id');
    if (!claimed_id) {
      return new Response(JSON.stringify({ 
        error: {
          type: 'auth_error',
          code: 'invalid_response',
          message: 'Invalid authentication response from Steam'
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    console.log(`Processing authentication callback with claimed_id: ${claimed_id}`);
    
    // Verify the authentication with Steam
    const isValid = await verifyAuthentication(params);
    if (!isValid) {
      return new Response(JSON.stringify({ 
        error: {
          type: 'auth_error',
          code: 'verification_failed',
          message: 'Authentication verification failed with Steam'
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    // Extract the Steam ID from the claimed_id
    // Format: http://steamcommunity.com/openid/id/[STEAM_ID]
    const steamId = claimed_id.split('/').pop();
    
    if (!steamId) {
      return new Response(JSON.stringify({ 
        error: {
          type: 'auth_error',
          code: 'missing_steam_id',
          message: 'Could not extract Steam ID from the response'
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    console.log(`Extracted Steam ID: ${steamId}`);
    
    // Get user details from Steam API
    const steamUserInfo = await getSteamUserInfo(steamId);
    
    if (!steamUserInfo) {
      return new Response(JSON.stringify({ 
        error: {
          type: 'steam_api_error',
          code: 'missing_user_info',
          message: 'Could not fetch Steam user info'
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

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
      return new Response(JSON.stringify({ 
        error: {
          type: 'database_error',
          code: 'user_lookup_failed',
          message: 'Failed to check for existing user'
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
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
          throw {
            type: 'auth_error',
            code: 'signup_failed',
            message: 'Authentication error during sign up',
            details: authError
          } as AuthError;
        }
        
        // Get the user ID from the auth response
        const authUserId = (await supabase.auth.getUser()).data.user?.id;
        
        if (!authUserId) {
          throw {
            type: 'auth_error',
            code: 'user_creation_failed',
            message: 'Failed to get user ID for new user'
          } as AuthError;
        }
        
        // Create user profile in the users table
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: authUserId,
            steam_id: steamId,
            steam_name: steamUserInfo.personaname,
            steam_avatar: steamUserInfo.avatarmedium
          });

        if (insertError) {
          console.error("User creation error:", insertError);
          throw {
            type: 'database_error',
            code: 'profile_creation_failed',
            message: 'User creation error',
            details: insertError
          } as DatabaseError;
        }
        
        userId = authUserId;
      } else {
        // User exists, sign them in
        console.log("Existing user found with Steam ID:", steamId);
        
        userId = existingUser.id;
        
        // Update existing user info if needed
        const { error: updateError } = await supabase
          .from('users')
          .update({
            steam_name: steamUserInfo.personaname,
            steam_avatar: steamUserInfo.avatarmedium,
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
          throw {
            type: 'auth_error',
            code: 'signin_failed',
            message: 'Failed to sign in existing user',
            details: signInError
          } as AuthError;
        }
      }
      
      // Generate access token and redirect to frontend with token
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        console.error("Session error:", sessionError);
        throw {
          type: 'token_error',
          code: 'session_creation_failed',
          message: 'Failed to create session',
          details: sessionError
        } as TokenError;
      }

      // Redirect back to frontend with access token
      const redirectUrl = new URL(FRONTEND_URL + (redirectTo ? redirectTo : ''));
      redirectUrl.searchParams.append('access_token', sessionData.session.access_token);
      redirectUrl.searchParams.append('refresh_token', sessionData.session.refresh_token);
      
      console.log(`Authentication successful. Redirecting to: ${redirectUrl.toString()}`);
      
      return Response.redirect(redirectUrl.toString(), 302);
      
    } catch (error) {
      console.error("Error in authentication process:", error);
      
      // Format the error response based on the error type
      const errorResponse = {
        error: error.type ? error : {
          type: 'auth_error',
          code: 'unknown_error',
          message: 'Authentication process failed',
          details: error.message || String(error)
        }
      };
      
      return new Response(JSON.stringify(errorResponse), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }
  } catch (error) {
    console.error("Callback error:", error);
    return new Response(JSON.stringify({ 
      error: {
        type: 'auth_error',
        code: 'callback_error',
        message: 'Error processing authentication callback',
        details: error.message || String(error)
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
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
