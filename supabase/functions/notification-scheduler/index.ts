/*
  # Notification Scheduler Edge Function
  
  This function runs on a schedule (via cron job) to:
  1. Find subscriptions that are 5 days away from renewal
  2. Check if notification hasn't been sent already
  3. Send renewal reminder notifications
  4. Log the notification in the database
  
  Deploy this function and set up a cron job to run it daily.
*/

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Subscription {
  id: string;
  user_id: string;
  name: string;
  cost: number;
  billing_cycle: string;
  next_renewal_date: string;
  category: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key for admin access
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Calculate date 5 days from now
    const fiveDaysFromNow = new Date();
    fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);
    const targetDate = fiveDaysFromNow.toISOString().split('T')[0];
    
    // Also check for today's renewals that might have been missed
    const today = new Date().toISOString().split('T')[0];

    console.log(`Looking for subscriptions renewing on: ${targetDate} and ${today}`);

    // Find subscriptions that renew in 5 days
    const { data: subscriptions, error: subscriptionsError } = await supabaseClient
      .from('subscriptions')
      .select('*')
      .in('next_renewal_date', [targetDate, today])
      .eq('is_active', true);

    if (subscriptionsError) {
      throw subscriptionsError;
    }

    console.log(`Found ${subscriptions?.length || 0} subscriptions for notification`);

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No subscriptions found for notification' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const notificationResults = [];

    for (const subscription of subscriptions) {
      try {
        // Check if we've already sent a notification for this renewal
        const { data: existingNotifications } = await supabaseClient
          .from('notification_logs')
          .select('id')
          .eq('subscription_id', subscription.id)
          .eq('notification_type', 'renewal_reminder')
          .gte('sent_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Within last 7 days

        if (existingNotifications && existingNotifications.length > 0) {
          console.log(`Notification already sent for subscription: ${subscription.name}`);
          continue;
        }

        // Create notification log entry
        const { data: notificationLog, error: logError } = await supabaseClient
          .from('notification_logs')
          .insert([{
            subscription_id: subscription.id,
            user_id: subscription.user_id,
            notification_type: 'renewal_reminder',
            sent_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (logError) {
          console.error(`Error logging notification for ${subscription.name}:`, logError);
          continue;
        }

        // Here you would integrate with your email service (SendGrid, Resend, etc.)
        // For now, we'll just log the notification
        console.log(`Notification scheduled for: ${subscription.name} (${subscription.user_id})`);
        
        // Example email content that would be sent:
        const emailContent = {
          to: subscription.user_id, // In real implementation, you'd get user email
          subject: `${subscription.name} renews in 5 days - Still valuable?`,
          html: `
            <h2>Renewal Reminder</h2>
            <p>Your ${subscription.name} subscription renews in 5 days.</p>
            <p><strong>Cost:</strong> $${subscription.cost}/${subscription.billing_cycle}</p>
            <p><strong>Renewal Date:</strong> ${subscription.next_renewal_date}</p>
            <p>Does this subscription still provide value to you?</p>
            <div style="margin: 20px 0;">
              <a href="${Deno.env.get('SUPABASE_URL')}/notifications" 
                 style="background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-right: 10px;">
                Review Subscription
              </a>
            </div>
          `
        };

        notificationResults.push({
          subscription: subscription.name,
          user_id: subscription.user_id,
          notification_id: notificationLog.id,
          status: 'scheduled'
        });

      } catch (error) {
        console.error(`Error processing subscription ${subscription.name}:`, error);
        notificationResults.push({
          subscription: subscription.name,
          user_id: subscription.user_id,
          status: 'error',
          error: error.message
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: `Processed ${subscriptions.length} subscriptions`,
        results: notificationResults
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in notification scheduler:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});