import {
  Mine,
  MiningEquipment,
  WeatherTelemetry,
  HistoricalYield,
  CorrectiveAction,
  RiskLevel,
  ActionPriority,
  ActionStatus,
} from "./types";

export interface MineTelemetryNode {
  id: string;
  mine_id: string;
  mine_name: string;
  sensor_type: "TDR_SOIL_MOISTURE" | "PIEZOMETER" | "RAIN_GAUGE" | "INCLINOMETER" | "PUMP_FLOWMETER";
  location: string;
  reading: string;
  unit: string;
  battery_pct: number;
  signal_rssi: number;
  status: "NORMAL" | "WARNING" | "CRITICAL";
  last_ping: string;
}

export const PAN_INDIA_ZONES = [
  { lat: 21.95, lng: 85.35, name: "Keonjhar, Odisha", radiusKm: 15, spread: 2.5 },
  { lat: 15.15, lng: 76.60, name: "Sandur/Bellary, Karnataka", radiusKm: 12, spread: 2.0 },
  { lat: 15.30, lng: 74.10, name: "Goa Manganese Belt", radiusKm: 10, spread: 1.8 },
  { lat: 22.45, lng: 73.65, name: "Panchmahal, Gujarat", radiusKm: 14, spread: 2.2 },
  { lat: 22.25, lng: 85.80, name: "Singhbhum, Jharkhand", radiusKm: 18, spread: 3.0 },
  { lat: 18.25, lng: 83.00, name: "Vizianagaram, AP", radiusKm: 10, spread: 1.5 }
];

export const GLOBAL_ZONES = [
  { lat: -27.1, lng: 22.9, name: "Kalahari Manganese Field, South Africa", radiusKm: 80, spread: 12.0 },
  { lat: -13.9, lng: 136.4, name: "Groote Eylandt, Australia", radiusKm: 40, spread: 5.0 },
  { lat: -1.5, lng: 13.2, name: "Moanda, Gabon", radiusKm: 30, spread: 4.0 },
  { lat: -6.0, lng: -50.2, name: "Carajás, Brazil", radiusKm: 35, spread: 4.5 },
  { lat: 47.7, lng: 34.3, name: "Nikopol, Ukraine", radiusKm: 25, spread: 3.5 },
  { lat: 27.8, lng: 112.9, name: "Xiangtan, China", radiusKm: 20, spread: 3.0 },
  { lat: 5.3, lng: -1.9, name: "Nsuta, Ghana", radiusKm: 15, spread: 2.5 }
];

export interface TelemetryTimeSeriesPoint {
  time: string;
  rainfall_mm_hr: number;
  cumulative_rainfall_mm: number;
  extraction_tonnes: number;
  target_tonnes: number;
  soil_moisture_pct: number;
  factor_of_safety: number;
  pore_pressure_kpa: number;
  pump_discharge_gpm: number;
  sump_inflow_gpm: number;
  manganese_grade_pct: number;
}

export interface GpsFleetMarker {
  id: string;
  code: string;
  mine_id: string;
  type: "EXCAVATOR" | "HAUL_TRUCK" | "DEWATERING_PUMP" | "DRILL_RIG";
  name: string;
  lat: number;
  lng: number;
  speed_kmh: number;
  fuel_level_pct: number;
  health_score: number;
  current_payload_mt?: number;
  status: "OPERATIONAL" | "MAINTENANCE_REQUIRED" | "CRITICAL_FAILURE" | "STANDBY";
  hazard_alert?: string;
}

