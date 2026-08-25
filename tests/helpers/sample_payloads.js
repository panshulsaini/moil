/**
 * Authoritative Sample Payloads and Test Fixtures for MOIL E2E Test Suite
 * Grounded in PROJECT.md, TEST_INFRA.md, and Survey Specifications.
 */

const MOIL_MINES = [
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
  },
];

const VALID_PREDICTION_REQUEST = {
  mine_id: 'b01a0001-0000-0000-0000-000000000001',
  horizon_days: 14,
  weather_overrides: {
    rainfall_mm: 35.5,
    soil_moisture_pct: 68.0,
    surface_temp_c: 29.5,
    humidity_pct: 78.0,
    satellite_ndvi: 0.42,
  },
  equipment_status_overrides: [
    {
      equipment_code: 'EQ-BAL-PUMP-01',
      status: 'OPERATIONAL',
      health_score: 85.0,
      vibration_level_mm_s: 2.1,
    },
  ],
  target_override_mt: 15000.0,
};

const MONSOON_CRITICAL_REQUEST = {
  mine_id: 'b01a0001-0000-0000-0000-000000000002',
  horizon_days: 7,
  weather_overrides: {
    rainfall_mm: 145.0,
    soil_moisture_pct: 96.5,
    surface_temp_c: 24.0,
    humidity_pct: 98.0,
    satellite_ndvi: 0.58,
  },
  equipment_status_overrides: [
    {
      equipment_code: 'EQ-DON-PUMP-01',
      status: 'CRITICAL_FAILURE',
      health_score: 22.0,
      vibration_level_mm_s: 8.5,
    },
  ],
  target_override_mt: 18000.0,
};

const OPTIMAL_DRY_REQUEST = {
  mine_id: 'b01a0001-0000-0000-0000-000000000001',
  horizon_days: 30,
  weather_overrides: {
    rainfall_mm: 0.0,
    soil_moisture_pct: 22.0,
    surface_temp_c: 32.0,
    humidity_pct: 40.0,
    satellite_ndvi: 0.35,
  },
  equipment_status_overrides: [
    {
      equipment_code: 'EQ-BAL-PUMP-01',
      status: 'OPERATIONAL',
      health_score: 98.0,
      vibration_level_mm_s: 1.1,
    },
  ],
  target_override_mt: 20000.0,
};

const FASTAPI_TELEMETRY_SAMPLE = {
  satellite: {
    rainfall_24h_mm: 28.5,
    rainfall_7d_cumulative_mm: 110.0,
    soil_moisture_pct: 74.2,
    flood_risk_score: 45.0,
    slope_erosion_index: 2.5,
  },
  equipment: {
    fleet_availability_pct: 82.0,
    active_excavators: 4,
    active_dumpers: 12,
    unscheduled_downtime_hours: 3.5,
    dumper_cycle_time_min: 32.0,
    dewatering_pump_capacity_m3hr: 300.0,
    maintenance_backlog_score: 3.0,
  },
  geology: {
    mine_id: 'MOIL-BAL-01',
    mine_name: 'Balaghat Mine',
    sector_id: 'North-Pit-B4',
    planned_tonnage: 15000.0,
    target_grade_mn_pct: 43.5,
    estimated_block_grade_mn_pct: 41.2,
    stripping_ratio: 4.8,
    ore_moisture_pct: 8.5,
  },
  forecast_days: 7,
};

module.exports = {
  MOIL_MINES,
  VALID_PREDICTION_REQUEST,
  MONSOON_CRITICAL_REQUEST,
  OPTIMAL_DRY_REQUEST,
  FASTAPI_TELEMETRY_SAMPLE,
};
