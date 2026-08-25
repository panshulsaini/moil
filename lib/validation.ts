/**
 * =============================================================================
 * MOIL LIMITED PREDICTIVE INTELLIGENCE PLATFORM — ZOD VALIDATION SCHEMAS
 * =============================================================================
 * Strict runtime schema validation, sanitization, and error formatting for
 * API request bodies, query parameters, and responses.
 */

import { z } from 'zod';

// -----------------------------------------------------------------------------
// 1. ENUM SCHEMAS
// -----------------------------------------------------------------------------
export const MineTypeEnum = z.enum(['OPENCAST', 'UNDERGROUND', 'MIXED']);

export const EquipmentTypeEnum = z.enum([
  'EXCAVATOR',
  'HAUL_TRUCK',
  'DEWATERING_PUMP',
  'HOIST_WINCH',
  'DRILL_RIG',
  'CONVEYOR',
]);

export const EquipmentStatusEnum = z.enum([
  'OPERATIONAL',
  'MAINTENANCE_REQUIRED',
  'CRITICAL_FAILURE',
  'STANDBY',
]);

export const RiskLevelEnum = z.enum(['LOW', 'MODERATE', 'HIGH', 'CRITICAL']);

export const ActionPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

export const ActionStatusEnum = z.enum(['PROPOSED', 'ACKNOWLEDGED', 'EXECUTED', 'DISMISSED']);

export const ServiceModeEnum = z.enum(['fastapi_inference', 'fallback_heuristic']);

// -----------------------------------------------------------------------------
// 2. PREDICT REQUEST & OVERRIDE SCHEMAS
// -----------------------------------------------------------------------------
export const WeatherOverrideSchema = z.object({
  rainfall_mm: z
    .number()
    .min(0, 'Rainfall cannot be negative')
    .max(500, 'Rainfall exceeds physical limit (500mm)')
    .optional(),
  soil_moisture_pct: z
    .number()
    .min(0, 'Soil moisture cannot be negative')
    .max(100, 'Soil moisture cannot exceed 100%')
    .optional(),
  surface_temp_c: z
    .number()
    .min(-20, 'Surface temperature too low')
    .max(65, 'Surface temperature exceeds physical range')
    .optional(),
  humidity_pct: z
    .number()
    .min(0, 'Humidity cannot be negative')
    .max(100, 'Humidity cannot exceed 100%')
    .optional(),
  satellite_ndvi: z
    .number()
    .min(-1.0, 'NDVI minimum is -1.0')
    .max(1.0, 'NDVI maximum is 1.0')
    .optional(),
  flood_risk_index: z
    .number()
    .min(0, 'Flood risk index minimum is 0')
    .max(10, 'Flood risk index maximum is 10')
    .optional(),
});

export const EquipmentOverrideSchema = z.object({
  equipment_code: z.string().min(1, 'Equipment code is required'),
  status: EquipmentStatusEnum,
  health_score: z
    .number()
    .min(0, 'Health score must be between 0 and 100')
    .max(100, 'Health score must be between 0 and 100')
    .optional(),
  vibration_level_mm_s: z
    .number()
    .min(0, 'Vibration level cannot be negative')
    .max(50, 'Vibration exceeds operational ceiling')
    .optional(),
});

export const PredictRequestSchema = z.object({
  mine_id: z.string().uuid('Invalid mine ID format. Must be a valid UUID.'),
  horizon_days: z
    .number()
    .int('Horizon days must be an integer')
    .min(1, 'Prediction horizon minimum is 1 day')
    .max(90, 'Prediction horizon maximum is 90 days')
    .default(14)
    .optional(),
  weather_overrides: WeatherOverrideSchema.optional(),
  equipment_status_overrides: z.array(EquipmentOverrideSchema).optional(),
  target_override_mt: z
    .number()
    .positive('Target tonnage override must be greater than 0')
    .max(1000000, 'Target tonnage exceeds realistic mine ceiling')
    .optional(),
  current_extraction_override_mt: z
    .number()
    .nonnegative('Current extraction cannot be negative')
    .optional(),
});

