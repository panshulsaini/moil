/**
 * =============================================================================
 * MOIL LIMITED PREDICTIVE INTELLIGENCE PLATFORM — MINE DETAILS API ROUTE
 * =============================================================================
 * Route: GET /api/mines/[id]
 * Returns full profile for a specific MOIL mine including its machinery fleet,
 * historical yields, satellite weather records, and active alert plans.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabase } from '@/lib/supabase';
import { formatZodError } from '@/lib/validation';

const ParamsSchema = z.object({
  id: z.string().uuid('Invalid mine UUID format'),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const validationResult = ParamsSchema.safeParse(params);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid mine identifier in URL path',
            details: formatZodError(validationResult.error),
          },
        },
        { status: 400 }
      );
    }

    const { id: mineId } = validationResult.data;
    const db = getSupabase();

    // 1. Fetch mine master record
    const { data: mine, error: mineError } = await db
      .from('mines')
      .select('*')
      .eq('id', mineId)
      .single();

    if (mineError || !mine) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Mine with ID '${mineId}' was not found.`,
          },
        },
        { status: 404 }
      );
    }

    // 2. Fetch all related telemetry and entities
    const [equipmentRes, yieldsRes, weatherRes, predictionsRes, alertsRes] = await Promise.all([
      db.from('mining_equipment').select('*').eq('mine_id', mineId),
      db.from('historical_yields').select('*').eq('mine_id', mineId).order('recorded_date', { ascending: false }).limit(30),
      db.from('weather_telemetry').select('*').eq('mine_id', mineId).order('timestamp', { ascending: false }).limit(24),
      db.from('shortfall_predictions').select('*').eq('mine_id', mineId).order('prediction_timestamp', { ascending: false }).limit(10),
      db.from('corrective_actions').select('*').eq('mine_id', mineId).order('created_at', { ascending: false }),
    ]);

    const equipment = equipmentRes.data || [];
    const yields = yieldsRes.data || [];
    const weather = weatherRes.data || [];
    const predictions = predictionsRes.data || [];
    const alerts = alertsRes.data || [];

    const avgEquipmentHealth =
      equipment.length > 0
        ? Math.round(
            (equipment.reduce((sum: number, eq: any) => sum + Number(eq.health_score), 0) / equipment.length) * 10
          ) / 10
        : 100.0;

    return NextResponse.json({
      success: true,
      data: {
        ...mine,
        average_equipment_health: avgEquipmentHealth,
        equipment,
        historical_yields: yields,
        weather_telemetry: weather,
        shortfall_predictions: predictions,
        corrective_actions: alerts,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: err.message || 'An error occurred while fetching mine profile',
        },
      },
      { status: 500 }
    );
  }
}
