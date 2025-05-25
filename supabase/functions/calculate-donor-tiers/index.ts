
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

// Supabase client with service role for database operations
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Define our tier thresholds
const TIER_THRESHOLDS = {
  LEGENDARY: 0.1, // Top 10%
  RADIANT: 0.3,  // Top 30% (inclusive of top 10%)
  // Everyone else is "APPRECIATED"
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Get the JWT from the request headers
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Verify the user is authenticated and has admin role
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error(`Authentication failed: ${authError?.message || 'User not found'}`);
    }
    
    // Check if user has admin role in user_metadata
    const isAdmin = user.user_metadata?.role === 'admin';
    
    if (!isAdmin) {
      return new Response(JSON.stringify({
        error: "Unauthorized: Admin role required"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403
      });
    }
    
    console.log("====== Tier calculation started ======");
    
    // Get all donors with amount_cents values
    const { data: donors, error: fetchError } = await supabaseAdmin
      .from("donors")
      .select("id, amount_cents")
      .not("amount_cents", "is", null)
      .order("amount_cents", { ascending: false });
    
    if (fetchError) {
      throw new Error(`Error fetching donors: ${fetchError.message}`);
    }
    
    console.log(`Found ${donors.length} donors with amount data`);
    
    // If we have no donors with amount data, exit early
    if (donors.length === 0) {
      return new Response(JSON.stringify({ message: "No donors with amount data to process" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    // Calculate tier thresholds based on index
    const legendaryThresholdIndex = Math.ceil(donors.length * TIER_THRESHOLDS.LEGENDARY) - 1;
    const radiantThresholdIndex = Math.ceil(donors.length * TIER_THRESHOLDS.RADIANT) - 1;
    
    console.log(`Legendary threshold index: ${legendaryThresholdIndex}`);
    console.log(`Radiant threshold index: ${radiantThresholdIndex}`);
    
    // Process donors in batches
    const batchSize = 50;
    const now = new Date().toISOString();
    let updatedCount = 0;
    
    for (let i = 0; i < donors.length; i += batchSize) {
      const batch = donors.slice(i, i + batchSize);
      
      // Prepare batch updates
      const updates = batch.map((donor, batchIndex) => {
        const globalIndex = i + batchIndex;
        let tier;
        
        // Assign tier based on position
        if (globalIndex <= legendaryThresholdIndex) {
          tier = "legendary";
        } else if (globalIndex <= radiantThresholdIndex) {
          tier = "radiant";
        } else {
          tier = "appreciated";
        }
        
        return {
          id: donor.id,
          tier,
          tier_updated_at: now
        };
      });
      
      // Update database with the calculated tiers
      const { error: updateError } = await supabaseAdmin
        .from("donors")
        .upsert(updates);
      
      if (updateError) {
        throw new Error(`Error updating donor tiers: ${updateError.message}`);
      }
      
      updatedCount += batch.length;
      console.log(`Updated ${updatedCount}/${donors.length} donor tiers`);
    }
    
    // Handle donors without amount data (set to "appreciated" tier)
    const { error: noAmountUpdateError } = await supabaseAdmin
      .from("donors")
      .update({ 
        tier: "appreciated",
        tier_updated_at: now
      })
      .is("amount_cents", null);
    
    if (noAmountUpdateError) {
      console.error(`Error updating donors without amounts: ${noAmountUpdateError.message}`);
    } else {
      console.log("Successfully updated donors without amount data to 'appreciated' tier");
    }
    
    console.log("====== Tier calculation completed successfully ======");
    return new Response(JSON.stringify({ 
      success: true, 
      message: `Updated tiers for ${updatedCount} donors with amounts`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error(`Tier calculation error: ${err.message}`);
    console.error("====== Tier calculation failed ======");
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
