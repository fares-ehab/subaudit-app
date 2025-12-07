import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import Dodo from 'https://esm.sh/dodopayments'

/**
 * Initialize Dodo with explicit bearer token (avoids 401 when env isn't auto-read in Deno).
 */
const createDodoClient = () => {
  const apiKey = Deno.env.get('DODO_PAYMENTS_API_KEY');
  if (!apiKey) {
    throw new Error('Missing DODO_PAYMENTS_API_KEY secret');
  }
  return new Dodo({ bearerToken: apiKey, environment: 'test_mode' });
};

// IMPORTANT: Replace with your actual Dodo Product ID (recurring product)
// Keep the variable for local config; you may also pass productId in the request body to override.
const DODO_PRODUCT_ID_DEFAULT = 'prod_abc123';
const DODO_PRODUCT_ID = Deno.env.get('DODO_PRODUCT_ID') ?? DODO_PRODUCT_ID_DEFAULT
const PLACEHOLDER_VALUE = 'YOUR_PRODUCT_ID_HERE'

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1) Initialize Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SB_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const supabaseAdmin = createClient(supabaseUrl, serviceKey)
    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    })

    // 2) Auth: require a logged-in user
    const {
      data: { user },
      error: userErr,
    } = await supabaseUser.auth.getUser()
    if (userErr) throw new Error(`Auth error: ${userErr.message}`)
    if (!user) throw new Error('User not found.')

    // 3) Parse request
    // Backward compatible: successUrl required; cancelUrl accepted (not used by Dodo which uses a single return_url)
    const body = await req.json()
    const successUrl: string | undefined = body?.successUrl
    const cancelUrl: string | undefined = body?.cancelUrl // optional, we will ignore in request (document limitation), but keep for UI
    const allowedPaymentMethods: string[] | undefined = body?.allowedPaymentMethods
    const currency: string | undefined = body?.currency // optional
    const planName: string = body?.planName ?? 'Pro'
    const productIdOverride: string | undefined = body?.productId
    const quantity: number = body?.quantity ?? 1

    if (!successUrl) throw new Error('successUrl is required.')

    // 4) Resolve product id
    const productId = (productIdOverride ?? DODO_PRODUCT_ID)
    if (!productId || productId === PLACEHOLDER_VALUE) {
      throw new Error('Dodo Product ID is not set. Provide productId in request body or set DODO_PRODUCT_ID.')
    }

    // 5) Get or create customer and persist on profile
    const { data: profile, error: profErr } = await supabaseAdmin
      .from('user_profiles')
      .select('dodo_customer_id')
      .eq('id', user.id)
      .single()
    if (profErr && profErr.code !== 'PGRST116') {
      // tolerate "No rows found" vs. hard failure
      console.warn('Profile read warning:', profErr.message)
    }

    const dodo = createDodoClient()
    let customerId: string | undefined = profile?.dodo_customer_id
    if (!customerId) {
      const customer = await dodo.customers.create({
        email: user.email!,
        metadata: { supabase_id: user.id },
      })
      // Some SDKs expose customer.id vs. customer.customer_id; normalize to id
      customerId = (customer as any)?.id ?? (customer as any)?.customer_id
      if (!customerId) throw new Error('Failed to create/resolve Dodo customer id.')

      const { error: upErr } = await supabaseAdmin
        .from('user_profiles')
        .update({ dodo_customer_id: customerId })
        .eq('id', user.id)
      if (upErr) throw new Error(`Failed to persist customer id: ${upErr.message}`)
    }

    // 6) Create Checkout Session (SDK naming variants: checkoutSessions.create OR checkout.sessions.create)
    const sessionCreator =
      (dodo as any)?.checkoutSessions?.create?.bind((dodo as any).checkoutSessions) ||
      (dodo as any)?.checkout?.sessions?.create?.bind((dodo as any).checkout?.sessions)
    if (!sessionCreator) {
      throw new Error('Dodo SDK missing checkout session creator (checkoutSessions.create). Please update SDK.')
    }

    const payload: Record<string, unknown> = {
      product_cart: [
        {
          product_id: productId,
          quantity,
        },
      ],
      customer: { customer_id: customerId }, // attach existing customer
      // Single URL used by Dodo for both success and failure
      return_url: successUrl,
      // Optional currency (omit if not provided)
      ...(currency ? { billing_currency: currency } : {}),
      // Payment methods (fallback to credit/debit + wallets)
      allowed_payment_method_types:
        Array.isArray(allowedPaymentMethods) && allowedPaymentMethods.length > 0
          ? allowedPaymentMethods
          : ['credit', 'debit', 'apple_pay', 'google_pay'],
      show_saved_payment_methods: true,
      metadata: {
        plan_name: planName,
        supabase_id: user.id,
        // Preserve cancelUrl for your app logic if needed
        ...(cancelUrl ? { cancel_url: cancelUrl } : {}),
      },
    }

    // Execute create call
    const session = await sessionCreator(payload)

    // Normalize response fields between SDK variants
    const checkoutUrl =
      (session as any)?.checkout_url ?? (session as any)?.url ?? (session as any)?.link ?? null
    const sessionId = (session as any)?.session_id ?? (session as any)?.id ?? null

    if (!checkoutUrl) {
      throw new Error('Dodo returned an invalid session (missing checkout URL).')
    }

    return new Response(
      JSON.stringify({ checkoutUrl, sessionId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error: any) {
    const message = error?.message ?? String(error)
    console.error('FATAL ERROR in create-checkout-session:', message)
    // Return 400 so client can handle; do not expose internals
    return new Response(
      JSON.stringify({ error: `Function failed: ${message}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
    )
  }
})