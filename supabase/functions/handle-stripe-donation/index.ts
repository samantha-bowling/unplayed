
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
  
  console.log("====== Webhook handler started ======");
  console.log(`Request method: ${req.method}`);
  console.log(`Request URL: ${req.url}`);
  
  try {
    // Get the signature from the headers
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      console.error("No Stripe signature found in request headers");
      console.log("Headers received:", Object.fromEntries(req.headers.entries()));
      throw new Error("No Stripe signature found in request");
    }
    
    // Get the webhook secret from environment variables
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      console.error("Stripe webhook secret is not configured in environment variables");
      throw new Error("Stripe webhook secret is not configured");
    }
    
    console.log("Processing webhook with signature:", signature.substring(0, 20) + "...");
    
    // Read the request body
    const body = await req.text();
    console.log("Request body length:", body.length);
    
    // Verify the webhook signature using the async method
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret,
      );
      console.log("Stripe signature verified successfully");
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      throw new Error(`Webhook signature verification failed: ${err.message}`);
    }
    
    console.log(`Event received: ${event.type}, id: ${event.id}`);
    
    // Handle checkout session completed event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      
      console.log("Processing checkout session:", session.id);
      console.log("Session details:", JSON.stringify({
        customer: session.customer,
        customer_details: session.customer_details,
        payment_status: session.payment_status,
        amount_total: session.amount_total,
        custom_fields: session.custom_fields,
      }));
      
      // Extract custom fields from the session
      const customFields = session.custom_fields || [];
      console.log("Custom fields found:", JSON.stringify(customFields));
      
      // Updated to match the actual key from the Stripe event data
      const displayNameField = customFields.find(
        (field) => field.key === "hallofthanksdisplayname" || 
                  (field.label && field.label.custom === "Hall of Thanks Display Name")
      );
      
      // Get display name from custom field
      const displayName = displayNameField?.text?.value || 
                         session.customer_details?.name || 
                         "Anonymous Supporter";
      
      console.log("Display name for donor:", displayName);
      
      try {
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
        
        console.log("Donor saved successfully with display name:", displayName);
      } catch (dbError) {
        console.error("Database operation failed:", dbError);
        throw new Error(`Database operation failed: ${dbError.message}`);
      }
    } else {
      console.log(`Ignoring event type: ${event.type} - we only process checkout.session.completed`);
    }
    
    console.log("====== Webhook handler completed successfully ======");
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error(`Webhook error: ${err.message}`);
    console.error("====== Webhook handler failed ======");
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      },
    );
  }
});
