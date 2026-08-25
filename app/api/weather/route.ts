/**
 * =============================================================================
 * MOIL LIMITED PREDICTIVE INTELLIGENCE PLATFORM — WEATHER TELEMETRY API ROUTE
 * =============================================================================
 * Route: GET /api/weather, POST /api/weather
 * Queries and ingests simulated satellite radar rainfall, soil moisture, and flood risk.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabase } from '@/lib/supabase';
import { WeatherQuerySchema, formatZodError } from '@/lib/validation';

const TelemetryIngestSchema = z.object({
  mine_id: z.string().uuid('Invalid mine ID format'),
  rainfall_mm: z.number().min(0).max(500),
  soil_moisture_pct: z.number().min(0).max(100),
  surface_temp_c: z.number().min(-20).max(65).default(28.0),
  humidity_pct: z.number().min(0).max(100).default(75.0),
  wind_speed_kmh: z.number().min(0).max(200).default(15.0),
  satellite_ndvi: z.number().min(-1.0).max(1.0).default(0.45),
  flood_risk_index: z.number().min(0).max(10).default(2.0),
  timestamp: z.string().datetime().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryObj: Record<string, any> = {};

    if (searchParams.has('mine_id')) queryObj.mine_id = searchParams.get('mine_id');
    if (searchParams.has('limit')) queryObj.limit = searchParams.get('limit');

    const validationResult = WeatherQuerySchema.safeParse(queryObj);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid weather query parameters',
            details: formatZodError(validationResult.error),
          },
        },
        { status: 400 }
      );
    }

    const { mine_id, limit = 20 } = validationResult.data;
    const db = getSupabase();

    let query = db.from('weather_telemetry').select('*');
    if (mine_id) query = query.eq('mine_id', mine_id);

    const { data: telemetry, error } = await query
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json(
        { success: false, error: { code: 'DB_ERROR', message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: (telemetry || []).length,
      data: telemetry || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: err.message || 'Failed to fetch weather telemetry',
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: { code: 'EMPTY_BODY', message: 'Request body cannot be empty' } },
        { status: 400 }
      );
    }

    const validationResult = TelemetryIngestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid telemetry ingest payload',
            details: formatZodError(validationResult.error),
          },
        },
        { status: 400 }
      );
    }

    const db = getSupabase();
    const ingestData = {
      ...validationResult.data,
      timestamp: validationResult.data.timestamp || new Date().toISOString(),
    };

    const { data: inserted, error } = await db.from('weather_telemetry').insert(ingestData);
    if (error) {
      return NextResponse.json(
        { success: false, error: { code: 'DB_ERROR', message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Satellite weather telemetry ingested successfully',
        data: inserted,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: err.message || 'Failed to ingest weather telemetry',
        },
      },
      { status: 500 }
    );
  }
}
