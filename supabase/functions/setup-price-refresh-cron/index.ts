
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  try {
    console.log('Setting up background price refresh cron job...');
    
    // Create a daily cron job to refresh stale prices
    const { data, error } = await supabase.rpc('create_cron_job', {
      job_name: 'daily-price-refresh',
      schedule: '0 2 * * *', // Every day at 2 AM UTC
      command: `
        SELECT net.http_post(
          url := 'https://gwmygthanyycveyqqspr.supabase.co/functions/v1/background-price-refresh',
          headers := '{"Content-Type": "application/json", "Authorization": "Bearer ${supabaseKey}"}'::jsonb,
          body := '{"source": "cron"}'::jsonb
        ) as request_id;
      `
    });
    
    if (error) {
      console.error('Error setting up cron job:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('Cron job setup successful:', data);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Background price refresh cron job configured successfully',
      schedule: 'Daily at 2 AM UTC',
      data
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error in setup-price-refresh-cron:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
