/**
 * =============================================================================
 * MOIL LIMITED PREDICTIVE INTELLIGENCE PLATFORM — FASTAPI ML API CLIENT
 * =============================================================================
 * Typesafe HTTP client for communicating with the Python FastAPI ML microservice.
 * Embeds automatic heuristic fallback to guarantee 100% frontend availability
 * even when the Python microservice is offline or restarting.
 */

import {
  Mine,
  MiningEquipment,
  WeatherTelemetry,
  PredictRequestDTO,
  PredictResultData,
  FastAPIShortfallRequest,
  FastAPIShortfallResponse,
  RiskLevel,
  ContributingFactor,
  CorrectiveActionPlan,
} from './types';
import { calculateHeuristicPrediction } from './fallback-predictor';

const FASTAPI_BASE_URL =
  process.env.FASTAPI_URL ||
  process.env.NEXT_PUBLIC_FASTAPI_URL ||
  'http://127.0.0.1:8000';

const REQUEST_TIMEOUT_MS = 3000;

export interface PredictPipelineContext {
  mine: Mine;
  equipment: MiningEquipment[];
  weather: WeatherTelemetry;
  request: PredictRequestDTO;
}

/**
 * Check connectivity and health of the Python FastAPI ML microservice.
 */
export async function checkFastApiHealth(): Promise<{
  status: 'up' | 'down' | 'unreachable';
  url: string;
  latency_ms?: number;
  version?: string;
}> {
  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${FASTAPI_BASE_URL}/api/v1/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    }).catch(async () => {
      // Fallback endpoint probe
      return await fetch(`${FASTAPI_BASE_URL}/health`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
    });

    clearTimeout(timeoutId);
    const latency = Date.now() - startTime;

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        status: 'up',
        url: FASTAPI_BASE_URL,
        latency_ms: latency,
        version: data.version || 'v1.0.0-ml',
      };
    } else {
      return {
        status: 'down',
        url: FASTAPI_BASE_URL,
        latency_ms: latency,
      };
    }
  } catch (err) {
    clearTimeout(timeoutId);
    return {
      status: 'unreachable',
      url: FASTAPI_BASE_URL,
      latency_ms: Date.now() - startTime,
    };
  }
}

/**
 * Format domain entity context into FastAPI microservice request payload.
 */
export function buildFastApiPayload(context: PredictPipelineContext): FastAPIShortfallRequest {
  const { mine, equipment, weather, request } = context;

  const horizonDays = request.horizon_days || 14;
  const plannedTonnage = request.target_override_mt || Math.round((mine.annual_capacity_mt / 365) * horizonDays);
  const currentExtraction =
    request.current_extraction_override_mt ?? Math.round(plannedTonnage * 0.75);

  const rainfall = request.weather_overrides?.rainfall_mm ?? weather.rainfall_mm ?? 15.0;
  const soilMoisture =
    request.weather_overrides?.soil_moisture_pct ?? weather.soil_moisture_pct ?? 55.0;

  // Equipment telemetry aggregation
  const equipmentOverridesMap = new Map(
    (request.equipment_status_overrides || []).map((o) => [o.equipment_code, o])
  );

  let activeDumpers = 0;
  let activeExcavators = 0;
  let activePumps = 0;
  let totalPumpCapacityGpm = 0;
  let totalDowntimeHours = 0;

  for (const eq of equipment) {
    const override = equipmentOverridesMap.get(eq.equipment_code);
    const status = override?.status ?? eq.status;

    if (eq.equipment_type === 'HAUL_TRUCK' && status === 'OPERATIONAL') {
      activeDumpers++;
    } else if (eq.equipment_type === 'EXCAVATOR' && status === 'OPERATIONAL') {
      activeExcavators++;
    } else if (eq.equipment_type === 'DEWATERING_PUMP') {
      if (status === 'OPERATIONAL') {
        activePumps++;
        totalPumpCapacityGpm += 1500; // Base GPM
      } else if (status === 'MAINTENANCE_REQUIRED') {
        activePumps += 0.5;
        totalPumpCapacityGpm += 750;
        totalDowntimeHours += 4.0;
      } else if (status === 'CRITICAL_FAILURE') {
        totalDowntimeHours += 12.0;
      }
    }
  }

  // Ensure reasonable baseline if equipment array is empty
  if (activeDumpers === 0) activeDumpers = mine.mine_type === 'OPENCAST' ? 8 : 2;
  if (activeExcavators === 0) activeExcavators = mine.mine_type === 'OPENCAST' ? 3 : 1;
  if (activePumps === 0) activePumps = 2;
  if (totalPumpCapacityGpm === 0) totalPumpCapacityGpm = 3000;

  const haulRoadFriction = Math.max(0.15, Math.min(0.65, 0.45 - (soilMoisture / 100) * 0.2));
  const dumperCycleTime = Math.round((25.0 + (rainfall / 10.0) * 2.5) * 10) / 10;
  const manganeseGrade = mine.code === 'MOIL-BAL' ? 46.5 : mine.code === 'MOIL-DON' ? 38.5 : 42.0;
  const strippingRatio = mine.mine_type === 'OPENCAST' ? 4.5 : 0.8;

  return {
    mine_id: mine.code,
    planned_tonnage: plannedTonnage,
    current_extraction: currentExtraction,
    rainfall_mm_per_hr: rainfall,
    soil_moisture_percent: soilMoisture,
    pore_water_pressure_kpa: (weather.flood_risk_index || 2.0) * 12.5,
    active_dumpers: activeDumpers,
    active_excavators: activeExcavators,
    active_pumps: Math.max(1, Math.round(activePumps)),
    pump_capacity_gpm: totalPumpCapacityGpm,
    dumper_cycle_time_min: dumperCycleTime,
    haul_road_friction_coeff: haulRoadFriction,
    unscheduled_downtime_hours: totalDowntimeHours,
    manganese_grade_percent: manganeseGrade,
    stripping_ratio: strippingRatio,
  };
}

