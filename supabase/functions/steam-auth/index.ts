
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

// Function to handle the authentication URL generation
async function handleLogin() {
  const params = new URLSearchParams({
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'checkid_setup',
    'openid.return_to': STEAM_RETURN_URL,
    'openid.realm': STEAM_RETURN_URL,
    'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
  });

  const loginUrl = `${STEAM_LOGIN_URL}?${params.toString()}`;
  
  return new Response(
    JSON.stringify({ url: loginUrl }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    }
  );
}

// Function to verify the OpenID authentication with Steam
async function verifyAuthentication(params: URLSearchParams): Promise<boolean> {
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

  // Send verification request to Steam
  const verifyResponse = await fetch(`${STEAM_LOGIN_URL}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: verifyParams.toString(),
  });

  const verifyText = await verifyResponse.text();
  return verifyText.includes('is_valid:true');
}

// Function to get Steam user info using the Steam API
async function getSteamUserInfo(steamId: string): Promise<any> {
  const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${steamId}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data?.response?.players?.[0] || null;
  } catch (error) {
    console.error("Error fetching Steam user info:", error);
    return null;
  }
}

// Function to handle the callback from Steam OpenID
async function handleCallback(request: Request) {
  try {
    const url = new URL(request.url);
    const params = url.searchParams;
    
    // Extract the Steam ID from the OpenID response
    const claimed_id = params.get('openid.claimed_id');
    if (!claimed_id) {
      return new Response(JSON.stringify({ error: 'Invalid authentication response' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Verify the authentication with Steam
    const isValid = await verifyAuthentication(params);
    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Authentication verification failed' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    // Extract the Steam ID from the claimed_id
    // Format: http://steamcommunity.com/openid/id/[STEAM_ID]
    const steamId = claimed_id.split('/').pop();
    
    if (!steamId) {
      return new Response(JSON.stringify({ error: 'Could not extract Steam ID' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Get user details from Steam API
    const steamUserInfo = await getSteamUserInfo(steamId);
    
    if (!steamUserInfo) {
      return new Response(JSON.stringify({ error: 'Could not fetch Steam user info' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Initialize the Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
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
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: 'Authentication error' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Get or create a user in our users table
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('steam_id', steamId)
      .single();

    if (userError && userError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error("User lookup error:", userError);
      return new Response(JSON.stringify({ error: 'User lookup error' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // If user doesn't exist, create them
    if (!existingUser) {
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: (await supabase.auth.getUser()).data.user?.id,
          steam_id: steamId,
          steam_name: steamUserInfo.personaname,
          steam_avatar: steamUserInfo.avatarmedium
        });

      if (insertError) {
        console.error("User creation error:", insertError);
        return new Response(JSON.stringify({ error: 'User creation error' }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        });
      }
    } else {
      // Update existing user info if needed
      const { error: updateError } = await supabase
        .from('users')
        .update({
          steam_name: steamUserInfo.personaname,
          steam_avatar: steamUserInfo.avatarmedium
        })
        .eq('steam_id', steamId);

      if (updateError) {
        console.error("User update error:", updateError);
      }
    }

    // Generate access token and redirect to frontend with token
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !sessionData.session) {
      console.error("Session error:", sessionError);
      return new Response(JSON.stringify({ error: 'Session creation error' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Redirect back to frontend with access token
    const redirectUrl = new URL(FRONTEND_URL);
    redirectUrl.searchParams.append('access_token', sessionData.session.access_token);
    redirectUrl.searchParams.append('refresh_token', sessionData.session.refresh_token);
    
    return Response.redirect(redirectUrl.toString(), 302);
  } catch (error) {
    console.error("Callback error:", error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
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
    if (path === 'login') {
      return await handleLogin();
    } else if (path === 'callback') {
      return await handleCallback(req);
    } else {
      return new Response(JSON.stringify({ error: 'Not Found' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