export const MOIL_MINES: (Mine & {
  depth_m: number;
  primary_grade: string;
  target_daily_tonnage: number;
  current_daily_tonnage: number;
  current_rainfall_mm_hr: number;
  current_soil_moisture_pct: number;
  current_pore_pressure_kpa: number;
  fleet_uptime_pct: number;
  shortfall_risk_score: number;
  risk_level: RiskLevel;
  shortfall_tonnage_est: number;
  active_alerts: number;
  pump_capacity_gpm: number;
})[] = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    code: "MOIL-BAL",
    name: "Balaghat Mine",
    state: "Madhya Pradesh",
    district: "Balaghat",
    latitude: 21.8124,
    longitude: 80.1832,
    mine_type: "UNDERGROUND",
    annual_capacity_mt: 450000,
    established_year: 1901,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-08-25T00:00:00Z",
    depth_m: 435,
    primary_grade: "48% Mn Pyrolusite",
    target_daily_tonnage: 1200,
    current_daily_tonnage: 860,
    current_rainfall_mm_hr: 38.5,
    current_soil_moisture_pct: 68.2,
    current_pore_pressure_kpa: 48.0,
    fleet_uptime_pct: 78.5,
    shortfall_risk_score: 76.4,
    risk_level: "CRITICAL",
    shortfall_tonnage_est: 340,
    active_alerts: 4,
    pump_capacity_gpm: 3200,
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    code: "MOIL-DON",
    name: "Dongri Buzurg Mine",
    state: "Maharashtra",
    district: "Bhandara",
    latitude: 21.5638,
    longitude: 79.7121,
    mine_type: "OPENCAST",
    annual_capacity_mt: 520000,
    established_year: 1921,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-08-25T00:00:00Z",
    depth_m: 110,
    primary_grade: "78% MnO2 Battery/EMD Grade",
    target_daily_tonnage: 1450,
    current_daily_tonnage: 1080,
    current_rainfall_mm_hr: 42.0,
    current_soil_moisture_pct: 74.5,
    current_pore_pressure_kpa: 39.2,
    fleet_uptime_pct: 72.0,
    shortfall_risk_score: 82.1,
    risk_level: "CRITICAL",
    shortfall_tonnage_est: 370,
    active_alerts: 5,
    pump_capacity_gpm: 4500,
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    code: "MOIL-MAN",
    name: "Mansar Mine",
    state: "Maharashtra",
    district: "Nagpur",
    latitude: 21.3982,
    longitude: 79.2847,
    mine_type: "MIXED",
    annual_capacity_mt: 240000,
    established_year: 1905,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-08-25T00:00:00Z",
    depth_m: 160,
    primary_grade: "40% Ferro Grade Mn",
    target_daily_tonnage: 650,
    current_daily_tonnage: 580,
    current_rainfall_mm_hr: 14.2,
    current_soil_moisture_pct: 42.0,
    current_pore_pressure_kpa: 22.0,
    fleet_uptime_pct: 88.0,
    shortfall_risk_score: 28.5,
    risk_level: "MODERATE",
    shortfall_tonnage_est: 70,
    active_alerts: 1,
    pump_capacity_gpm: 2100,
  },
  {
    id: "00000000-0000-0000-0000-000000000004",
    code: "MOIL-CHK",
    name: "Chikla Mine",
    state: "Maharashtra",
    district: "Bhandara",
    latitude: 21.5542,
    longitude: 79.7523,
    mine_type: "UNDERGROUND",
    annual_capacity_mt: 220000,
    established_year: 1901,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-08-25T00:00:00Z",
    depth_m: 220,
    primary_grade: "44% Mn Ore",
    target_daily_tonnage: 600,
    current_daily_tonnage: 530,
    current_rainfall_mm_hr: 22.1,
    current_soil_moisture_pct: 55.4,
    current_pore_pressure_kpa: 31.0,
    fleet_uptime_pct: 84.0,
    shortfall_risk_score: 44.0,
    risk_level: "MODERATE",
    shortfall_tonnage_est: 70,
    active_alerts: 2,
    pump_capacity_gpm: 2400,
  },
  {
    id: "00000000-0000-0000-0000-000000000005",
    code: "MOIL-KAN",
    name: "Kandri Mine",
    state: "Maharashtra",
    district: "Nagpur",
    latitude: 21.4231,
    longitude: 79.2715,
    mine_type: "MIXED",
    annual_capacity_mt: 290000,
    established_year: 1904,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-08-25T00:00:00Z",
    depth_m: 180,
    primary_grade: "43% Mn Ore",
    target_daily_tonnage: 800,
    current_daily_tonnage: 690,
    current_rainfall_mm_hr: 18.0,
    current_soil_moisture_pct: 49.0,
    current_pore_pressure_kpa: 27.5,
    fleet_uptime_pct: 82.5,
    shortfall_risk_score: 38.0,
    risk_level: "MODERATE",
    shortfall_tonnage_est: 110,
    active_alerts: 2,
    pump_capacity_gpm: 2600,
  },
  {
    id: "00000000-0000-0000-0000-000000000006",
    code: "MOIL-GUM",
    name: "Gumgaon Mine",
    state: "Maharashtra",
    district: "Nagpur",
    latitude: 21.3812,
    longitude: 78.9842,
    mine_type: "UNDERGROUND",
    annual_capacity_mt: 275000,
    established_year: 1902,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-08-25T00:00:00Z",
    depth_m: 280,
    primary_grade: "46% High Grade Mn",
    target_daily_tonnage: 750,
    current_daily_tonnage: 720,
    current_rainfall_mm_hr: 8.5,
    current_soil_moisture_pct: 32.0,
    current_pore_pressure_kpa: 19.0,
    fleet_uptime_pct: 91.0,
    shortfall_risk_score: 16.5,
    risk_level: "LOW",
    shortfall_tonnage_est: 30,
    active_alerts: 0,
    pump_capacity_gpm: 1800,
  },
  {
    id: "00000000-0000-0000-0000-000000000007",
    code: "MOIL-TIR",
    name: "Tirodi Mine",
    state: "Madhya Pradesh",
    district: "Balaghat",
    latitude: 21.6842,
    longitude: 79.7214,
    mine_type: "OPENCAST",
    annual_capacity_mt: 330000,
    established_year: 1902,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-08-25T00:00:00Z",
    depth_m: 120,
    primary_grade: "44% Mn Pyrolusite",
    target_daily_tonnage: 900,
    current_daily_tonnage: 810,
    current_rainfall_mm_hr: 29.0,
    current_soil_moisture_pct: 61.2,
    current_pore_pressure_kpa: 34.0,
    fleet_uptime_pct: 80.0,
    shortfall_risk_score: 52.0,
    risk_level: "HIGH",
    shortfall_tonnage_est: 90,
    active_alerts: 3,
    pump_capacity_gpm: 3100,
  },
  {
    id: "00000000-0000-0000-0000-000000000008",
    code: "MOIL-UKW",
    name: "Ukwa Mine",
    state: "Madhya Pradesh",
    district: "Balaghat",
    latitude: 21.9612,
    longitude: 80.4721,
    mine_type: "UNDERGROUND",
    annual_capacity_mt: 200000,
    established_year: 1906,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-08-25T00:00:00Z",
    depth_m: 190,
    primary_grade: "45% Low Phosphorus Mn",
    target_daily_tonnage: 550,
    current_daily_tonnage: 510,
    current_rainfall_mm_hr: 24.5,
    current_soil_moisture_pct: 48.0,
    current_pore_pressure_kpa: 28.0,
    fleet_uptime_pct: 89.0,
    shortfall_risk_score: 29.0,
    risk_level: "MODERATE",
    shortfall_tonnage_est: 40,
    active_alerts: 1,
    pump_capacity_gpm: 1900,
  },
];

