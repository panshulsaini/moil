-- =============================================================================
-- MOIL LIMITED PREDICTIVE INTELLIGENCE PLATFORM — DATABASE SCHEMA
-- Version: 1.0.0
-- Dialect: PostgreSQL 15+ / Supabase
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean up existing objects (for repeatable migrations)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS corrective_actions CASCADE;
DROP TABLE IF EXISTS shortfall_predictions CASCADE;
DROP TABLE IF EXISTS weather_telemetry CASCADE;
DROP TABLE IF EXISTS historical_yields CASCADE;
DROP TABLE IF EXISTS mining_equipment CASCADE;
DROP TABLE IF EXISTS mines CASCADE;

-- Drop custom types if exist
DROP TYPE IF EXISTS mine_type_enum CASCADE;
DROP TYPE IF EXISTS equipment_type_enum CASCADE;
DROP TYPE IF EXISTS equipment_status_enum CASCADE;
DROP TYPE IF EXISTS risk_level_enum CASCADE;
DROP TYPE IF EXISTS action_priority_enum CASCADE;
DROP TYPE IF EXISTS action_status_enum CASCADE;

-- -----------------------------------------------------------------------------
-- ENUM TYPES
-- -----------------------------------------------------------------------------
CREATE TYPE mine_type_enum AS ENUM ('OPENCAST', 'UNDERGROUND', 'MIXED');
CREATE TYPE equipment_type_enum AS ENUM ('EXCAVATOR', 'HAUL_TRUCK', 'DEWATERING_PUMP', 'HOIST_WINCH', 'DRILL_RIG', 'CONVEYOR');
CREATE TYPE equipment_status_enum AS ENUM ('OPERATIONAL', 'MAINTENANCE_REQUIRED', 'CRITICAL_FAILURE', 'STANDBY');
CREATE TYPE risk_level_enum AS ENUM ('LOW', 'MODERATE', 'HIGH', 'CRITICAL');
CREATE TYPE action_priority_enum AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE action_status_enum AS ENUM ('PROPOSED', 'ACKNOWLEDGED', 'EXECUTED', 'DISMISSED');

-- -----------------------------------------------------------------------------
-- TABLE 1: MINES (Master registry of MOIL manganese mining units)
-- -----------------------------------------------------------------------------
CREATE TABLE mines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(16) UNIQUE NOT NULL,
    name VARCHAR(128) NOT NULL,
    state VARCHAR(64) NOT NULL,
    district VARCHAR(64) NOT NULL,
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    mine_type mine_type_enum NOT NULL,
    annual_capacity_mt NUMERIC(12, 2) NOT NULL CHECK (annual_capacity_mt > 0),
    established_year INT CHECK (established_year BETWEEN 1800 AND 2100),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_mines_state ON mines(state);
CREATE INDEX idx_mines_type ON mines(mine_type);
CREATE INDEX idx_mines_active ON mines(is_active);
CREATE INDEX idx_mines_code ON mines(code);

-- -----------------------------------------------------------------------------
-- TABLE 2: MINING_EQUIPMENT (Heavy machinery and telemetry assets)
-- -----------------------------------------------------------------------------
CREATE TABLE mining_equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mine_id UUID NOT NULL REFERENCES mines(id) ON DELETE CASCADE,
    equipment_code VARCHAR(32) UNIQUE NOT NULL,
    name VARCHAR(128) NOT NULL,
    equipment_type equipment_type_enum NOT NULL,
    model VARCHAR(64),
    status equipment_status_enum DEFAULT 'OPERATIONAL' NOT NULL,
    health_score NUMERIC(5, 2) DEFAULT 100.00 NOT NULL CHECK (health_score BETWEEN 0 AND 100),
    operating_hours NUMERIC(10, 2) DEFAULT 0.00 NOT NULL CHECK (operating_hours >= 0),
    vibration_level_mm_s NUMERIC(6, 2) DEFAULT 1.20 NOT NULL CHECK (vibration_level_mm_s >= 0),
    temp_celsius NUMERIC(5, 2) DEFAULT 65.00 NOT NULL,
    fuel_efficiency_pct NUMERIC(5, 2) DEFAULT 92.00 CHECK (fuel_efficiency_pct BETWEEN 0 AND 100),
    last_serviced_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_equipment_mine_id ON mining_equipment(mine_id);
CREATE INDEX idx_equipment_status ON mining_equipment(status);
CREATE INDEX idx_equipment_type ON mining_equipment(equipment_type);
CREATE INDEX idx_equipment_health ON mining_equipment(health_score);

-- -----------------------------------------------------------------------------
-- TABLE 3: HISTORICAL_YIELDS (Monthly & Daily production metrics)
-- -----------------------------------------------------------------------------
CREATE TABLE historical_yields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mine_id UUID NOT NULL REFERENCES mines(id) ON DELETE CASCADE,
    recorded_date DATE NOT NULL,
    target_tonnage NUMERIC(10, 2) NOT NULL CHECK (target_tonnage > 0),
    actual_tonnage NUMERIC(10, 2) NOT NULL CHECK (actual_tonnage >= 0),
    manganese_grade_pct NUMERIC(5, 2) NOT NULL CHECK (manganese_grade_pct BETWEEN 10 AND 60),
    overburden_tonnage NUMERIC(12, 2) DEFAULT 0.00 CHECK (overburden_tonnage >= 0),
    recovery_rate_pct NUMERIC(5, 2) NOT NULL CHECK (recovery_rate_pct BETWEEN 0 AND 100),
    operational_shifts INT DEFAULT 3 CHECK (operational_shifts BETWEEN 1 AND 4),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_mine_yield_date UNIQUE (mine_id, recorded_date)
);

