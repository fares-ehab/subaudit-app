/*
  # Email Notification Sender Edge Function
  
  This function integrates with email services to send actual renewal reminder emails.
  It works with the notification-scheduler to send emails when notifications are logged.
  
  Supports multiple email providers:
  - Resend (recommended)
  - SendGrid
  - Nodemailer with SMTP
*/

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailProvider {
  sendEmail(to: string, subject: string, html: string): Promise<boolean>;
}

// Resend Email Provider
class ResendProvider implements EmailProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'SubAudit <noreply@subaudit.com>',
          to: [to],
          subject,
          html,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Resend email error:', error);
      return false;
    }
  }
}

// SendGrid Email Provider
class SendGridProvider implements EmailProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: 'noreply@subaudit.com', name: 'SubAudit' },
          subject,
          content: [{ type: 'text/html', value: html }],
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('SendGrid email error:', error);
      return false;
    }
  }
}

const getEmailProvider = (): EmailProvider | null => {
  const resendKey = Deno.env.get('RESEND_API_KEY');
  const sendGridKey = Deno.env.get('SENDGRID_API_KEY');

  if (resendKey) {
    return new ResendProvider(resendKey);
  } else if (sendGridKey) {
    return new SendGridProvider(sendGridKey);
  }

  return null;
};

const generateRenewalEmailHTML = (subscription: any, userEmail: string) => {
  const appUrl = Deno.env.get('APP_URL') || 'https://subaudit.com';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Renewal Reminder - ${subscription.name}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
        .subscription-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .button { display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px 5px; }
        .button.secondary { background: #6b7280; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; border-radius: 0 0 8px 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔔 Renewal Reminder</h1>
          <p>Time for a mindful spending check-in</p>
        </div>
        
        <div class="content">
          <h2>Your ${subscription.name} subscription renews in 5 days</h2>
          
          <p>Before it automatically renews, take a moment to consider:</p>
          <p><strong>Does this subscription still provide value to you?</strong></p>
          
          <div class="subscription-card">
            <h3>${subscription.name}</h3>
            <p><strong>Cost:</strong> $${subscription.cost}/${subscription.billing_cycle}</p>
            <p><strong>Renewal Date:</strong> ${new Date(subscription.next_renewal_date).toLocaleDateString()}</p>
            <p><strong>Category:</strong> ${subscription.category}</p>
          </div>
          
          <p>This is your opportunity to make a conscious decision about your recurring spending. You can:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${appUrl}/notifications" class="button">Review & Decide</a>
          </div>
          
          <p><small>💡 <strong>Tip:</strong> Consider when you last used this service and whether it aligns with your current needs and budget.</small></p>
        </div>
        
        <div class="footer">
          <p>This email was sent by SubAudit to help you make mindful subscription decisions.</p>
          <p>You can manage your notifications in your <a href="${appUrl}">dashboard</a>.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const emailProvider = getEmailProvider();
    if (!emailProvider) {
      throw new Error('No email provider configured. Set RESEND_API_KEY or SENDGRID_API_KEY environment variable.');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get recent notification logs that haven't been emailed yet
    const { data: notifications, error: notificationsError } = await supabaseClient
      .from('notification_logs')
      .select(`
        *,
        subscriptions (
          id,
          name,
          cost,
          billing_cycle,
          next_renewal_date,
          category,
          user_id
        )
      `)
      .eq('notification_type', 'renewal_reminder')
      .is('email_sent', null)
      .gte('sent_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
      .limit(50);

    if (notificationsError) {
      throw notificationsError;
    }

    if (!notifications || notifications.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No notifications to email' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailResults = [];

    for (const notification of notifications) {
      try {
        const subscription = (notification as any).subscriptions;
        if (!subscription) continue;

        // Get user email
        const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserById(subscription.user_id);
        if (userError || !userData.user?.email) {
          console.error(`No email found for user ${subscription.user_id}`);
          continue;
        }

        const userEmail = userData.user.email;
        const subject = `${subscription.name} renews in 5 days - Still valuable?`;
        const html = generateRenewalEmailHTML(subscription, userEmail);

        // Send email
        const emailSent = await emailProvider.sendEmail(userEmail, subject, html);

        if (emailSent) {
          // Mark notification as emailed
          await supabaseClient
            .from('notification_logs')
            .update({ 
              email_sent: true,
              email_sent_at: new Date().toISOString()
            })
            .eq('id', notification.id);

          emailResults.push({
            notification_id: notification.id,
            subscription: subscription.name,
            user_email: userEmail,
            status: 'sent'
          });
        } else {
          emailResults.push({
            notification_id: notification.id,
            subscription: subscription.name,
            user_email: userEmail,
            status: 'failed'
          });
        }

      } catch (error) {
        console.error(`Error processing notification ${notification.id}:`, error);
        emailResults.push({
          notification_id: notification.id,
          status: 'error',
          error: error.message
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: `Processed ${notifications.length} notifications`,
        results: emailResults
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in email sender:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});