export const MOCK_SENSOR_NODES: MineTelemetryNode[] = [
  {
    id: "NODE-BAL-01",
    mine_id: "00000000-0000-0000-0000-000000000001",
    mine_name: "Balaghat Mine",
    sensor_type: "PIEZOMETER",
    location: "Shaft 2 Level -410m",
    reading: "48.2",
    unit: "kPa",
    battery_pct: 89,
    signal_rssi: -64,
    status: "CRITICAL",
    last_ping: "Just now",
  },
  {
    id: "NODE-BAL-02",
    mine_id: "00000000-0000-0000-0000-000000000001",
    mine_name: "Balaghat Mine",
    sensor_type: "PUMP_FLOWMETER",
    location: "Main Sump Station A",
    reading: "3,180",
    unit: "GPM",
    battery_pct: 94,
    signal_rssi: -58,
    status: "WARNING",
    last_ping: "1m ago",
  },
  {
    id: "NODE-DON-01",
    mine_id: "00000000-0000-0000-0000-000000000002",
    mine_name: "Dongri Buzurg Mine",
    sensor_type: "TDR_SOIL_MOISTURE",
    location: "South Overburden Bench 4",
    reading: "74.5",
    unit: "%",
    battery_pct: 76,
    signal_rssi: -72,
    status: "CRITICAL",
    last_ping: "2m ago",
  },
  {
    id: "NODE-DON-02",
    mine_id: "00000000-0000-0000-0000-000000000002",
    mine_name: "Dongri Buzurg Mine",
    sensor_type: "RAIN_GAUGE",
    location: "Pit Weather Mast West",
    reading: "42.0",
    unit: "mm/hr",
    battery_pct: 98,
    signal_rssi: -52,
    status: "CRITICAL",
    last_ping: "Just now",
  },
  {
    id: "NODE-DON-03",
    mine_id: "00000000-0000-0000-0000-000000000002",
    mine_name: "Dongri Buzurg Mine",
    sensor_type: "INCLINOMETER",
    location: "Highwall Bench 3",
    reading: "1.18",
    unit: "FOS",
    battery_pct: 82,
    signal_rssi: -68,
    status: "CRITICAL",
    last_ping: "3m ago",
  },
  {
    id: "NODE-TIR-01",
    mine_id: "00000000-0000-0000-0000-000000000007",
    mine_name: "Tirodi Mine",
    sensor_type: "TDR_SOIL_MOISTURE",
    location: "Haul Road Incline North",
    reading: "61.2",
    unit: "%",
    battery_pct: 88,
    signal_rssi: -65,
    status: "WARNING",
    last_ping: "4m ago",
  },
  {
    id: "NODE-MAN-01",
    mine_id: "00000000-0000-0000-0000-000000000003",
    mine_name: "Mansar Mine",
    sensor_type: "RAIN_GAUGE",
    location: "Crusher Feeder Platform",
    reading: "14.2",
    unit: "mm/hr",
    battery_pct: 95,
    signal_rssi: -54,
    status: "NORMAL",
    last_ping: "1m ago",
  },
  {
    id: "NODE-GUM-01",
    mine_id: "00000000-0000-0000-0000-000000000006",
    mine_name: "Gumgaon Mine",
    sensor_type: "PIEZOMETER",
    location: "Underground Incline Stope 6",
    reading: "19.0",
    unit: "kPa",
    battery_pct: 91,
    signal_rssi: -60,
    status: "NORMAL",
    last_ping: "2m ago",
  },
];

