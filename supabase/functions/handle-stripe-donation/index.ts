
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0";

// Initialize Stripe with the secret key
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

// Supabase client with service role for database operations
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Get the signature from the headers
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("No Stripe signature found in request");
    }
    
    // Get the webhook secret from environment variables
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      throw new Error("Stripe webhook secret is not configured");
    }
    
    // Read the request body
    const body = await req.text();
    
    // Verify the webhook signature
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret,
    );
    
    console.log(`Event received: ${event.type}`);
    
    // Handle checkout session completed event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      
      // Extract custom fields from the session
      const customFields = session.custom_fields || [];
      const displayNameField = customFields.find(
        (field) => field.key === "display_name" || field.label === "Hall of Thanks Display Name"
      );
      
      // Get display name from custom field
      const displayName = displayNameField?.text?.value || 
                         session.customer_details?.name || 
                         "Anonymous Supporter";
      
      // Save donor information to the database
      const { data, error } = await supabaseAdmin
        .from("donors")
        .insert({
          display_name: displayName,
          source: "stripe",
          created_at: new Date().toISOString(),
          approved: true, // Auto-approve for now
        });
      
      if (error) {
        console.error("Error saving donor:", error);
        throw new Error(`Error saving donor: ${error.message}`);
      }
      
      console.log("Donor saved successfully:", displayName);
    }
    
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error(`Webhook error: ${err.message}`);
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      },
    );
  }
});
