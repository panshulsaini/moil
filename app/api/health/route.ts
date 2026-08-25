/**
 * =============================================================================
 * MOIL LIMITED PREDICTIVE INTELLIGENCE PLATFORM — HEALTH CHECK ROUTE
 * =============================================================================
 * Route: GET /api/health
 * Probes Next.js runtime, Supabase DB connection, and FastAPI ML microservice.
 */

import { NextResponse } from 'next/server';
import { getSupabase, isMockMode } from '@/lib/supabase';
import { checkFastApiHealth } from '@/lib/api-client';
import { HealthStatus } from '@/lib/types';

const START_TIME = Date.now();

export async function GET() {
  const db = getSupabase();
  const mockMode = isMockMode();

  // Test database connectivity
  let dbConnected = false;
  try {
    const { data, error } = await db.from('mines').select('id').limit(1);
    if (!error && data) {
      dbConnected = true;
    }
  } catch (err) {
    dbConnected = false;
  }

  // Test FastAPI ML microservice connectivity
  const fastApiHealth = await checkFastApiHealth();

  const isHealthy = dbConnected;
  const isDegraded = !isHealthy || fastApiHealth.status !== 'up';

  const healthData: HealthStatus = {
    status: isHealthy ? (fastApiHealth.status === 'up' ? 'healthy' : 'degraded') : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.floor((Date.now() - START_TIME) / 1000),
    components: {
      nextjs_api: {
        status: 'up',
        version: '14.2.0-app-router',
      },
      database: {
        status: dbConnected ? 'up' : 'down',
        mode: mockMode ? 'in_memory_mock' : 'live_supabase',
        connected: dbConnected,
      },
      fastapi_ml: {
        status: fastApiHealth.status,
        url: fastApiHealth.url,
        latency_ms: fastApiHealth.latency_ms,
      },
    },
  };

  return NextResponse.json(healthData, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