// -----------------------------------------------------------------------------
// 3. CORRECTIVE ACTIONS SCHEMAS
// -----------------------------------------------------------------------------
export const CorrectiveActionPlanSchema = z.object({
  id: z.string().optional(),
  action_type: z.string().min(1, 'Action type is required'),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  priority: ActionPriorityEnum,
  estimated_yield_recovery_mt: z.number().nonnegative('Yield recovery must be >= 0'),
  cost_estimate_inr: z.number().nonnegative('Cost estimate must be >= 0'),
});

export const AlertUpdateSchema = z.object({
  status: ActionStatusEnum,
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional(),
});

export const AlertCreateSchema = z.object({
  mine_id: z.string().uuid('Invalid mine ID format'),
  prediction_id: z.string().uuid().optional(),
  action_type: z.string().min(1, 'Action type is required'),
  title: z.string().min(3, 'Title is required'),
  description: z.string().min(10, 'Description is required'),
  priority: ActionPriorityEnum.default('MEDIUM'),
  estimated_yield_recovery_mt: z.number().nonnegative().default(0),
  cost_estimate_inr: z.number().nonnegative().default(0),
  notes: z.string().optional(),
});

// -----------------------------------------------------------------------------
// 4. EQUIPMENT CRUD & TELEMETRY SCHEMAS
// -----------------------------------------------------------------------------
export const EquipmentCreateSchema = z.object({
  mine_id: z.string().uuid('Invalid mine ID format'),
  equipment_code: z.string().min(2, 'Equipment code must be at least 2 chars'),
  name: z.string().min(2, 'Name is required'),
  equipment_type: EquipmentTypeEnum,
  model: z.string().optional(),
  status: EquipmentStatusEnum.default('OPERATIONAL'),
  health_score: z.number().min(0).max(100).default(100),
  operating_hours: z.number().nonnegative().default(0),
  vibration_level_mm_s: z.number().nonnegative().default(1.2),
  temp_celsius: z.number().min(-20).max(150).default(65.0),
  fuel_efficiency_pct: z.number().min(0).max(100).optional(),
  last_serviced_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
});

export const EquipmentUpdateSchema = EquipmentCreateSchema.partial();

// -----------------------------------------------------------------------------
// 5. QUERY PARAMETERS SCHEMAS
// -----------------------------------------------------------------------------
export const MinesQuerySchema = z.object({
  state: z.string().optional(),
  mine_type: MineTypeEnum.optional(),
  is_active: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
});

export const EquipmentQuerySchema = z.object({
  mine_id: z.string().uuid().optional(),
  status: EquipmentStatusEnum.optional(),
  equipment_type: EquipmentTypeEnum.optional(),
});

export const AlertsQuerySchema = z.object({
  mine_id: z.string().uuid().optional(),
  status: ActionStatusEnum.optional(),
  priority: ActionPriorityEnum.optional(),
});

export const WeatherQuerySchema = z.object({
  mine_id: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
});

// -----------------------------------------------------------------------------
// 6. PREDICT RESPONSE SCHEMA
// -----------------------------------------------------------------------------
export const ContributingFactorSchema = z.object({
  factor: z.string(),
  impact_pct: z.number(),
  description: z.string(),
});

export const PredictResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    id: z.string(),
    mine_id: z.string(),
    mine_name: z.string(),
    mine_code: z.string(),
    prediction_timestamp: z.string(),
    horizon_days: z.number(),
    target_yield_mt: z.number(),
    predicted_yield_mt: z.number(),
    shortfall_tonnage: z.number(),
    shortfall_percentage: z.number(),
    shortfall_risk_level: RiskLevelEnum,
    confidence_score: z.number().min(0).max(1),
    primary_failure_mode: z.string(),
    contributing_factors: z.array(ContributingFactorSchema),
    corrective_actions: z.array(CorrectiveActionPlanSchema),
    model_version: z.string(),
    service_mode: ServiceModeEnum,
  }),
});

// -----------------------------------------------------------------------------
// 7. HELPER UTILITIES FOR VALIDATION
// -----------------------------------------------------------------------------
export interface FormattedValidationError {
  field: string;
  message: string;
}

export function formatZodError(error: z.ZodError): FormattedValidationError[] {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
}
