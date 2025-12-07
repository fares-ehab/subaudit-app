import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import Dodo from 'https://esm.sh/dodopayments'

/**
 * Webhook handler for Dodo Payments
 * - Signature verification using header: "Dodo-Signature"
 * - Idempotency: hashes raw body (SHA-256) and stores in webhook_event_log to skip duplicates
 * - Syncs user_profiles subscription fields on payment.* and subscription.* events
 *
 * Required secrets:
 * - DODO_WEBHOOK_SECRET
 * - SUPABASE_URL
 * - SB_SERVICE_ROLE_KEY
 * - DODO_PAYMENTS_API_KEY (auto-read by the Dodo SDK)
 *
 * Endpoint to register in Dodo (test_mode/prod):
 *   https://<PROJECT-REF>.supabase.co/functions/v1/dodo-webhook
 */

const dodo = new Dodo()

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1) Read raw body and verify signature before parsing
    const signature = req.headers.get('Dodo-Signature')
    const webhookSecret = Deno.env.get('DODO_WEBHOOK_SECRET')

    if (!signature || !webhookSecret) {
      return new Response(JSON.stringify({ error: 'Missing signature or secret' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const rawBody = await req.text()
    // Verify signature and construct event
    const event = dodo.webhooks.constructEvent(rawBody, signature, webhookSecret)

    // 2) Initialize Supabase Admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SB_SERVICE_ROLE_KEY')!
    )

    // 3) Idempotency guard using SHA-256 of raw body
    const encoder = new TextEncoder()
    const digest = await crypto.subtle.digest('SHA-256', encoder.encode(rawBody))
    const eventKey = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    const type = (event as any)?.type ?? ''
    try {
      const { error: insertErr } = await supabaseAdmin
        .from('webhook_event_log')
        .insert({ event_key: eventKey, event_type: type })

      // If duplicate (unique violation), treat as successfully processed already
      if (insertErr && insertErr.code === '23505') {
        console.log('Duplicate webhook delivery detected, skipping processing.')
        return new Response(JSON.stringify({ received: true, duplicate: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }
      if (insertErr) {
        throw new Error(`Idempotency insert failed: ${insertErr.message}`)
      }
    } catch (e) {
      if ((e as any)?.code === '23505') {
        console.log('Duplicate webhook delivery detected (catch), skipping processing.')
        return new Response(JSON.stringify({ received: true, duplicate: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }
      throw e
    }

    // 4) Extract common fields safely
    const data = (event as any)?.data ?? {}
    const metadata = data?.metadata ?? {}

    const supabaseId: string | undefined =
      metadata?.supabase_id ||
      data?.customer?.metadata?.supabase_id ||
      data?.metadata?.user_id

    const planName: string | undefined = metadata?.plan_name
    const subscriptionId: string | undefined =
      data?.subscription_id || data?.id || data?.subscription?.id
    const customerId: string | undefined =
      data?.customer_id || data?.customer?.customer_id || data?.customer?.id

    // Helpers
    const updateByUserId = async (userId: string, values: Record<string, unknown>) => {
      if (!userId) return
      const { error } = await supabaseAdmin.from('user_profiles').update(values).eq('id', userId)
      if (error) throw new Error(`Supabase updateByUserId failed: ${error.message}`)
    }

    const updateBySubscriptionId = async (subId: string, values: Record<string, unknown>) => {
      if (!subId) return
      const { error } = await supabaseAdmin
        .from('user_profiles')
        .update(values)
        .eq('dodo_subscription_id', subId)
      if (error) throw new Error(`Supabase updateBySubscriptionId failed: ${error.message}`)
    }

    const updateByCustomerId = async (custId: string, values: Record<string, unknown>) => {
      if (!custId) return
      const { error } = await supabaseAdmin
        .from('user_profiles')
        .update(values)
        .eq('dodo_customer_id', custId)
      if (error) throw new Error(`Supabase updateByCustomerId failed: ${error.message}`)
    }

    // 5) Route by event type
    switch (type) {
      // Payments
      case 'payment.succeeded': {
        if (supabaseId) {
          await updateByUserId(supabaseId, {
            ...(planName ? { subscription_plan: planName } : {}),
            ...(subscriptionId ? { dodo_subscription_id: subscriptionId } : {}),
            ...(customerId ? { dodo_customer_id: customerId } : {}),
          })
        } else if (customerId) {
          await updateByCustomerId(customerId, {
            ...(planName ? { subscription_plan: planName } : {}),
            ...(subscriptionId ? { dodo_subscription_id: subscriptionId } : {}),
          })
        }
        console.log(`payment.succeeded processed; sub=${subscriptionId ?? 'n/a'} cust=${customerId ?? 'n/a'}`)
        break
      }

      case 'payment.failed': {
        console.log(`payment.failed for cust=${customerId ?? 'n/a'} sub=${subscriptionId ?? 'n/a'}`)
        break
      }

      // Subscriptions activated/renewed
      case 'subscription.active':
      case 'subscription.renewed': {
        if (supabaseId) {
          await updateByUserId(supabaseId, {
            ...(subscriptionId ? { dodo_subscription_id: subscriptionId } : {}),
            ...(customerId ? { dodo_customer_id: customerId } : {}),
            ...(planName ? { subscription_plan: planName } : {}),
          })
        } else if (subscriptionId) {
          await updateBySubscriptionId(subscriptionId, {
            ...(planName ? { subscription_plan: planName } : {}),
          })
        } else if (customerId) {
          await updateByCustomerId(customerId, {
            ...(planName ? { subscription_plan: planName } : {}),
          })
        }
        console.log(`${type} processed; sub=${subscriptionId ?? 'n/a'} cust=${customerId ?? 'n/a'}`)
        break
      }

      // Plan changed
      case 'subscription.plan_changed': {
        if (supabaseId) {
          await updateByUserId(supabaseId, {
            ...(planName ? { subscription_plan: planName } : {}),
            ...(subscriptionId ? { dodo_subscription_id: subscriptionId } : {}),
            ...(customerId ? { dodo_customer_id: customerId } : {}),
          })
        } else if (subscriptionId) {
          await updateBySubscriptionId(subscriptionId, {
            ...(planName ? { subscription_plan: planName } : {}),
          })
        } else if (customerId) {
          await updateByCustomerId(customerId, {
            ...(planName ? { subscription_plan: planName } : {}),
          })
        }
        console.log(`subscription.plan_changed -> plan=${planName ?? 'n/a'}`)
        break
      }

      // Cancelled / failed / expired -> downgrade
      case 'subscription.cancelled':
      case 'subscription.failed':
      case 'subscription.expired': {
        if (subscriptionId) {
          await updateBySubscriptionId(subscriptionId, {
            subscription_plan: 'Free Starter',
            dodo_subscription_id: null,
          })
        } else if (supabaseId) {
          await updateByUserId(supabaseId, {
            subscription_plan: 'Free Starter',
            dodo_subscription_id: null,
          })
        } else if (customerId) {
          await updateByCustomerId(customerId, {
            subscription_plan: 'Free Starter',
            dodo_subscription_id: null,
          })
        }
        console.log(`${type} -> downgraded user; sub=${subscriptionId ?? 'n/a'}`)
        break
      }

      case 'subscription.on_hold': {
        console.log('subscription.on_hold received; no hold field in schema, logged only.')
        break
      }

      default: {
        console.log(`Unhandled Dodo event: ${type}`)
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    console.error('Webhook processing error:', err)
    return new Response(JSON.stringify({ error: 'Webhook handler failed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
