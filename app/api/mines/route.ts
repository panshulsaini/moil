/**
 * =============================================================================
 * MOIL LIMITED PREDICTIVE INTELLIGENCE PLATFORM — MINES API ROUTE
 * =============================================================================
 * Route: GET /api/mines
 * Returns list of all MOIL manganese mining units with aggregated equipment health,
 * latest radar weather telemetry, and shortfall predictions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { MinesQuerySchema, formatZodError } from '@/lib/validation';
import { Mine, MiningEquipment, WeatherTelemetry, ShortfallPrediction, CorrectiveAction, MineSummary } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryObj: Record<string, any> = {};

    if (searchParams.has('state')) queryObj.state = searchParams.get('state');
    if (searchParams.has('mine_type')) queryObj.mine_type = searchParams.get('mine_type');
    if (searchParams.has('is_active')) queryObj.is_active = searchParams.get('is_active');

    const validationResult = MinesQuerySchema.safeParse(queryObj);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: formatZodError(validationResult.error),
          },
        },
        { status: 400 }
      );
    }

    const { state, mine_type, is_active } = validationResult.data;
    const db = getSupabase();

    // 1. Fetch mines
    let minesQuery = db.from('mines').select('*');
    if (state) minesQuery = minesQuery.eq('state', state);
    if (mine_type) minesQuery = minesQuery.eq('mine_type', mine_type);
    if (is_active !== undefined) minesQuery = minesQuery.eq('is_active', is_active);

    const { data: mines, error: minesError } = await minesQuery.order('code', { ascending: true });
    if (minesError) {
      return NextResponse.json(
        { success: false, error: { code: 'DB_ERROR', message: minesError.message } },
        { status: 500 }
      );
    }

    // 2. Fetch related data for aggregation
    const [equipmentRes, weatherRes, predictionsRes, alertsRes] = await Promise.all([
      db.from('mining_equipment').select('*'),
      db.from('weather_telemetry').select('*').order('timestamp', { ascending: false }),
      db.from('shortfall_predictions').select('*').order('prediction_timestamp', { ascending: false }),
      db.from('corrective_actions').select('*').in('status', ['PROPOSED', 'ACKNOWLEDGED']),
    ]);

    const equipmentList: MiningEquipment[] = equipmentRes.data || [];
    const weatherList: WeatherTelemetry[] = weatherRes.data || [];
    const predictionsList: ShortfallPrediction[] = predictionsRes.data || [];
    const activeAlertsList: CorrectiveAction[] = alertsRes.data || [];

    // 3. Aggregate metrics per mine
    const mineSummaries: MineSummary[] = (mines as Mine[]).map((mine) => {
      const mineEquipment = equipmentList.filter((eq) => eq.mine_id === mine.id);
      const equipmentCount = mineEquipment.length;
      const avgHealth =
        equipmentCount > 0
          ? Math.round(
              (mineEquipment.reduce((sum, eq) => sum + Number(eq.health_score), 0) / equipmentCount) * 10
            ) / 10
          : 100.0;

      const latestWeather = weatherList.find((w) => w.mine_id === mine.id) || null;
      const latestPrediction = predictionsList.find((p) => p.mine_id === mine.id) || null;
      const activeAlertsCount = activeAlertsList.filter((a) => a.mine_id === mine.id).length;

      return {
        ...mine,
        equipment_count: equipmentCount,
        average_equipment_health: avgHealth,
        latest_weather: latestWeather,
        latest_prediction: latestPrediction,
        active_alerts_count: activeAlertsCount,
      };
    });

    return NextResponse.json({
      success: true,
      count: mineSummaries.length,
      data: mineSummaries,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: err.message || 'An unexpected error occurred while fetching mines',
        },
      },
      { status: 500 }
    );
  }
}