/**
 * Predict manganese shortfall by calling the FastAPI ML microservice,
 * with seamless fallback to mathematical heuristic predictor on failure.
 */
export async function predictShortfall(
  context: PredictPipelineContext
): Promise<PredictResultData> {
  const { mine, request } = context;
  const payload = buildFastApiPayload(context);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${FASTAPI_BASE_URL}/api/v1/predict/shortfall`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const mlResponse: FastAPIShortfallResponse = await res.json();
      const targetYield = payload.planned_tonnage;
      const shortfallTonnage = mlResponse.expected_shortfall_tonnes;
      const predictedYield = Math.max(0, targetYield - shortfallTonnage);
      const shortfallPercentage = Math.round((shortfallTonnage / targetYield) * 10000) / 100;

      const contributingFactors: ContributingFactor[] = Object.entries(
        mlResponse.feature_contributions || {}
      ).map(([factor, weight]) => ({
        factor: factor.replace(/_/g, ' ').toUpperCase(),
        impact_pct: Math.round(weight * 1000) / 10,
        description: `ML Feature sensitivity contribution of ${(weight * 100).toFixed(1)}% to predicted reserve deficit.`,
      }));

      const correctiveActions: CorrectiveActionPlan[] = (mlResponse.corrective_actions || []).map(
        (act) => ({
          id: act.id,
          action_type: act.category,
          title: act.title,
          description: act.description,
          priority: act.priority,
          estimated_yield_recovery_mt: act.estimated_tonnage_recovery,
          cost_estimate_inr: act.estimated_tonnage_recovery * 120.0, // Benchmark recovery cost model
        })
      );

      return {
        id: `pred-fastapi-${mine.code.toLowerCase()}-${Date.now()}`,
        mine_id: mine.id,
        mine_name: mine.name,
        mine_code: mine.code,
        prediction_timestamp: mlResponse.timestamp || new Date().toISOString(),
        horizon_days: request.horizon_days || 14,
        target_yield_mt: targetYield,
        predicted_yield_mt: predictedYield,
        shortfall_tonnage: shortfallTonnage,
        shortfall_percentage: shortfallPercentage,
        shortfall_risk_level: mlResponse.risk_level as RiskLevel,
        confidence_score: mlResponse.confidence_score,
        primary_failure_mode:
          mlResponse.risk_level === 'LOW'
            ? 'Normal Operations'
            : `Predicted Operational Deficit (${mlResponse.risk_level})`,
        contributing_factors: contributingFactors,
        corrective_actions: correctiveActions,
        model_version: 'v1.0.0-xgb-fastapi',
        service_mode: 'fastapi_inference',
        telemetry_snapshot: {
          rainfall_mm: payload.rainfall_mm_per_hr,
          soil_moisture_pct: payload.soil_moisture_percent,
          equipment_health_avg: 85.0,
        },
      };
    } else {
      console.warn(
        `[API Client] FastAPI returned HTTP ${res.status}. Triggering heuristic fallback engine.`
      );
      return calculateHeuristicPrediction(context);
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.info(
      `[API Client] FastAPI ML service unavailable (${err.message || 'offline'}). Seamlessly activating heuristic fallback predictor.`
    );
    return calculateHeuristicPrediction(context);
  }
}
