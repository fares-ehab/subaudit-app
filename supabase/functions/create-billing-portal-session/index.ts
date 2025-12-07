import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import Dodo from 'https://esm.sh/dodopayments'

const dodo = new Dodo()

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // 1. Initialize the Admin client correctly. It will be used for all database ops.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SB_SERVICE_ROLE_KEY')!
    );
    
    // 2. Initialize the user-facing client to get the authenticated user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error("User not found.")
    
    const { returnUrl } = await req.json()
    if (!returnUrl) throw new Error("returnUrl is required.")

    // 3. Use the single, correct Admin client to fetch the profile
    const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('dodo_customer_id')
        .eq('id', user.id)
        .single()
        
    if (!profile?.dodo_customer_id) {
      throw new Error("Could not find a billing account for this user.")
    }

    // 4. Create the billing portal session
    const session = await dodo.billingPortal.sessions.create({
      customer: profile.dodo_customer_id,
      return_url: returnUrl,
    });

    return new Response(JSON.stringify({ portalUrl: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error creating billing portal session:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})