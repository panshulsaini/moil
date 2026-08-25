/**
 * =============================================================================
 * UNIT TEST SUITE: HEURISTIC SHORTFALL PREDICTOR & ACTION PLANNER
 * =============================================================================
 * Tests physics-based reserve deficit calculations, weather saturation curves,
 * machinery degradation penalties, and prescriptive action engine.
 */

import { calculateHeuristicPrediction } from '../../lib/fallback-predictor';
import { Mine, MiningEquipment, WeatherTelemetry, PredictRequestDTO } from '../../lib/types';

export function runFallbackPredictorTests() {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  function test(name: string, fn: () => void) {
    try {
      fn();
      results.push({ name, passed: true });
    } catch (err: any) {
      results.push({ name, passed: false, error: err.message || String(err) });
    }
  }

  function assert(condition: boolean, msg: string) {
    if (!condition) throw new Error(msg);
  }

  const sampleMine: Mine = {
    id: 'b01a0001-0000-0000-0000-000000000002',
    code: 'MOIL-DON',
    name: 'Dongri Buzurg Mine',
    state: 'Maharashtra',
    district: 'Bhandara',
    latitude: 21.5583,
    longitude: 79.6833,
    mine_type: 'OPENCAST',
    annual_capacity_mt: 380000.0,
    established_year: 1921,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-08-25T00:00:00Z',
  };

  const sampleEquipment: MiningEquipment[] = [
    {
      id: 'eq-1',
      mine_id: sampleMine.id,
      equipment_code: 'EQ-DON-PUMP-01',
      name: 'Pit Sump Dewatering Pump',
      equipment_type: 'DEWATERING_PUMP',
      model: 'Sulzer 400HP',
      status: 'OPERATIONAL',
      health_score: 92.0,
      operating_hours: 5000,
      vibration_level_mm_s: 1.5,
      temp_celsius: 65.0,
      fuel_efficiency_pct: 90.0,
      last_serviced_date: '2026-07-01',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-08-25T00:00:00Z',
    },
    {
      id: 'eq-2',
      mine_id: sampleMine.id,
      equipment_code: 'EQ-DON-TRK-01',
      name: 'Haul Truck 01',
      equipment_type: 'HAUL_TRUCK',
      model: 'CAT 773E',
      status: 'OPERATIONAL',
      health_score: 88.0,
      operating_hours: 6000,
      vibration_level_mm_s: 2.0,
      temp_celsius: 75.0,
      fuel_efficiency_pct: 85.0,
      last_serviced_date: '2026-07-10',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-08-25T00:00:00Z',
    },
  ];

  const dryWeather: WeatherTelemetry = {
    id: 'w-1',
    mine_id: sampleMine.id,
    timestamp: new Date().toISOString(),
    rainfall_mm: 5.0,
    soil_moisture_pct: 35.0,
    surface_temp_c: 32.0,
    humidity_pct: 45.0,
    wind_speed_kmh: 10.0,
    satellite_ndvi: 0.35,
    flood_risk_index: 0.5,
    created_at: new Date().toISOString(),
  };

  // ---------------------------------------------------------------------------
  // 1. BASELINE BENIGN CONDITIONS TEST
  // ---------------------------------------------------------------------------
  test('Heuristic: Low rainfall & healthy fleet produces LOW shortfall risk', () => {
    const request: PredictRequestDTO = {
      mine_id: sampleMine.id,
      horizon_days: 14,
      target_override_mt: 14500.0,
    };

    const pred = calculateHeuristicPrediction({
      mine: sampleMine,
      equipment: sampleEquipment,
      weather: dryWeather,
      request,
    });

    assert(pred.target_yield_mt === 14500.0, 'Target yield should match override');
    assert(pred.shortfall_risk_level === 'LOW', `Risk level should be LOW, got ${pred.shortfall_risk_level}`);
    assert(pred.shortfall_percentage < 12.0, `Shortfall % should be low (<12%), got ${pred.shortfall_percentage}%`);
    assert(pred.service_mode === 'fallback_heuristic', 'Service mode must indicate fallback_heuristic');
    assert(pred.corrective_actions.length > 0, 'Should propose baseline action');
  });

  // ---------------------------------------------------------------------------
  // 2. MONSOON CLOUDBURST + PUMP BREAKDOWN TEST
  // ---------------------------------------------------------------------------
  test('Heuristic: Severe storm (85mm rain) + failed pump produces CRITICAL risk & urgent dewatering action', () => {
    const stormWeather: WeatherTelemetry = {
      ...dryWeather,
      rainfall_mm: 85.0,
      soil_moisture_pct: 92.0,
      flood_risk_index: 8.8,
    };

    const brokenEquipment: MiningEquipment[] = [
      {
        ...sampleEquipment[0],
        status: 'CRITICAL_FAILURE',
        health_score: 25.0,
      },
      sampleEquipment[1],
    ];

    const request: PredictRequestDTO = {
      mine_id: sampleMine.id,
      horizon_days: 14,
      target_override_mt: 15000.0,
    };

    const pred = calculateHeuristicPrediction({
      mine: sampleMine,
      equipment: brokenEquipment,
      weather: stormWeather,
      request,
    });

    assert(
      pred.shortfall_risk_level === 'CRITICAL' || pred.shortfall_risk_level === 'HIGH',
      `Severe storm must trigger HIGH or CRITICAL risk, got ${pred.shortfall_risk_level}`
    );
    assert(pred.shortfall_percentage >= 25.0, `Shortfall percentage should be >= 25%, got ${pred.shortfall_percentage}%`);
    assert(pred.shortfall_tonnage > 3500.0, `Shortfall tonnage must be significant, got ${pred.shortfall_tonnage} MT`);

    // Verify corrective actions include urgent dewatering pump mobilization
    const dewateringAction = pred.corrective_actions.find((a) => a.action_type === 'DEWATERING_MOBILIZATION');
    assert(dewateringAction !== undefined, 'Must prescribe DEWATERING_MOBILIZATION action');
    assert(dewateringAction?.priority === 'URGENT', 'Dewatering priority must be URGENT');
    assert(dewateringAction!.estimated_yield_recovery_mt > 0, 'Yield recovery must be positive');
  });

  // ---------------------------------------------------------------------------
  // 3. MONOTONICITY TEST
  // ---------------------------------------------------------------------------
  test('Heuristic: Shortfall deficit increases monotonically with rainfall intensity', () => {
    const rainLevels = [10.0, 30.0, 60.0, 90.0];
    let previousShortfall = -1;

    for (const rain of rainLevels) {
      const weather: WeatherTelemetry = {
        ...dryWeather,
        rainfall_mm: rain,
        soil_moisture_pct: Math.min(95, 40 + rain * 0.6),
      };

      const pred = calculateHeuristicPrediction({
        mine: sampleMine,
        equipment: sampleEquipment,
        weather,
        request: { mine_id: sampleMine.id, target_override_mt: 10000.0 },
      });

      assert(
        pred.shortfall_tonnage >= previousShortfall,
        `Monotonicity violated: at rain ${rain}mm shortfall (${pred.shortfall_tonnage}) was not >= previous (${previousShortfall})`
      );
      previousShortfall = pred.shortfall_tonnage;
    }
  });

  // ---------------------------------------------------------------------------
  // 4. BOUNDEDNESS & INTEGRITY TEST
  // ---------------------------------------------------------------------------
  test('Heuristic: Prediction outputs are strictly bounded (Yield >= 0, Confidence in [0, 1])', () => {
    const extremeWeather: WeatherTelemetry = {
      ...dryWeather,
      rainfall_mm: 350.0,
      soil_moisture_pct: 100.0,
    };

    const pred = calculateHeuristicPrediction({
      mine: sampleMine,
      equipment: sampleEquipment,
      weather: extremeWeather,
      request: { mine_id: sampleMine.id, target_override_mt: 5000.0 },
    });

    assert(pred.predicted_yield_mt >= 0, 'Predicted yield cannot be negative');
    assert(pred.shortfall_tonnage <= pred.target_yield_mt, 'Shortfall cannot exceed target yield');
    assert(pred.confidence_score >= 0.0 && pred.confidence_score <= 1.0, 'Confidence score must be in [0, 1]');
    assert(pred.contributing_factors.length === 4, 'Must return 4 detailed contributing factors');
  });

  return results;
}