export const MOCK_GPS_FLEET: GpsFleetMarker[] = [
  {
    id: "FL-EX-01",
    code: "EX-BAL-101",
    mine_id: "00000000-0000-0000-0000-000000000001",
    name: "Komatsu PC1250 Hydraulic Shovel",
    type: "EXCAVATOR",
    lat: 21.8135,
    lng: 80.1845,
    speed_kmh: 0,
    fuel_level_pct: 78,
    health_score: 92,
    status: "OPERATIONAL",
  },
  {
    id: "FL-TR-01",
    code: "HT-BAL-204",
    mine_id: "00000000-0000-0000-0000-000000000001",
    name: "BEML BH60M Dumper (60 Tonne)",
    type: "HAUL_TRUCK",
    lat: 21.8118,
    lng: 80.1819,
    speed_kmh: 18.5,
    fuel_level_pct: 64,
    health_score: 85,
    current_payload_mt: 58.2,
    status: "OPERATIONAL",
  },
  {
    id: "FL-PM-01",
    code: "PM-BAL-402",
    mine_id: "00000000-0000-0000-0000-000000000001",
    name: "Kirloskar High-Head Submersible Pump",
    type: "DEWATERING_PUMP",
    lat: 21.8105,
    lng: 80.1852,
    speed_kmh: 0,
    fuel_level_pct: 95,
    health_score: 68,
    status: "OPERATIONAL",
    hazard_alert: "Operating at 98% duty cycle against 410m head",
  },
  {
    id: "FL-EX-02",
    code: "EX-DON-104",
    mine_id: "00000000-0000-0000-0000-000000000002",
    name: "Tata Hitachi EX1200 Excavator",
    type: "EXCAVATOR",
    lat: 21.5645,
    lng: 79.7135,
    speed_kmh: 0,
    fuel_level_pct: 54,
    health_score: 58,
    status: "MAINTENANCE_REQUIRED",
    hazard_alert: "Bench 3 soft footing caution",
  },
  {
    id: "FL-TR-02",
    code: "HT-DON-209",
    mine_id: "00000000-0000-0000-0000-000000000002",
    name: "CAT 773E Haul Truck (55 Tonne)",
    type: "HAUL_TRUCK",
    lat: 21.5622,
    lng: 79.7108,
    speed_kmh: 12.0,
    fuel_level_pct: 42,
    health_score: 74,
    current_payload_mt: 52.0,
    status: "OPERATIONAL",
    hazard_alert: "Speed restricted to 15 km/h on wet ramp",
  },
  {
    id: "FL-PM-02",
    code: "PM-DON-301",
    mine_id: "00000000-0000-0000-0000-000000000002",
    name: "Flygt 200kW Heavy Duty Dewatering Sump",
    type: "DEWATERING_PUMP",
    lat: 21.5655,
    lng: 79.7145,
    speed_kmh: 0,
    fuel_level_pct: 100,
    health_score: 89,
    status: "OPERATIONAL",
  },
  {
    id: "FL-TR-03",
    code: "HT-TIR-301",
    mine_id: "00000000-0000-0000-0000-000000000007",
    name: "BEML BH35-2 Hauler",
    type: "HAUL_TRUCK",
    lat: 21.6855,
    lng: 79.7225,
    speed_kmh: 22.0,
    fuel_level_pct: 81,
    health_score: 94,
    current_payload_mt: 34.8,
    status: "OPERATIONAL",
  },
  {
    id: "FL-EX-03",
    code: "EX-MAN-102",
    mine_id: "00000000-0000-0000-0000-000000000003",
    name: "L&T Komatsu PC450",
    type: "EXCAVATOR",
    lat: 21.3995,
    lng: 79.2862,
    speed_kmh: 0,
    fuel_level_pct: 88,
    health_score: 96,
    status: "OPERATIONAL",
  },
];

