/**
 * Health Check Edge Function
 * 
 * Provides a health check endpoint for monitoring and deployment verification
 * Access at: https://your-project.supabase.co/functions/v1/health
 */

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    database: 'connected' | 'disconnected';
    auth: 'available' | 'unavailable';
  };
  version: string;
  environment: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const timestamp = new Date().toISOString();
    let dbStatus: 'connected' | 'disconnected' = 'disconnected';
    let authStatus: 'available' | 'unavailable' = 'unavailable';

    // Test database connection
    try {
      const { error: dbError } = await supabaseClient
        .from('subscriptions')
        .select('id')
        .limit(1);
      
      dbStatus = dbError ? 'disconnected' : 'connected';
    } catch (error) {
      console.error('Database health check failed:', error);
      dbStatus = 'disconnected';
    }

    // Test auth service
    try {
      const { error: authError } = await supabaseClient.auth.admin.listUsers({
        page: 1,
        perPage: 1
      });
      
      authStatus = authError ? 'unavailable' : 'available';
    } catch (error) {
      console.error('Auth health check failed:', error);
      authStatus = 'unavailable';
    }

    const isHealthy = dbStatus === 'connected' && authStatus === 'available';

    const healthStatus: HealthStatus = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp,
      services: {
        database: dbStatus,
        auth: authStatus
      },
      version: '1.0.0',
      environment: Deno.env.get('ENVIRONMENT') || 'production'
    };

    return new Response(JSON.stringify(healthStatus), {
      status: isHealthy ? 200 : 503,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    console.error('Health check error:', error);
    
    const errorStatus: HealthStatus = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'disconnected',
        auth: 'unavailable'
      },
      version: '1.0.0',
      environment: Deno.env.get('ENVIRONMENT') || 'production'
    };

    return new Response(JSON.stringify(errorStatus), {
      status: 503,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});