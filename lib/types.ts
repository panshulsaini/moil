/**
 * =============================================================================
 * MOIL LIMITED PREDICTIVE INTELLIGENCE PLATFORM — TYPE DEFINITIONS
 * =============================================================================
 * Authoritative TypeScript interfaces & domain models matching PostgreSQL schema,
 * FastAPI ML microservice contracts, and Next.js App Router DTOs.
 */

// -----------------------------------------------------------------------------
// 1. DOMAIN ENUMS & PRIMITIVES
// -----------------------------------------------------------------------------
export type MineType = 'OPENCAST' | 'UNDERGROUND' | 'MIXED';

export type EquipmentType =
  | 'EXCAVATOR'
  | 'HAUL_TRUCK'
  | 'DEWATERING_PUMP'
  | 'HOIST_WINCH'
  | 'DRILL_RIG'
  | 'CONVEYOR';

export type EquipmentStatus =
  | 'OPERATIONAL'
  | 'MAINTENANCE_REQUIRED'
  | 'CRITICAL_FAILURE'
  | 'STANDBY';

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export type ActionPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type ActionStatus = 'PROPOSED' | 'ACKNOWLEDGED' | 'EXECUTED' | 'DISMISSED';

export type ServiceMode = 'fastapi_inference' | 'fallback_heuristic';

