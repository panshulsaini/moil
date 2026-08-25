/**
 * =============================================================================
 * UNIT TEST SUITE: ZOD VALIDATION & SCHEMA INTEGRITY
 * =============================================================================
 * Tests strict schema validation rules, boundary values, and error formatting.
 */

import {
  PredictRequestSchema,
  AlertUpdateSchema,
  AlertCreateSchema,
  EquipmentCreateSchema,
  MinesQuerySchema,
  WeatherOverrideSchema,
  EquipmentOverrideSchema,
  formatZodError,
} from '../../lib/validation';

export function runValidationTests() {
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

  // ---------------------------------------------------------------------------
  // 1. PREDICT REQUEST SCHEMA TESTS
  // ---------------------------------------------------------------------------
  test('PredictRequest: Accepts valid payload with all fields', () => {
    const payload = {
      mine_id: 'b01a0001-0000-0000-0000-000000000001',
      horizon_days: 14,
      weather_overrides: {
        rainfall_mm: 45.0,
        soil_moisture_pct: 70.0,
        surface_temp_c: 26.5,
        humidity_pct: 85.0,
        satellite_ndvi: 0.45,
        flood_risk_index: 4.5,
      },
      equipment_status_overrides: [
        {
          equipment_code: 'EQ-BAL-PUMP-01',
          status: 'MAINTENANCE_REQUIRED',
          health_score: 55.0,
          vibration_level_mm_s: 4.2,
        },
      ],
      target_override_mt: 18000.0,
      current_extraction_override_mt: 12000.0,
    };

    const res = PredictRequestSchema.safeParse(payload);
    assert(res.success === true, 'Valid payload should parse successfully');
  });

  test('PredictRequest: Accepts minimal payload with default horizon', () => {
    const payload = {
      mine_id: 'b01a0001-0000-0000-0000-000000000001',
    };

    const res = PredictRequestSchema.safeParse(payload);
    assert(res.success === true, 'Minimal payload should be valid');
    if (res.success) {
      assert(res.data.horizon_days === 14, 'Default horizon should be 14');
    }
  });

  test('PredictRequest: Rejects invalid non-UUID mine_id', () => {
    const payload = {
      mine_id: 'invalid-mine-123',
    };

    const res = PredictRequestSchema.safeParse(payload);
    assert(res.success === false, 'Non-UUID mine_id must fail');
    if (!res.success) {
      const formatted = formatZodError(res.error);
      assert(formatted.some((e) => e.field === 'mine_id'), 'Error must specify mine_id field');
    }
  });

  test('PredictRequest: Rejects out-of-range horizon_days (< 1 or > 90)', () => {
    const payloadLow = {
      mine_id: 'b01a0001-0000-0000-0000-000000000001',
      horizon_days: 0,
    };
    const resLow = PredictRequestSchema.safeParse(payloadLow);
    assert(resLow.success === false, 'Horizon 0 must fail');

    const payloadHigh = {
      mine_id: 'b01a0001-0000-0000-0000-000000000001',
      horizon_days: 120,
    };
    const resHigh = PredictRequestSchema.safeParse(payloadHigh);
    assert(resHigh.success === false, 'Horizon 120 must fail');
  });

  test('PredictRequest: Rejects negative rainfall or rainfall > 500mm', () => {
    const payloadNeg = {
      mine_id: 'b01a0001-0000-0000-0000-000000000001',
      weather_overrides: { rainfall_mm: -10.0 },
    };
    const resNeg = PredictRequestSchema.safeParse(payloadNeg);
    assert(resNeg.success === false, 'Negative rainfall must fail');

    const payloadExcess = {
      mine_id: 'b01a0001-0000-0000-0000-000000000001',
      weather_overrides: { rainfall_mm: 650.0 },
    };
    const resExcess = PredictRequestSchema.safeParse(payloadExcess);
    assert(resExcess.success === false, 'Rainfall 650mm must fail');
  });

  test('PredictRequest: Rejects invalid equipment status enum', () => {
    const payload = {
      mine_id: 'b01a0001-0000-0000-0000-000000000001',
      equipment_status_overrides: [
        {
          equipment_code: 'EQ-01',
          status: 'BROKEN_UNKNOWN_STATUS' as any,
        },
      ],
    };
    const res = PredictRequestSchema.safeParse(payload);
    assert(res.success === false, 'Invalid equipment status enum must fail');
  });

  // ---------------------------------------------------------------------------
  // 2. ALERT UPDATE SCHEMA TESTS
  // ---------------------------------------------------------------------------
  test('AlertUpdate: Accepts valid status transition to ACKNOWLEDGED', () => {
    const payload = {
      status: 'ACKNOWLEDGED',
      notes: 'Shift Incharge notified. Crew dispatched.',
    };
    const res = AlertUpdateSchema.safeParse(payload);
    assert(res.success === true, 'Valid alert update must pass');
  });

  test('AlertUpdate: Rejects invalid status string', () => {
    const payload = {
      status: 'RESOLVED_NON_EXISTENT',
    };
    const res = AlertUpdateSchema.safeParse(payload);
    assert(res.success === false, 'Invalid alert status must fail');
  });

  // ---------------------------------------------------------------------------
  // 3. EQUIPMENT CREATE SCHEMA TESTS
  // ---------------------------------------------------------------------------
  test('EquipmentCreate: Accepts valid new machinery payload', () => {
    const payload = {
      mine_id: 'b01a0001-0000-0000-0000-000000000001',
      equipment_code: 'EQ-BAL-PUMP-02',
      name: 'Auxiliary High-Head Sump Pump',
      equipment_type: 'DEWATERING_PUMP',
      model: 'Kirloskar 300HP',
      status: 'OPERATIONAL',
      health_score: 95.0,
      operating_hours: 120.0,
      vibration_level_mm_s: 1.1,
      temp_celsius: 58.0,
      fuel_efficiency_pct: 92.0,
      last_serviced_date: '2026-08-01',
    };
    const res = EquipmentCreateSchema.safeParse(payload);
    assert(res.success === true, 'Valid equipment registration must pass');
  });

  test('EquipmentCreate: Rejects missing required fields and negative vibration', () => {
    const payload = {
      mine_id: 'b01a0001-0000-0000-0000-000000000001',
      equipment_code: 'EQ-TEST',
      // Missing name and equipment_type
      vibration_level_mm_s: -3.5,
    };
    const res = EquipmentCreateSchema.safeParse(payload);
    assert(res.success === false, 'Missing fields & negative vibration must fail');
  });

  // ---------------------------------------------------------------------------
  // 4. QUERY SCHEMAS TESTS
  // ---------------------------------------------------------------------------
  test('MinesQuery: Parses valid filters with type coercion', () => {
    const query = {
      state: 'Madhya Pradesh',
      mine_type: 'UNDERGROUND',
      is_active: 'true',
    };
    const res = MinesQuerySchema.safeParse(query);
    assert(res.success === true, 'Valid mines query must pass');
    if (res.success) {
      assert(res.data.is_active === true, 'is_active should be boolean true');
    }
  });

  return results;
}
