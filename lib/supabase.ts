/**
 * =============================================================================
 * MOIL LIMITED PREDICTIVE INTELLIGENCE PLATFORM — DUAL-MODE SUPABASE CLIENT
 * =============================================================================
 * Resilient data access client:
 * 1. Connects to live Supabase backend when NEXT_PUBLIC_SUPABASE_URL and
 *    NEXT_PUBLIC_SUPABASE_ANON_KEY are provided and valid.
 * 2. Transparently falls back to an in-memory mock repository pre-loaded with
 *    all 8 MOIL mines, equipment assets, yields, telemetry, and predictions.
 * 3. Supports full fluent query chaining (.from().select().eq().order().limit().insert().update()).
 */

import {
  Mine,
  MiningEquipment,
  HistoricalYield,
  WeatherTelemetry,
  ShortfallPrediction,
  CorrectiveAction,
  AuditLog,
} from './types';

// -----------------------------------------------------------------------------
// 1. SEED DATA REPOSITORY FOR IN-MEMORY MOCK CLIENT
// -----------------------------------------------------------------------------
function getInitialSeedData() {
  const mines: Mine[] = [
    {
      id: 'b01a0001-0000-0000-0000-000000000001',
      code: 'MOIL-BAL',
      name: 'Balaghat Mine',
      state: 'Madhya Pradesh',
      district: 'Balaghat',
      latitude: 21.8083,
      longitude: 80.1833,
      mine_type: 'UNDERGROUND',
      annual_capacity_mt: 450000.0,
      established_year: 1903,
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-08-25T00:00:00Z',
    },
    {
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
    },
    {
      id: 'b01a0001-0000-0000-0000-000000000003',
      code: 'MOIL-MAN',
      name: 'Mansar Mine',
      state: 'Maharashtra',
      district: 'Nagpur',
      latitude: 21.3917,
      longitude: 79.2833,
      mine_type: 'MIXED',
      annual_capacity_mt: 220000.0,
      established_year: 1901,
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-08-25T00:00:00Z',
    },
    {
      id: 'b01a0001-0000-0000-0000-000000000004',
      code: 'MOIL-CHK',
      name: 'Chikla Mine',
      state: 'Maharashtra',
      district: 'Bhandara',
      latitude: 21.55,
      longitude: 79.75,
      mine_type: 'UNDERGROUND',
      annual_capacity_mt: 180000.0,
      established_year: 1912,
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-08-25T00:00:00Z',
    },
    {
      id: 'b01a0001-0000-0000-0000-000000000005',
      code: 'MOIL-KAN',
      name: 'Kandri Mine',
      state: 'Maharashtra',
      district: 'Nagpur',
      latitude: 21.4167,
      longitude: 79.2667,
      mine_type: 'MIXED',
      annual_capacity_mt: 160000.0,
      established_year: 1900,
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-08-25T00:00:00Z',
    },
    {
      id: 'b01a0001-0000-0000-0000-000000000006',
      code: 'MOIL-GUM',
      name: 'Gumgaon Mine',
      state: 'Maharashtra',
      district: 'Nagpur',
      latitude: 21.3833,
      longitude: 79.0333,
      mine_type: 'UNDERGROUND',
      annual_capacity_mt: 140000.0,
      established_year: 1908,
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-08-25T00:00:00Z',
    },
    {
      id: 'b01a0001-0000-0000-0000-000000000007',
      code: 'MOIL-TIR',
      name: 'Tirodi Mine',
      state: 'Madhya Pradesh',
      district: 'Balaghat',
      latitude: 21.6833,
      longitude: 79.7167,
      mine_type: 'OPENCAST',
      annual_capacity_mt: 190000.0,
      established_year: 1928,
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-08-25T00:00:00Z',
    },
    {
      id: 'b01a0001-0000-0000-0000-000000000008',
      code: 'MOIL-UKW',
      name: 'Ukwa Mine',
      state: 'Madhya Pradesh',
      district: 'Balaghat',
      latitude: 21.9667,
      longitude: 80.4667,
      mine_type: 'UNDERGROUND',
      annual_capacity_mt: 120000.0,
      established_year: 1906,
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-08-25T00:00:00Z',
    },
  ];

  const mining_equipment: MiningEquipment[] = [
    {
      id: 'e01a0001-0000-0000-0000-000000000001',
      mine_id: 'b01a0001-0000-0000-0000-000000000001',
      equipment_code: 'EQ-BAL-HOIST-01',
      name: 'Main Vertical Shaft Hoist #1',
      equipment_type: 'HOIST_WINCH',
      model: 'BHEL 1200kW Ward-Leonard',
      status: 'OPERATIONAL',
      health_score: 94.5,
      operating_hours: 14200.0,
      vibration_level_mm_s: 1.45,
      temp_celsius: 62.0,
      fuel_efficiency_pct: 95.0,
      last_serviced_date: '2026-07-15',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-08-25T00:00:00Z',
    },
    {
      id: 'e01a0001-0000-0000-0000-000000000002',
      mine_id: 'b01a0001-0000-0000-0000-000000000001',
      equipment_code: 'EQ-BAL-PUMP-01',
      name: 'Sub-level Dewatering Pump Alpha',
      equipment_type: 'DEWATERING_PUMP',
      model: 'Kirloskar 500HP High-Head',
      status: 'OPERATIONAL',
      health_score: 88.0,
      operating_hours: 8900.0,
      vibration_level_mm_s: 2.1,
      temp_celsius: 71.0,
      fuel_efficiency_pct: 91.0,
      last_serviced_date: '2026-07-28',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-08-25T00:00:00Z',
    },
    {
      id: 'e01a0001-0000-0000-0000-000000000003',
      mine_id: 'b01a0001-0000-0000-0000-000000000001',
      equipment_code: 'EQ-BAL-DRILL-01',
      name: 'Jumbo Electro-Hydraulic Drill',
      equipment_type: 'DRILL_RIG',
      model: 'Sandvik DD321',
      status: 'MAINTENANCE_REQUIRED',
      health_score: 64.0,
      operating_hours: 11400.0,
      vibration_level_mm_s: 4.8,
      temp_celsius: 86.5,
      fuel_efficiency_pct: 78.0,
      last_serviced_date: '2026-06-10',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-08-25T00:00:00Z',
    },
    {
      id: 'e01a0001-0000-0000-0000-000000000004',
      mine_id: 'b01a0001-0000-0000-0000-000000000002',
      equipment_code: 'EQ-DON-EXC-01',
      name: 'Hydraulic Pit Excavator #1',
      equipment_type: 'EXCAVATOR',
      model: 'Komatsu PC1250-8',
      status: 'OPERATIONAL',
      health_score: 91.0,
      operating_hours: 6500.0,
      vibration_level_mm_s: 1.8,
      temp_celsius: 74.0,
      fuel_efficiency_pct: 89.0,
      last_serviced_date: '2026-07-20',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-08-25T00:00:00Z',
    },
    {
      id: 'e01a0001-0000-0000-0000-000000000005',
      mine_id: 'b01a0001-0000-0000-0000-000000000002',
      equipment_code: 'EQ-DON-TRK-01',
      name: 'Heavy Off-Highway Dumper 01',
      equipment_type: 'HAUL_TRUCK',
      model: 'Caterpillar 773E (55 Ton)',
      status: 'OPERATIONAL',
      health_score: 82.5,
      operating_hours: 9300.0,
      vibration_level_mm_s: 2.4,
      temp_celsius: 78.0,
      fuel_efficiency_pct: 84.0,
      last_serviced_date: '2026-07-18',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-08-25T00:00:00Z',
    },
    {
      id: 'e01a0001-0000-0000-0000-000000000006',
      mine_id: 'b01a0001-0000-0000-0000-000000000002',
      equipment_code: 'EQ-DON-PUMP-01',
      name: 'Pit Sump Main Dewatering Pump',
      equipment_type: 'DEWATERING_PUMP',
      model: 'Sulzer 400HP Submersible',
      status: 'CRITICAL_FAILURE',
      health_score: 38.0,
      operating_hours: 13400.0,
      vibration_level_mm_s: 6.9,
      temp_celsius: 94.0,
      fuel_efficiency_pct: 65.0,
      last_serviced_date: '2026-05-30',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-08-25T00:00:00Z',
    },
    {
      id: 'e01a0001-0000-0000-0000-000000000007',
      mine_id: 'b01a0001-0000-0000-0000-000000000003',
      equipment_code: 'EQ-MAN-EXC-01',
      name: 'Opencast Bench Excavator #1',
      equipment_type: 'EXCAVATOR',
      model: 'Hitachi EX1200-6',
      status: 'OPERATIONAL',
      health_score: 87.5,
      operating_hours: 8100.0,
      vibration_level_mm_s: 2.1,
      temp_celsius: 72.0,
      fuel_efficiency_pct: 90.0,
      last_serviced_date: '2026-07-22',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-08-25T00:00:00Z',
    },
    {
      id: 'e01a0001-0000-0000-0000-000000000008',
      mine_id: 'b01a0001-0000-0000-0000-000000000004',
      equipment_code: 'EQ-CHK-HOIST-01',
      name: 'Chikla Shaft Hoisting System',
      equipment_type: 'HOIST_WINCH',
      model: 'BHEL 800kW Electric',
      status: 'OPERATIONAL',
      health_score: 90.0,
      operating_hours: 10800.0,
      vibration_level_mm_s: 1.7,
      temp_celsius: 64.0,
      fuel_efficiency_pct: 92.0,
      last_serviced_date: '2026-07-02',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-08-25T00:00:00Z',
    },
  ];

  const historical_yields: HistoricalYield[] = [
    {
      id: 'y01a0001-0000-0000-0000-000000000001',
      mine_id: 'b01a0001-0000-0000-0000-000000000001',
      recorded_date: '2026-06-01',
      target_tonnage: 37500.0,
      actual_tonnage: 36200.0,
      manganese_grade_pct: 46.5,
      overburden_tonnage: 8500.0,
      recovery_rate_pct: 96.53,
      operational_shifts: 3,
      created_at: '2026-06-02T00:00:00Z',
    },
    {
      id: 'y01a0001-0000-0000-0000-000000000002',
      mine_id: 'b01a0001-0000-0000-0000-000000000001',
      recorded_date: '2026-07-01',
      target_tonnage: 37500.0,
      actual_tonnage: 31800.0,
      manganese_grade_pct: 45.8,
      overburden_tonnage: 7900.0,
      recovery_rate_pct: 84.8,
      operational_shifts: 3,
      created_at: '2026-07-02T00:00:00Z',
    },
    {
      id: 'y01a0001-0000-0000-0000-000000000003',
      mine_id: 'b01a0001-0000-0000-0000-000000000002',
      recorded_date: '2026-06-01',
      target_tonnage: 31500.0,
      actual_tonnage: 30900.0,
      manganese_grade_pct: 38.2,
      overburden_tonnage: 94000.0,
      recovery_rate_pct: 98.1,
      operational_shifts: 3,
      created_at: '2026-06-02T00:00:00Z',
    },
    {
      id: 'y01a0001-0000-0000-0000-000000000004',
      mine_id: 'b01a0001-0000-0000-0000-000000000002',
      recorded_date: '2026-07-01',
      target_tonnage: 31500.0,
      actual_tonnage: 24100.0,
      manganese_grade_pct: 37.1,
      overburden_tonnage: 61000.0,
      recovery_rate_pct: 76.51,
      operational_shifts: 3,
      created_at: '2026-07-02T00:00:00Z',
    },
  ];

  const weather_telemetry: WeatherTelemetry[] = [
    {
      id: 'w01a0001-0000-0000-0000-000000000001',
      mine_id: 'b01a0001-0000-0000-0000-000000000001',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      rainfall_mm: 28.4,
      soil_moisture_pct: 62.5,
      surface_temp_c: 27.8,
      humidity_pct: 82.0,
      wind_speed_kmh: 14.5,
      satellite_ndvi: 0.45,
      flood_risk_index: 3.2,
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'w01a0001-0000-0000-0000-000000000002',
      mine_id: 'b01a0001-0000-0000-0000-000000000002',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      rainfall_mm: 78.6,
      soil_moisture_pct: 89.2,
      surface_temp_c: 25.4,
      humidity_pct: 94.0,
      wind_speed_kmh: 28.0,
      satellite_ndvi: 0.52,
      flood_risk_index: 8.4,
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'w01a0001-0000-0000-0000-000000000003',
      mine_id: 'b01a0001-0000-0000-0000-000000000003',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      rainfall_mm: 34.2,
      soil_moisture_pct: 68.0,
      surface_temp_c: 28.1,
      humidity_pct: 80.0,
      wind_speed_kmh: 16.0,
      satellite_ndvi: 0.42,
      flood_risk_index: 4.1,
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'w01a0001-0000-0000-0000-000000000004',
      mine_id: 'b01a0001-0000-0000-0000-000000000004',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      rainfall_mm: 45.0,
      soil_moisture_pct: 72.4,
      surface_temp_c: 26.9,
      humidity_pct: 85.0,
      wind_speed_kmh: 18.5,
      satellite_ndvi: 0.48,
      flood_risk_index: 5.0,
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'w01a0001-0000-0000-0000-000000000005',
      mine_id: 'b01a0001-0000-0000-0000-000000000005',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      rainfall_mm: 31.0,
      soil_moisture_pct: 65.8,
      surface_temp_c: 28.4,
      humidity_pct: 79.0,
      wind_speed_kmh: 15.0,
      satellite_ndvi: 0.41,
      flood_risk_index: 3.8,
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'w01a0001-0000-0000-0000-000000000006',
      mine_id: 'b01a0001-0000-0000-0000-000000000006',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      rainfall_mm: 22.0,
      soil_moisture_pct: 58.0,
      surface_temp_c: 29.0,
      humidity_pct: 74.0,
      wind_speed_kmh: 12.0,
      satellite_ndvi: 0.39,
      flood_risk_index: 2.7,
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'w01a0001-0000-0000-0000-000000000007',
      mine_id: 'b01a0001-0000-0000-0000-000000000007',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      rainfall_mm: 52.3,
      soil_moisture_pct: 77.0,
      surface_temp_c: 26.5,
      humidity_pct: 87.0,
      wind_speed_kmh: 22.0,
      satellite_ndvi: 0.49,
      flood_risk_index: 6.1,
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'w01a0001-0000-0000-0000-000000000008',
      mine_id: 'b01a0001-0000-0000-0000-000000000008',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      rainfall_mm: 18.5,
      soil_moisture_pct: 52.0,
      surface_temp_c: 29.5,
      humidity_pct: 71.0,
      wind_speed_kmh: 10.5,
      satellite_ndvi: 0.47,
      flood_risk_index: 2.2,
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
  ];

  const shortfall_predictions: ShortfallPrediction[] = [
    {
      id: 'p01a0001-0000-0000-0000-000000000001',
      mine_id: 'b01a0001-0000-0000-0000-000000000002',
      prediction_timestamp: new Date(Date.now() - 7200000).toISOString(),
      horizon_days: 14,
      target_yield_mt: 15000.0,
      predicted_yield_mt: 10800.0,
      shortfall_tonnage: 4200.0,
      shortfall_risk_level: 'HIGH',
      confidence_score: 0.915,
      primary_failure_mode: 'Monsoon Pit Sump Overflow & Dumper Haulage Slippage',
      features_snapshot: {
        rainfall_mm: 78.6,
        soil_moisture_pct: 89.2,
        dewatering_capacity_pct: 45.0,
        active_haul_trucks: 2,
      },
      model_version: 'v1.0.0-xgb',
      created_at: new Date(Date.now() - 7200000).toISOString(),
    },
  ];

  const corrective_actions: CorrectiveAction[] = [
    {
      id: 'a01a0001-0000-0000-0000-000000000001',
      prediction_id: 'p01a0001-0000-0000-0000-000000000001',
      mine_id: 'b01a0001-0000-0000-0000-000000000002',
      action_type: 'DEWATERING_MOBILIZATION',
      title: 'Mobilize 2x 250HP Standby Diesel Pumps to Bench 4',
      description:
        'Deploy auxiliary dewatering skid to pit sump to evacuate 4,200 m3/hr excess water accumulation and prevent bench flooding.',
      priority: 'URGENT',
      estimated_yield_recovery_mt: 2600.0,
      cost_estimate_inr: 350000.0,
      status: 'PROPOSED',
      notes: 'Authorized by DGMS Safety Protocol for monsoon surge management.',
      created_at: new Date(Date.now() - 7200000).toISOString(),
      executed_at: null,
    },
    {
      id: 'a01a0001-0000-0000-0000-000000000002',
      prediction_id: 'p01a0001-0000-0000-0000-000000000001',
      mine_id: 'b01a0001-0000-0000-0000-000000000002',
      action_type: 'LOGISTICAL_REROUTE',
      title: 'Activate North-Eastern Gravel Haulage Bypass',
      description:
        'Reroute CAT 773E dumpers away from inundated South incline to high-traction gravel bypass to maintain 85% hauling rate.',
      priority: 'HIGH',
      estimated_yield_recovery_mt: 1100.0,
      cost_estimate_inr: 75000.0,
      status: 'PROPOSED',
      notes: 'Road stabilization crew dispatched with 40mm aggregate surfacing.',
      created_at: new Date(Date.now() - 7200000).toISOString(),
      executed_at: null,
    },
  ];

  const audit_logs: AuditLog[] = [
    {
      id: 'l01a0001-0000-0000-0000-000000000001',
      user_id: 'system_init',
      action: 'SYSTEM_BOOTSTRAP',
      resource_type: 'SYSTEM',
      resource_id: 'moil_master',
      details: { event: 'Database initialized with 8 primary MOIL mines and telemetry models.' },
      timestamp: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  return {
    mines,
    mining_equipment,
    historical_yields,
    weather_telemetry,
    shortfall_predictions,
    corrective_actions,
    audit_logs,
  };
}

// -----------------------------------------------------------------------------
// 2. FLUENT IN-MEMORY QUERY BUILDER
// -----------------------------------------------------------------------------
export class MockQueryBuilder<T = any> {
  private tableName: string;
  private tables: Record<string, any[]>;
  private filters: Array<(row: any) => boolean> = [];
  private orderConfig: { column: string; ascending: boolean } | null = null;
  private limitCount: number | null = null;
  private offsetCount: number | null = null;
  private selectedColumns: string | null = null;

  constructor(tableName: string, tables: Record<string, any[]>) {
    this.tableName = tableName;
    this.tables = tables;
  }

  select(columns: string = '*', options?: { count?: 'exact' }) {
    this.selectedColumns = columns;
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push((row) => row[column] !== value);
    return this;
  }

  gt(column: string, value: any) {
    this.filters.push((row) => row[column] > value);
    return this;
  }

  gte(column: string, value: any) {
    this.filters.push((row) => row[column] >= value);
    return this;
  }

  lt(column: string, value: any) {
    this.filters.push((row) => row[column] < value);
    return this;
  }

  lte(column: string, value: any) {
    this.filters.push((row) => row[column] <= value);
    return this;
  }

  in(column: string, values: any[]) {
    this.filters.push((row) => values.includes(row[column]));
    return this;
  }

  like(column: string, pattern: string) {
    const regex = new RegExp(`^${pattern.replace(/%/g, '.*')}$`);
    this.filters.push((row) => regex.test(String(row[column] || '')));
    return this;
  }

  ilike(column: string, pattern: string) {
    const regex = new RegExp(`^${pattern.replace(/%/g, '.*')}$`, 'i');
    this.filters.push((row) => regex.test(String(row[column] || '')));
    return this;
  }

  order(column: string, config: { ascending?: boolean } = { ascending: true }) {
    this.orderConfig = { column, ascending: config.ascending !== false };
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  range(from: number, to: number) {
    this.offsetCount = from;
    this.limitCount = to - from + 1;
    return this;
  }

  async single(): Promise<{ data: T | null; error: any }> {
    const res = await this.execute();
    if (res.error) return { data: null, error: res.error };
    const items = res.data || [];
    if (items.length === 0) {
      return { data: null, error: { message: 'Row not found', code: 'PGRST116' } };
    }
    return { data: items[0], error: null };
  }

  async maybeSingle(): Promise<{ data: T | null; error: any }> {
    const res = await this.execute();
    if (res.error) return { data: null, error: res.error };
    const items = res.data || [];
    return { data: items.length > 0 ? items[0] : null, error: null };
  }

  async insert(recordOrRecords: any | any[]): Promise<{ data: any; error: any; select: () => Promise<any> }> {
    const records = Array.isArray(recordOrRecords) ? recordOrRecords : [recordOrRecords];
    const table = this.tables[this.tableName] || (this.tables[this.tableName] = []);

    const insertedRows: any[] = [];
    for (const record of records) {
      const newRow = {
        id: record.id || `mock-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        created_at: record.created_at || new Date().toISOString(),
        updated_at: record.updated_at || new Date().toISOString(),
        ...record,
      };
      table.push(newRow);
      insertedRows.push(newRow);
    }

    const data = Array.isArray(recordOrRecords) ? insertedRows : insertedRows[0];
    return {
      data,
      error: null,
      select: async () => ({ data, error: null }),
    };
  }

  async update(patch: any): Promise<{ data: any; error: any; select: () => Promise<any> }> {
    const table = this.tables[this.tableName] || [];
    const updatedRows: any[] = [];

    for (let i = 0; i < table.length; i++) {
      const matches = this.filters.every((f) => f(table[i]));
      if (matches) {
        table[i] = {
          ...table[i],
          ...patch,
          updated_at: new Date().toISOString(),
        };
        updatedRows.push(table[i]);
      }
    }

    return {
      data: updatedRows,
      error: null,
      select: async () => ({ data: updatedRows, error: null }),
    };
  }

  async delete(): Promise<{ data: any; error: any }> {
    const table = this.tables[this.tableName] || [];
    const remaining: any[] = [];
    const deleted: any[] = [];

    for (const row of table) {
      const matches = this.filters.every((f) => f(row));
      if (matches) {
        deleted.push(row);
      } else {
        remaining.push(row);
      }
    }

    this.tables[this.tableName] = remaining;
    return { data: deleted, error: null };
  }

  // Make query builder awaitable
  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: { data: T[]; error: any; count: number | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled as any, onrejected);
  }

  private async execute(): Promise<{ data: T[]; error: any; count: number | null }> {
    let rows = [...(this.tables[this.tableName] || [])];

    // Apply all filters
    for (const filter of this.filters) {
      rows = rows.filter(filter);
    }

    const totalCount = rows.length;

    // Apply ordering
    if (this.orderConfig) {
      const { column, ascending } = this.orderConfig;
      rows.sort((a, b) => {
        const valA = a[column];
        const valB = b[column];
        if (valA === valB) return 0;
        if (valA == null) return ascending ? -1 : 1;
        if (valB == null) return ascending ? 1 : -1;
        if (valA < valB) return ascending ? -1 : 1;
        return ascending ? 1 : -1;
      });
    }

    // Apply pagination / range / limit
    if (this.offsetCount != null) {
      rows = rows.slice(this.offsetCount);
    }
    if (this.limitCount != null) {
      rows = rows.slice(0, this.limitCount);
    }

    return {
      data: rows,
      error: null,
      count: totalCount,
    };
  }
}

// -----------------------------------------------------------------------------
// 3. IN-MEMORY MOCK SUPABASE CLIENT
// -----------------------------------------------------------------------------
export class MockSupabaseClient {
  public tables: Record<string, any[]>;

  constructor() {
    this.tables = getInitialSeedData();
  }

  from(tableName: string) {
    return new MockQueryBuilder(tableName, this.tables);
  }

  reset() {
    this.tables = getInitialSeedData();
  }

  auth = {
    getUser: async () => ({
      data: {
        user: {
          id: 'u01a0001-0000-0000-0000-000000000001',
          email: 'operator@moil.nic.in',
          role: 'authenticated',
        },
      },
      error: null,
    }),
    getSession: async () => ({
      data: {
        session: {
          access_token: 'mock-jwt-token-moil-2026',
          user: { id: 'u01a0001-0000-0000-0000-000000000001', email: 'operator@moil.nic.in' },
        },
      },
      error: null,
    }),
    signInWithPassword: async ({ email, password }: any) => ({
      data: {
        user: { id: 'u01a0001-0000-0000-0000-000000000001', email },
        session: { access_token: 'mock-jwt-token-moil-2026' },
      },
      error: null,
    }),
    signOut: async () => ({ error: null }),
  };
}

// -----------------------------------------------------------------------------
// 4. CLIENT SINGLETON & RESILIENT FACTORY
// -----------------------------------------------------------------------------
let singletonClient: any = null;
let mockClientInstance: MockSupabaseClient | null = null;

export function getMockSupabaseClient(): MockSupabaseClient {
  if (!mockClientInstance) {
    mockClientInstance = new MockSupabaseClient();
  }
  return mockClientInstance;
}

export function isMockMode(): boolean {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const forceMock =
    process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' ||
    process.env.USE_MOCK_DATA === 'true';

  const isDummyUrl =
    !supabaseUrl ||
    supabaseUrl.includes('placeholder.supabase.co') ||
    supabaseUrl.includes('example.com') ||
    supabaseUrl === 'your-supabase-url';

  const isDummyKey = !supabaseAnonKey || supabaseAnonKey.includes('placeholder');

  return forceMock || isDummyUrl || isDummyKey;
}

export function getSupabase(): any {
  if (singletonClient) return singletonClient;

  if (isMockMode()) {
    singletonClient = getMockSupabaseClient();
    return singletonClient;
  }

  // Attempt Live Supabase Client Initialization
  try {
    // Dynamic require/import if available in environment
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    singletonClient = createClient(supabaseUrl, supabaseAnonKey);
    return singletonClient;
  } catch (err) {
    // Fall back to Mock Supabase Client gracefully
    singletonClient = getMockSupabaseClient();
    return singletonClient;
  }
}

// Default export for standard imports
export const supabase = getSupabase();
