/**
 * Health Check Endpoint
 * 
 * Simple health check for monitoring and deployment verification
 */

import { supabase } from '../lib/supabase';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    database: 'connected' | 'disconnected';
    auth: 'available' | 'unavailable';
  };
  version: string;
}

export const checkHealth = async (): Promise<HealthStatus> => {
  const timestamp = new Date().toISOString();
  let dbStatus: 'connected' | 'disconnected' = 'disconnected';
  let authStatus: 'available' | 'unavailable' = 'unavailable';

  try {
    // Test database connection
    const { error: dbError } = await supabase
      .from('subscriptions')
      .select('id')
      .limit(1);
    
    dbStatus = dbError ? 'disconnected' : 'connected';

    // Test auth service
    const { error: authError } = await supabase.auth.getSession();
    authStatus = authError ? 'unavailable' : 'available';

  } catch (error) {
    console.error('Health check error:', error);
  }

  const isHealthy = dbStatus === 'connected' && authStatus === 'available';

  return {
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp,
    services: {
      database: dbStatus,
      auth: authStatus
    },
    version: '1.0.0'
  };
};

// For use in edge functions or API routes
export const healthHandler = async () => {
  try {
    const health = await checkHealth();
    
    return new Response(JSON.stringify(health), {
      status: health.status === 'healthy' ? 200 : 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};