// -----------------------------------------------------------------------------
// 2. DATABASE ENTITY INTERFACES (Matching PostgreSQL Tables)
// -----------------------------------------------------------------------------
export interface Mine {
  id: string; // UUID
  code: string; // e.g. "MOIL-BAL"
  name: string; // e.g. "Balaghat Mine"
  state: string; // "Madhya Pradesh" | "Maharashtra"
  district: string; // "Balaghat" | "Bhandara" | "Nagpur"
  latitude: number;
  longitude: number;
  mine_type: MineType;
  annual_capacity_mt: number;
  established_year: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MiningEquipment {
  id: string;
  mine_id: string;
  equipment_code: string;
  name: string;
  equipment_type: EquipmentType;
  model: string | null;
  status: EquipmentStatus;
  health_score: number; // 0.0 - 100.0
  operating_hours: number;
  vibration_level_mm_s: number;
  temp_celsius: number;
  fuel_efficiency_pct: number | null;
  last_serviced_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface HistoricalYield {
  id: string;
  mine_id: string;
  recorded_date: string; // YYYY-MM-DD
  target_tonnage: number;
  actual_tonnage: number;
  manganese_grade_pct: number;
  overburden_tonnage: number;
  recovery_rate_pct: number;
  operational_shifts: number;
  created_at: string;
}

export interface WeatherTelemetry {
  id: string;
  mine_id: string;
  timestamp: string; // ISO 8601
  rainfall_mm: number;
  soil_moisture_pct: number;
  surface_temp_c: number;
  humidity_pct: number;
  wind_speed_kmh: number;
  satellite_ndvi: number | null;
  flood_risk_index: number;
  created_at: string;
}

export interface ShortfallPrediction {
  id: string;
  mine_id: string;
  prediction_timestamp: string;
  horizon_days: number;
  target_yield_mt: number;
  predicted_yield_mt: number;
  shortfall_tonnage: number;
  shortfall_risk_level: RiskLevel;
  confidence_score: number;
  primary_failure_mode: string;
  features_snapshot: Record<string, any>;
  model_version: string;
  created_at: string;
}

export interface CorrectiveAction {
  id: string;
  prediction_id: string | null;
  mine_id: string;
  action_type: string;
  title: string;
  description: string;
  priority: ActionPriority;
  estimated_yield_recovery_mt: number;
  cost_estimate_inr: number;
  status: ActionStatus;
  notes: string | null;
  created_at: string;
  executed_at: string | null;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, any>;
  timestamp: string;
}

// -----------------------------------------------------------------------------
// 3. AGGREGATED VIEWS & DTOs
// -----------------------------------------------------------------------------
export interface MineSummary extends Mine {
  equipment_count: number;
  average_equipment_health: number;
  latest_weather?: WeatherTelemetry | null;
  latest_prediction?: ShortfallPrediction | null;
  active_alerts_count: number;
}

export interface ContributingFactor {
  factor: string;
  impact_pct: number;
  description: string;
}

export interface CorrectiveActionPlan {
  id?: string;
  action_type: string;
  title: string;
  description: string;
  priority: ActionPriority;
  estimated_yield_recovery_mt: number;
  cost_estimate_inr: number;
}

// -----------------------------------------------------------------------------
// 4. API REQUEST & RESPONSE TYPES
// -----------------------------------------------------------------------------
export interface EquipmentOverride {
  equipment_code: string;
  status: EquipmentStatus;
  health_score?: number;
  vibration_level_mm_s?: number;
}

export interface WeatherOverride {
  rainfall_mm?: number;
  soil_moisture_pct?: number;
  surface_temp_c?: number;
  humidity_pct?: number;
  satellite_ndvi?: number;
  flood_risk_index?: number;
}

export interface PredictRequestDTO {
  mine_id: string;
  horizon_days?: number;
  weather_overrides?: WeatherOverride;
  equipment_status_overrides?: EquipmentOverride[];
  target_override_mt?: number;
  current_extraction_override_mt?: number;
}

export interface PredictResultData {
  id: string;
  mine_id: string;
  mine_name: string;
  mine_code: string;
  prediction_timestamp: string;
  horizon_days: number;
  target_yield_mt: number;
  predicted_yield_mt: number;
  shortfall_tonnage: number;
  shortfall_percentage: number;
  shortfall_risk_level: RiskLevel;
  confidence_score: number;
  model_accuracy: number; // back-tested prediction accuracy 0-1
  primary_failure_mode: string;
  contributing_factors: ContributingFactor[];
  corrective_actions: CorrectiveActionPlan[];
  model_version: string;
  service_mode: ServiceMode;
  telemetry_snapshot?: {
    rainfall_mm: number;
    soil_moisture_pct: number;
    equipment_health_avg: number;
  };
}

export interface PredictResponseDTO {
  success: boolean;
  data: PredictResultData;
}

// -----------------------------------------------------------------------------
// 5. FASTAPI MICROSERVICE CONTRACTS
// -----------------------------------------------------------------------------
export interface FastAPIShortfallRequest {
  mine_id: string;
  planned_tonnage: number;
  current_extraction: number;
  rainfall_mm_per_hr: number;
  soil_moisture_percent: number;
  pore_water_pressure_kpa: number;
  active_dumpers: number;
  active_excavators: number;
  active_pumps: number;
  pump_capacity_gpm: number;
  dumper_cycle_time_min: number;
  haul_road_friction_coeff: number;
  unscheduled_downtime_hours: number;
  manganese_grade_percent: number;
  stripping_ratio: number;
}

export interface FastAPICorrectiveAction {
  id: string;
  category: string;
  title: string;
  description: string;
  priority: ActionPriority;
  estimated_tonnage_recovery: number;
  action_lead_time_hours: number;
}

export interface FastAPIShortfallResponse {
  status: string;
  shortfall_predicted: boolean;
  shortfall_probability: number;
  risk_level: RiskLevel;
  expected_shortfall_tonnes: number;
  confidence_score: number;
  feature_contributions: Record<string, number>;
  corrective_actions: FastAPICorrectiveAction[];
  timestamp: string;
}

// -----------------------------------------------------------------------------
// 6. HEALTH CHECK & OPERATIONAL TYPES
// -----------------------------------------------------------------------------
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime_seconds: number;
  components: {
    nextjs_api: {
      status: 'up' | 'down';
      version: string;
    };
    database: {
      status: 'up' | 'down';
      mode: 'live_supabase' | 'in_memory_mock';
      connected: boolean;
    };
    fastapi_ml: {
      status: 'up' | 'down' | 'unreachable';
      url: string;
      latency_ms?: number;
    };
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
