import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Reserved words configuration
const RESERVED_WORDS = [
  'admin', 'support', 'api', 'root', 'system', 'moderator', 'mod',
  'unplayed', 'official', 'help', 'info', 'contact', 'team', 'me'
];

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username } = await req.json();
    
    if (!username || typeof username !== 'string') {
      return new Response(JSON.stringify({
        available: false,
        error: 'Username is required'
      }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Normalize to lowercase for consistency
    const normalizedUsername = username.toLowerCase().trim();

    // Validate format
    if (!/^[a-z0-9_]{3,20}$/.test(normalizedUsername)) {
      return new Response(JSON.stringify({
        available: false,
        error: 'Username must be 3-20 characters (lowercase letters, numbers, underscores only)'
      }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Check reserved words
    if (RESERVED_WORDS.includes(normalizedUsername)) {
      return new Response(JSON.stringify({
        available: false,
        error: 'This username is reserved',
        suggestion: `${normalizedUsername}${Math.floor(Math.random() * 999)}`
      }), { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Check availability in database (case-insensitive)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: existing, error: dbError } = await supabase
      .from('users')
      .select('id, profile_username')
      .ilike('profile_username', normalizedUsername)
      .maybeSingle();

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(JSON.stringify({
        available: false,
        error: 'Failed to check availability'
      }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    if (existing) {
      // Generate suggestions
      const suggestions = [
        `${normalizedUsername}${Math.floor(Math.random() * 999)}`,
        `${normalizedUsername}_gaming`,
        `${normalizedUsername}_gg`
      ];

      return new Response(JSON.stringify({
        available: false,
        username: normalizedUsername,
        error: 'This username is already taken',
        suggestions
      }), { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Username is available!
    return new Response(JSON.stringify({
      available: true,
      username: normalizedUsername
    }), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('Error in check-username-availability:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