CREATE INDEX idx_yields_mine_date ON historical_yields(mine_id, recorded_date DESC);

-- -----------------------------------------------------------------------------
-- TABLE 4: WEATHER_TELEMETRY (Simulated Satellite & Radar Weather Metrics)
-- -----------------------------------------------------------------------------
CREATE TABLE weather_telemetry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mine_id UUID NOT NULL REFERENCES mines(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL,
    rainfall_mm NUMERIC(6, 2) DEFAULT 0.00 NOT NULL CHECK (rainfall_mm >= 0),
    soil_moisture_pct NUMERIC(5, 2) NOT NULL CHECK (soil_moisture_pct BETWEEN 0 AND 100),
    surface_temp_c NUMERIC(5, 2) NOT NULL,
    humidity_pct NUMERIC(5, 2) NOT NULL CHECK (humidity_pct BETWEEN 0 AND 100),
    wind_speed_kmh NUMERIC(5, 2) DEFAULT 10.00 CHECK (wind_speed_kmh >= 0),
    satellite_ndvi NUMERIC(4, 3) CHECK (satellite_ndvi BETWEEN -1.0 AND 1.0),
    flood_risk_index NUMERIC(4, 2) DEFAULT 0.10 CHECK (flood_risk_index BETWEEN 0 AND 10),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_mine_weather_timestamp UNIQUE (mine_id, timestamp)
);

CREATE INDEX idx_weather_mine_timestamp ON weather_telemetry(mine_id, timestamp DESC);
CREATE INDEX idx_weather_flood_risk ON weather_telemetry(flood_risk_index);

-- -----------------------------------------------------------------------------
-- TABLE 5: SHORTFALL_PREDICTIONS (AI Inference outputs & deficit models)
-- -----------------------------------------------------------------------------
CREATE TABLE shortfall_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mine_id UUID NOT NULL REFERENCES mines(id) ON DELETE CASCADE,
    prediction_timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    horizon_days INT NOT NULL CHECK (horizon_days BETWEEN 1 AND 90),
    target_yield_mt NUMERIC(10, 2) NOT NULL,
    predicted_yield_mt NUMERIC(10, 2) NOT NULL,
    shortfall_tonnage NUMERIC(10, 2) NOT NULL,
    shortfall_risk_level risk_level_enum NOT NULL,
    confidence_score NUMERIC(5, 4) NOT NULL CHECK (confidence_score BETWEEN 0 AND 1),
    primary_failure_mode VARCHAR(128) NOT NULL,
    features_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    model_version VARCHAR(32) DEFAULT 'v1.0.0-xgb' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_predictions_mine_time ON shortfall_predictions(mine_id, prediction_timestamp DESC);
CREATE INDEX idx_predictions_risk ON shortfall_predictions(shortfall_risk_level);

-- -----------------------------------------------------------------------------
-- TABLE 6: CORRECTIVE_ACTIONS (Prescribed engineering & logistical mitigations)
-- -----------------------------------------------------------------------------
CREATE TABLE corrective_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prediction_id UUID REFERENCES shortfall_predictions(id) ON DELETE SET NULL,
    mine_id UUID NOT NULL REFERENCES mines(id) ON DELETE CASCADE,
    action_type VARCHAR(64) NOT NULL,
    title VARCHAR(160) NOT NULL,
    description TEXT NOT NULL,
    priority action_priority_enum DEFAULT 'MEDIUM' NOT NULL,
    estimated_yield_recovery_mt NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    cost_estimate_inr NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    status action_status_enum DEFAULT 'PROPOSED' NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    executed_at TIMESTAMPTZ
);

CREATE INDEX idx_actions_mine_status ON corrective_actions(mine_id, status);
CREATE INDEX idx_actions_priority ON corrective_actions(priority);
CREATE INDEX idx_actions_prediction_id ON corrective_actions(prediction_id);

-- -----------------------------------------------------------------------------
-- TABLE 7: AUDIT_LOGS (Operational & system event tracking)
-- -----------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(64) DEFAULT 'system',
    action VARCHAR(64) NOT NULL,
    resource_type VARCHAR(64) NOT NULL,
    resource_id VARCHAR(64),
    details JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------
ALTER TABLE mines ENABLE ROW LEVEL SECURITY;
ALTER TABLE mining_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE historical_yields ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE shortfall_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE corrective_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Read policies: Allow public/authenticated read access to telemetry and predictions
CREATE POLICY "Allow public read access on mines" ON mines FOR SELECT USING (true);
CREATE POLICY "Allow public read access on equipment" ON mining_equipment FOR SELECT USING (true);
CREATE POLICY "Allow public read access on yields" ON historical_yields FOR SELECT USING (true);
CREATE POLICY "Allow public read access on weather" ON weather_telemetry FOR SELECT USING (true);
CREATE POLICY "Allow public read access on predictions" ON shortfall_predictions FOR SELECT USING (true);
CREATE POLICY "Allow public read access on corrective_actions" ON corrective_actions FOR SELECT USING (true);
CREATE POLICY "Allow public read access on audit_logs" ON audit_logs FOR SELECT USING (true);

-- Mutation policies: Authenticated service role or authenticated users can insert/update
CREATE POLICY "Allow authenticated insert predictions" ON shortfall_predictions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated insert corrective_actions" ON corrective_actions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated update corrective_actions" ON corrective_actions FOR UPDATE USING (true);
CREATE POLICY "Allow authenticated update equipment" ON mining_equipment FOR UPDATE USING (true);
CREATE POLICY "Allow authenticated insert equipment" ON mining_equipment FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated insert weather" ON weather_telemetry FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated log audit" ON audit_logs FOR INSERT WITH CHECK (true);
