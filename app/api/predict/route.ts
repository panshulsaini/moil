/**
 * =============================================================================
 * MOIL LIMITED PREDICTIVE INTELLIGENCE PLATFORM — SHORTFALL PREDICTION ROUTE
 * =============================================================================
 * Route: POST /api/predict
 * Validates simulation parameters via Zod, queries mine telemetry from Supabase,
 * proxies inference to Python FastAPI ML microservice (with automatic mathematical
 * heuristic fallback on disconnect), persists prediction & prescribed actions,
 * and returns structured JSON.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { PredictRequestSchema, formatZodError } from '@/lib/validation';
import { predictShortfall } from '@/lib/api-client';
import { Mine, MiningEquipment, WeatherTelemetry } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'EMPTY_BODY',
            message: 'Request body must be a valid non-empty JSON object',
          },
        },
        { status: 400 }
      );
    }

    // 1. Strict Zod Schema Validation
    const validationResult = PredictRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed for shortfall simulation request',
            details: formatZodError(validationResult.error),
          },
        },
        { status: 400 }
      );
    }

    const predictRequest = validationResult.data;
    const db = getSupabase();

    // 2. Fetch Mine Master Entity
    const { data: mine, error: mineError } = await db
      .from('mines')
      .select('*')
      .eq('id', predictRequest.mine_id)
      .single();

    if (mineError || !mine) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MINE_NOT_FOUND',
            message: `Mine with ID '${predictRequest.mine_id}' does not exist in registry.`,
          },
        },
        { status: 404 }
      );
    }

    // 3. Fetch Equipment Fleet & Latest Telemetry
    const [equipmentRes, weatherRes] = await Promise.all([
      db.from('mining_equipment').select('*').eq('mine_id', mine.id),
      db
        .from('weather_telemetry')
        .select('*')
        .eq('mine_id', mine.id)
        .order('timestamp', { ascending: false })
        .limit(1),
    ]);

    const equipment: MiningEquipment[] = equipmentRes.data || [];
    const latestWeatherList: WeatherTelemetry[] = weatherRes.data || [];
    const defaultWeather: WeatherTelemetry = {
      id: 'mock-weather-default',
      mine_id: mine.id,
      timestamp: new Date().toISOString(),
      rainfall_mm: 15.0,
      soil_moisture_pct: 55.0,
      surface_temp_c: 28.0,
      humidity_pct: 75.0,
      wind_speed_kmh: 12.0,
      satellite_ndvi: 0.45,
      flood_risk_index: 2.0,
      created_at: new Date().toISOString(),
    };
    const weather = latestWeatherList.length > 0 ? latestWeatherList[0] : defaultWeather;

    // 4. Execute Prediction Pipeline (FastAPI Proxy with Heuristic Fallback)
    const predictionResult = await predictShortfall({
      mine: mine as Mine,
      equipment,
      weather,
      request: predictRequest,
    });

    // 5. Persist Prediction Result to Supabase / Mock DB
    const predictionRecord = {
      mine_id: mine.id,
      prediction_timestamp: predictionResult.prediction_timestamp,
      horizon_days: predictionResult.horizon_days,
      target_yield_mt: predictionResult.target_yield_mt,
      predicted_yield_mt: predictionResult.predicted_yield_mt,
      shortfall_tonnage: predictionResult.shortfall_tonnage,
      shortfall_risk_level: predictionResult.shortfall_risk_level,
      confidence_score: predictionResult.confidence_score,
      primary_failure_mode: predictionResult.primary_failure_mode,
      features_snapshot: {
        telemetry: predictionResult.telemetry_snapshot,
        contributing_factors: predictionResult.contributing_factors,
        service_mode: predictionResult.service_mode,
      },
      model_version: predictionResult.model_version,
    };

    const { data: savedPrediction } = await db
      .from('shortfall_predictions')
      .insert(predictionRecord);

    const savedPredictionId = savedPrediction?.id || predictionResult.id;

    // 6. Persist Prescribed Corrective Actions
    if (predictionResult.corrective_actions.length > 0) {
      const actionRecords = predictionResult.corrective_actions.map((act) => ({
        prediction_id: savedPredictionId,
        mine_id: mine.id,
        action_type: act.action_type,
        title: act.title,
        description: act.description,
        priority: act.priority,
        estimated_yield_recovery_mt: act.estimated_yield_recovery_mt,
        cost_estimate_inr: act.cost_estimate_inr,
        status: 'PROPOSED',
      }));

      await db.from('corrective_actions').insert(actionRecords);
    }

    // 7. Audit Logging
    await db.from('audit_logs').insert({
      user_id: 'system_inference',
      action: 'EXECUTE_SHORTFALL_PREDICTION',
      resource_type: 'shortfall_predictions',
      resource_id: savedPredictionId,
      details: {
        mine_code: mine.code,
        risk_level: predictionResult.shortfall_risk_level,
        service_mode: predictionResult.service_mode,
        shortfall_mt: predictionResult.shortfall_tonnage,
      },
    });

    return NextResponse.json({
      success: true,
      data: predictionResult,
    });
  } catch (err: any) {
    console.error('[API Predict] Unhandled error during prediction execution:', err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: err.message || 'An error occurred while processing shortfall prediction',
        },
      },
      { status: 500 }
    );
  }
}