export const MOCK_CORRECTIVE_ACTIONS: CorrectiveAction[] = [
  {
    id: "ACT-DEW-001",
    prediction_id: "PRED-001",
    mine_id: "00000000-0000-0000-0000-000000000001",
    action_type: "DEWATERING_BOOST",
    title: "Deploy Auxiliary Submersible Pump to Sump 3",
    description: "Activate auxiliary 1500 GPM pump unit at Balaghat deep shaft (-410m level) to prevent inundation and restore extraction face availability.",
    priority: "URGENT",
    estimated_yield_recovery_mt: 220,
    cost_estimate_inr: 45000,
    status: "PROPOSED",
    notes: "Requires DGMS clearance for high-head operation",
    created_at: "2026-08-25T08:30:00Z",
    executed_at: null,
  },
  {
    id: "ACT-FLEET-002",
    prediction_id: "PRED-002",
    mine_id: "00000000-0000-0000-0000-000000000002",
    action_type: "FLEET_REROUTING",
    title: "Divert 5x 55T Dumpers from Inundated Bench 4 to Highwall Sector 1",
    description: "Re-assign haulage fleet to dry gravel-paved ridge bench to maintain extraction run-rate while lower pit sump is cleared.",
    priority: "HIGH",
    estimated_yield_recovery_mt: 290,
    cost_estimate_inr: 28000,
    status: "ACKNOWLEDGED",
    notes: "Speed limit restricted to 20 km/h due to wet transition ramp",
    created_at: "2026-08-25T09:15:00Z",
    executed_at: null,
  },
  {
    id: "ACT-GRADE-003",
    prediction_id: "PRED-003",
    mine_id: "00000000-0000-0000-0000-000000000003",
    action_type: "GRADE_BLENDING",
    title: "Crusher Grade Blending Ratio Adjustment",
    description: "Blend 35% dry stockpile high-grade manganese ore with 65% run-of-mine wet feed at Mansar crusher to prevent chute blockage and preserve 42% Mn grade target.",
    priority: "MEDIUM",
    estimated_yield_recovery_mt: 140,
    cost_estimate_inr: 15000,
    status: "EXECUTED",
    notes: "Completed by Shift In-Charge",
    created_at: "2026-08-25T06:00:00Z",
    executed_at: "2026-08-25T07:45:00Z",
  },
  {
    id: "ACT-HAUL-004",
    prediction_id: "PRED-004",
    mine_id: "00000000-0000-0000-0000-000000000007",
    action_type: "HAUL_ROAD_MAINTENANCE",
    title: "Spread Crushed Slag Aggregate on Tirodi North Ramp",
    description: "Apply 60 MT of coarse crushed aggregate on slick 8% incline haul road section to elevate traction coefficient above 0.45.",
    priority: "HIGH",
    estimated_yield_recovery_mt: 180,
    cost_estimate_inr: 32000,
    status: "PROPOSED",
    notes: "Aggregate loader standby at Stockpile 2",
    created_at: "2026-08-25T10:00:00Z",
    executed_at: null,
  },
  {
    id: "ACT-SLOPE-005",
    prediction_id: "PRED-005",
    mine_id: "00000000-0000-0000-0000-000000000002",
    action_type: "SLOPE_STABILIZATION",
    title: "Install Horizontal Pervious French Drains on Overburden Bench 3",
    description: "Relieve perched groundwater table causing Factor of Safety drop to 1.18 behind active opencast face.",
    priority: "URGENT",
    estimated_yield_recovery_mt: 260,
    cost_estimate_inr: 85000,
    status: "ACKNOWLEDGED",
    notes: "DGMS safety protocol Section 106 triggered",
    created_at: "2026-08-25T07:10:00Z",
    executed_at: null,
  },
];

