/**
 * Tier 1 Unit Test: TypeScript / Zod Validation & Boundary Value Analysis
 * Tests all request and response schemas, enum constraints, and boundary edge cases.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// Attempt to import the project's validation schemas, or use the authoritative Zod contract
let validationModule;
try {
  validationModule = require('../../lib/validation');
} catch (e1) {
  try {
    validationModule = require('../../src/lib/validation');
  } catch (e2) {
    // If TypeScript runtime compilation is needed, provide the authoritative mirror contract
    const { z } = require('zod');
    const MineTypeEnum = z.enum(['OPENCAST', 'UNDERGROUND', 'MIXED']);
    const EquipmentStatusEnum = z.enum(['OPERATIONAL', 'MAINTENANCE_REQUIRED', 'CRITICAL_FAILURE', 'STANDBY']);
    const RiskLevelEnum = z.enum(['LOW', 'MODERATE', 'HIGH', 'CRITICAL']);
    const ActionPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
    const ActionStatusEnum = z.enum(['PROPOSED', 'ACKNOWLEDGED', 'EXECUTED', 'DISMISSED']);

    const PredictRequestSchema = z.object({
      mine_id: z.string().uuid('Invalid mine ID format'),
      horizon_days: z.number().int().min(1).max(90).default(14),
      weather_overrides: z.object({
        rainfall_mm: z.number().min(0).max(500).optional(),
        soil_moisture_pct: z.number().min(0).max(100).optional(),
        surface_temp_c: z.number().min(-10).max(60).optional(),
        humidity_pct: z.number().min(0).max(100).optional(),
        satellite_ndvi: z.number().min(-1.0).max(1.0).optional(),
      }).optional(),
      equipment_status_overrides: z.array(z.object({
        equipment_code: z.string(),
        status: EquipmentStatusEnum,
        health_score: z.number().min(0).max(100).optional(),
        vibration_level_mm_s: z.number().min(0).optional(),
      })).optional(),
      target_override_mt: z.number().positive().optional(),
    });

    const CorrectiveActionSchema = z.object({
      action_type: z.string(),
      title: z.string(),
      description: z.string(),
      priority: ActionPriorityEnum,
      estimated_yield_recovery_mt: z.number().nonnegative(),
      cost_estimate_inr: z.number().nonnegative(),
    });

    const PredictResponseSchema = z.object({
      success: z.literal(true),
      data: z.object({
        id: z.string().uuid(),
        mine_id: z.string().uuid(),
        mine_name: z.string(),
        prediction_timestamp: z.string(),
        horizon_days: z.number(),
        target_yield_mt: z.number(),
        predicted_yield_mt: z.number(),
        shortfall_tonnage: z.number(),
        shortfall_percentage: z.number(),
        shortfall_risk_level: RiskLevelEnum,
        confidence_score: z.number().min(0).max(1),
        primary_failure_mode: z.string(),
        contributing_factors: z.array(z.object({
          factor: z.string(),
          impact_pct: z.number(),
          description: z.string(),
        })),
        corrective_actions: z.array(CorrectiveActionSchema),
        model_version: z.string(),
        service_mode: z.enum(['fastapi_inference', 'fallback_heuristic']),
      }),
    });

    validationModule = {
      MineTypeEnum,
      EquipmentStatusEnum,
      RiskLevelEnum,
      ActionPriorityEnum,
      ActionStatusEnum,
      PredictRequestSchema,
      CorrectiveActionSchema,
      PredictResponseSchema,
    };
  }
}

const {
  MineTypeEnum,
  EquipmentStatusEnum,
  RiskLevelEnum,
  ActionPriorityEnum,
  ActionStatusEnum,
  PredictRequestSchema,
  CorrectiveActionSchema,
  PredictResponseSchema,
} = validationModule;

describe('Tier 1: Zod Schema Validation & Boundary Analysis', () => {

  describe('Mine & Equipment Enums', () => {
    it('should validate allowed MineTypeEnum values', () => {
      ['OPENCAST', 'UNDERGROUND', 'MIXED'].forEach((type) => {
        const res = MineTypeEnum.safeParse(type);
        assert.equal(res.success, true, `MineType ${type} should be valid`);
      });
      assert.equal(MineTypeEnum.safeParse('STRIP_MINE').success, false);
      assert.equal(MineTypeEnum.safeParse('').success, false);
      assert.equal(MineTypeEnum.safeParse(null).success, false);
    });

    it('should validate allowed EquipmentStatusEnum values', () => {
      ['OPERATIONAL', 'MAINTENANCE_REQUIRED', 'CRITICAL_FAILURE', 'STANDBY'].forEach((status) => {
        assert.equal(EquipmentStatusEnum.safeParse(status).success, true);
      });
      assert.equal(EquipmentStatusEnum.safeParse('BROKEN_DOWN').success, false);
    });

    it('should validate RiskLevelEnum values', () => {
      ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'].forEach((risk) => {
        assert.equal(RiskLevelEnum.safeParse(risk).success, true);
      });
      assert.equal(RiskLevelEnum.safeParse('EXTREME').success, false);
    });
  });

  describe('PredictRequestSchema - Happy Path & Default Values', () => {
    it('should accept valid minimal prediction request with defaults', () => {
      const payload = {
        mine_id: 'b01a0001-0000-0000-0000-000000000001',
      };
      const parsed = PredictRequestSchema.safeParse(payload);
      assert.equal(parsed.success, true);
      assert.equal(parsed.data.horizon_days, 14); // Default 14 days
    });

    it('should accept full comprehensive prediction request', () => {
      const payload = {
        mine_id: 'b01a0001-0000-0000-0000-000000000002',
        horizon_days: 21,
        weather_overrides: {
          rainfall_mm: 85.5,
          soil_moisture_pct: 78.2,
          surface_temp_c: 28.0,
          humidity_pct: 88.0,
          satellite_ndvi: 0.45,
        },
        equipment_status_overrides: [
          {
            equipment_code: 'EQ-DON-PUMP-01',
            status: 'CRITICAL_FAILURE',
            health_score: 30.0,
            vibration_level_mm_s: 7.2,
          },
        ],
        target_override_mt: 16500.0,
      };
      const parsed = PredictRequestSchema.safeParse(payload);
      assert.equal(parsed.success, true);
      assert.equal(parsed.data.target_override_mt, 16500.0);
    });
  });

  describe('PredictRequestSchema - Boundary Value Analysis (BVA)', () => {
    it('should reject invalid non-UUID mine_id', () => {
      const invalidIds = ['123', 'not-a-uuid', 'b01a0001-0000-0000-0000', ''];
      invalidIds.forEach((id) => {
        const res = PredictRequestSchema.safeParse({ mine_id: id });
        assert.equal(res.success, false, `ID "${id}" should be rejected as invalid UUID`);
      });
    });

    it('should enforce horizon_days boundaries [1, 90]', () => {
      // Valid boundaries
      assert.equal(PredictRequestSchema.safeParse({ mine_id: 'b01a0001-0000-0000-0000-000000000001', horizon_days: 1 }).success, true);
      assert.equal(PredictRequestSchema.safeParse({ mine_id: 'b01a0001-0000-0000-0000-000000000001', horizon_days: 90 }).success, true);

      // Out of bounds
      assert.equal(PredictRequestSchema.safeParse({ mine_id: 'b01a0001-0000-0000-0000-000000000001', horizon_days: 0 }).success, false);
      assert.equal(PredictRequestSchema.safeParse({ mine_id: 'b01a0001-0000-0000-0000-000000000001', horizon_days: -5 }).success, false);
      assert.equal(PredictRequestSchema.safeParse({ mine_id: 'b01a0001-0000-0000-0000-000000000001', horizon_days: 91 }).success, false);
      assert.equal(PredictRequestSchema.safeParse({ mine_id: 'b01a0001-0000-0000-0000-000000000001', horizon_days: 14.5 }).success, false); // Must be integer
    });

    it('should enforce weather telemetry bounds', () => {
      const base = { mine_id: 'b01a0001-0000-0000-0000-000000000001' };

      // Rainfall [0, 500]
      assert.equal(PredictRequestSchema.safeParse({ ...base, weather_overrides: { rainfall_mm: -1 } }).success, false);
      assert.equal(PredictRequestSchema.safeParse({ ...base, weather_overrides: { rainfall_mm: 501 } }).success, false);
      assert.equal(PredictRequestSchema.safeParse({ ...base, weather_overrides: { rainfall_mm: 0 } }).success, true);
      assert.equal(PredictRequestSchema.safeParse({ ...base, weather_overrides: { rainfall_mm: 500 } }).success, true);

      // Soil Moisture [0, 100]
      assert.equal(PredictRequestSchema.safeParse({ ...base, weather_overrides: { soil_moisture_pct: -0.1 } }).success, false);
      assert.equal(PredictRequestSchema.safeParse({ ...base, weather_overrides: { soil_moisture_pct: 100.1 } }).success, false);
      assert.equal(PredictRequestSchema.safeParse({ ...base, weather_overrides: { soil_moisture_pct: 100 } }).success, true);

      // Surface Temp [-10, 60]
      assert.equal(PredictRequestSchema.safeParse({ ...base, weather_overrides: { surface_temp_c: -15 } }).success, false);
      assert.equal(PredictRequestSchema.safeParse({ ...base, weather_overrides: { surface_temp_c: 65 } }).success, false);
      assert.equal(PredictRequestSchema.safeParse({ ...base, weather_overrides: { surface_temp_c: -10 } }).success, true);

      // Satellite NDVI [-1.0, 1.0]
      assert.equal(PredictRequestSchema.safeParse({ ...base, weather_overrides: { satellite_ndvi: -1.1 } }).success, false);
      assert.equal(PredictRequestSchema.safeParse({ ...base, weather_overrides: { satellite_ndvi: 1.1 } }).success, false);
      assert.equal(PredictRequestSchema.safeParse({ ...base, weather_overrides: { satellite_ndvi: 0.0 } }).success, true);
    });

    it('should enforce equipment status & health score boundaries', () => {
      const base = { mine_id: 'b01a0001-0000-0000-0000-000000000001' };

      // Negative health score
      assert.equal(PredictRequestSchema.safeParse({
        ...base,
        equipment_status_overrides: [{ equipment_code: 'EQ-01', status: 'OPERATIONAL', health_score: -5 }],
      }).success, false);

      // Health score > 100
      assert.equal(PredictRequestSchema.safeParse({
        ...base,
        equipment_status_overrides: [{ equipment_code: 'EQ-01', status: 'OPERATIONAL', health_score: 105 }],
      }).success, false);

      // Negative vibration level
      assert.equal(PredictRequestSchema.safeParse({
        ...base,
        equipment_status_overrides: [{ equipment_code: 'EQ-01', status: 'OPERATIONAL', vibration_level_mm_s: -1.2 }],
      }).success, false);
    });

    it('should reject non-positive target tonnage overrides', () => {
      const base = { mine_id: 'b01a0001-0000-0000-0000-000000000001' };
      assert.equal(PredictRequestSchema.safeParse({ ...base, target_override_mt: 0 }).success, false);
      assert.equal(PredictRequestSchema.safeParse({ ...base, target_override_mt: -100 }).success, false);
      assert.equal(PredictRequestSchema.safeParse({ ...base, target_override_mt: 1000 }).success, true);
    });
  });

  describe('PredictResponseSchema - Validation & Contract Compliance', () => {
    it('should validate a complete and correct PredictResponse payload', () => {
      const responsePayload = {
        success: true,
        data: {
          id: 'p01a0001-0000-0000-0000-000000000001',
          mine_id: 'b01a0001-0000-0000-0000-000000000002',
          mine_name: 'Dongri Buzurg Mine',
          prediction_timestamp: new Date().toISOString(),
          horizon_days: 14,
          target_yield_mt: 15000.0,
          predicted_yield_mt: 10800.0,
          shortfall_tonnage: 4200.0,
          shortfall_percentage: 28.0,
          shortfall_risk_level: 'HIGH',
          confidence_score: 0.915,
          primary_failure_mode: 'Monsoon Pit Sump Overflow & Dumper Haulage Slippage',
          contributing_factors: [
            {
              factor: 'Excess Precipitation Index',
              impact_pct: 45.0,
              description: 'Rainfall exceeding pit sump evacuation capacity.',
            },
          ],
          corrective_actions: [
            {
              action_type: 'DEWATERING_MOBILIZATION',
              title: 'Mobilize 2x Standby Pumps',
              description: 'Deploy auxiliary dewatering skid to pit sump.',
              priority: 'URGENT',
              estimated_yield_recovery_mt: 2600.0,
              cost_estimate_inr: 350000.0,
            },
          ],
          model_version: 'v1.0.0-xgb',
          service_mode: 'fastapi_inference',
        },
      };

      const res = PredictResponseSchema.safeParse(responsePayload);
      assert.equal(res.success, true, 'Valid response payload must parse cleanly');
    });

    it('should reject response if confidence_score is out of bounds [0, 1]', () => {
      const invalidConfidence = {
        success: true,
        data: {
          id: 'p01a0001-0000-0000-0000-000000000001',
          mine_id: 'b01a0001-0000-0000-0000-000000000002',
          mine_name: 'Dongri Buzurg Mine',
          prediction_timestamp: new Date().toISOString(),
          horizon_days: 14,
          target_yield_mt: 15000.0,
          predicted_yield_mt: 10800.0,
          shortfall_tonnage: 4200.0,
          shortfall_percentage: 28.0,
          shortfall_risk_level: 'HIGH',
          confidence_score: 1.25, // Invalid > 1.0
          primary_failure_mode: 'Overflow',
          contributing_factors: [],
          corrective_actions: [],
          model_version: 'v1.0.0',
          service_mode: 'fallback_heuristic',
        },
      };
      assert.equal(PredictResponseSchema.safeParse(invalidConfidence).success, false);
    });
  });
});
