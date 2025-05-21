
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Type for the request body
interface DeleteAccountRequest {
  feedback?: string;
  reason?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header is required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create supabase client with admin privileges (required for deleting auth user)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    
    // Create regular client for user operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get the current user from the token
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get request data for feedback
    const requestData: DeleteAccountRequest = await req.json().catch(() => ({}));
    
    // Fetch username before deletion
    const { data: userData } = await supabase
      .from('users')
      .select('steam_name')
      .eq('id', user.id)
      .single();
    
    const username = userData?.steam_name;
    
    // Store deletion record with feedback if provided
    await supabase.from('account_deletions').insert({
      user_id: user.id,
      username,
      feedback: requestData.feedback,
      reason: requestData.reason,
      metadata: {
        deleted_at: new Date().toISOString(),
        had_games: true, // We'll assume they had games, this could be improved by checking
        original_email: user.email,
      }
    });
    
    console.log(`Processing account deletion for user ${user.id}`);

    // Step 1: Delete user's data from user_games
    const { error: gamesError } = await supabase
      .from('user_games')
      .delete()
      .eq('user_id', user.id);
      
    if (gamesError) {
      console.error(`Error deleting from user_games: ${gamesError.message}`);
    }
    
    // Step 2: Delete user's data from game_picks
    const { error: picksError } = await supabase
      .from('game_picks')
      .delete()
      .eq('user_id', user.id);
      
    if (picksError) {
      console.error(`Error deleting from game_picks: ${picksError.message}`);
    }
    
    // Step 3: Delete user's data from leaderboard_snapshots
    const { error: leaderboardError } = await supabase
      .from('leaderboard_snapshots')
      .delete()
      .eq('user_id', user.id);
      
    if (leaderboardError) {
      console.error(`Error deleting from leaderboard_snapshots: ${leaderboardError.message}`);
    }
    
    // Step 4: Delete user profile from users table
    const { error: profileError } = await supabase
      .from('users')
      .delete()
      .eq('id', user.id);
      
    if (profileError) {
      console.error(`Error deleting from users: ${profileError.message}`);
    }

    // Step 5: Delete the actual auth user
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteUserError) {
      return new Response(
        JSON.stringify({ error: `Failed to delete auth user: ${deleteUserError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Successfully deleted user ${user.id}`);

    // Return success response
    return new Response(
      JSON.stringify({ success: true, message: 'Account successfully deleted' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error(`Error in delete-account function: ${error.message}`);
    return new Response(
      JSON.stringify({ error: 'Failed to delete account' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