export function generateTelemetrySeries(
  mineId: string | null = "00000000-0000-0000-0000-000000000001",
  hoursCount: number = 24
): TelemetryTimeSeriesPoint[] {
  const points: TelemetryTimeSeriesPoint[] = [];

  // If a specific mine is selected, generate for that mine.
  // Otherwise, aggregate across all mines.
  const isAll = !mineId || mineId === "ALL";
  const minesToProcess = isAll ? MOIL_MINES : [MOIL_MINES.find((m) => m.id === mineId) || MOIL_MINES[0]];

  // We need to keep track of cumulative rainfall for each mine independently
  const cumRainfalls = minesToProcess.map(() => 0);

  for (let i = 0; i < hoursCount; i++) {
    const hour = (i + 1).toString().padStart(2, "0") + ":00";
    
    let totalRain = 0;
    let totalCumRain = 0;
    let totalExtraction = 0;
    let totalTarget = 0;
    let avgMoisture = 0;
    let avgFos = 0;
    let avgPorePressure = 0;
    let totalPumpDischarge = 0;
    let totalSumpInflow = 0;
    let avgGrade = 0;

    minesToProcess.forEach((baseMine, idx) => {
      const targetHourly = baseMine.target_daily_tonnage / 24;
      
      const rainNoise = Math.sin((i / hoursCount) * Math.PI) * (baseMine.current_rainfall_mm_hr * 1.3);
      const rain = Math.max(0, parseFloat((rainNoise + (Math.sin(i * 1.5) * 4)).toFixed(1)));
      cumRainfalls[idx] += rain;
      const cumRainfall = cumRainfalls[idx];

      const moisture = Math.min(
        95,
        Math.max(
          20,
          parseFloat((baseMine.current_soil_moisture_pct - 15 + (cumRainfall * 0.4) + Math.sin(i * 0.8) * 3).toFixed(1))
        )
      );

      const fos = Math.max(1.05, parseFloat((2.2 - (moisture / 100) * 1.1).toFixed(2)));
      const sumpInflow = Math.round(1200 + rain * 65 + (moisture * 12));
      const pumpDischarge = Math.min(baseMine.pump_capacity_gpm, Math.round(sumpInflow * 0.95 + 150));
      const rainPenalty = Math.min(0.7, (rain / 50) * 0.5 + (moisture > 65 ? 0.25 : 0.05));
      const extraction = Math.round(targetHourly * (1 - rainPenalty) * (0.9 + Math.random() * 0.2));
      const porePressure = Math.round(15 + (moisture * 0.45) + (rain * 0.3));
      const grade = parseFloat((42.5 + Math.sin(i) * 2.2).toFixed(1));

      totalRain += rain;
      totalCumRain += cumRainfall;
      totalExtraction += extraction;
      totalTarget += Math.round(targetHourly);
      avgMoisture += moisture;
      avgFos += fos;
      avgPorePressure += porePressure;
      totalPumpDischarge += pumpDischarge;
      totalSumpInflow += sumpInflow;
      avgGrade += grade;
    });

    const count = minesToProcess.length;

    points.push({
      time: hour,
      rainfall_mm_hr: parseFloat((totalRain / count).toFixed(1)), // Average regional rain
      cumulative_rainfall_mm: parseFloat((totalCumRain / count).toFixed(1)),
      extraction_tonnes: totalExtraction, // Sum of all extraction
      target_tonnes: totalTarget, // Sum of all targets
      soil_moisture_pct: parseFloat((avgMoisture / count).toFixed(1)),
      factor_of_safety: parseFloat((avgFos / count).toFixed(2)),
      pore_pressure_kpa: parseFloat((avgPorePressure / count).toFixed(1)),
      pump_discharge_gpm: totalPumpDischarge,
      sump_inflow_gpm: totalSumpInflow,
      manganese_grade_pct: parseFloat((avgGrade / count).toFixed(1)),
    });
  }

  return points;
}
