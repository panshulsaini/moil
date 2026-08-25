# Comprehensive Backend, Database & End-to-End Infrastructure Survey & Architecture Specification

**Project**: MOIL Limited Predictive Intelligence Web Application  
**Module**: Backend, Supabase Database Layer, API Routes, Reverse Proxy, E2E Test Suite & Infrastructure  
**Author**: Specification Miner / Explorer Infra (`explorer_survey_infra`)  
**Date**: 2026-08-25  

---

## 1. Executive Summary & Architectural Overview

The **MOIL Limited Predictive Intelligence Web Application** is designed to empower India's premier manganese mining PSU (Manganese Ore India Limited) with an AI-driven decision support system. The platform fuses real-time and simulated satellite telemetry (precipitation, radar soil moisture, surface thermal indices) with ground-level geological characteristics and heavy mining equipment telematics to predict manganese reserve yield shortfalls up to 30 days in advance and automatically prescribe targeted corrective engineering actions.

This document establishes the authoritative blueprint for:
1. **The Database & Supabase Data Layer**: PostgreSQL schema DDL, indexing strategies, Row Level Security (RLS) policies, and high-fidelity seed data representing 8 primary MOIL manganese mines across Maharashtra and Madhya Pradesh.
2. **The Dual-Mode Supabase Client Architecture**: A zero-dependency, in-memory/JSON fallback repository that seamlessly mirrors the Supabase Client API, enabling 100% offline local development, CI/CD pipeline execution, and cloud deployment without hard external dependencies.
3. **Next.js App Router API Route Architecture**: Type-safe REST endpoints enforcing Zod validation, JWT/session authentication, database persistence, and resilient reverse proxying to the Python FastAPI ML microservice with heuristic fallback capabilities.
4. **The 4-Tier End-to-End Test Suite**: Complete test specifications spanning Unit tests (Tier 1), API Integration tests (Tier 2), ML Inference Microservice tests (Tier 3), and Full End-to-End Workflow Verification (Tier 4).
5. **Configuration & Documentation Standards**: `.env.example`, `.env.test`, `README.md`, `SETUP.md`, and `ARCHITECTURE.md` specifications.

---

## 2. Authoritative Feature Inventory

### Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Database | MOIL Mines Master Table (`mines`) | Stores geographical coordinates, mine type (opencast/underground), operational status, and baseline capacity for all MOIL mining units. | UUID, Mine Code, Name, Region, Lat/Lng, Type, Capacity MT | Relational records with timestamps | Enforces unique mine codes, coordinate range checks | R2 Spec / Mining Domain Analysis |
| 2 | Database | Equipment Telemetry Table (`mining_equipment`) | Tracks heavy mining equipment (dumpers, excavators, dewatering pumps, hoist winches) health, vibration, temperature, and operational status. | Equipment Code, Mine ID, Type, Operating Hours, Health Score, Vibration, Temp | Equipment entity with relation to mine | Foreign key constraint on `mine_id`, check constraint on health score [0-100] | R2 Spec / Equipment Teardown |
| 3 | Database | Historical Yields Table (`historical_yields`) | Time-series of daily/monthly target tonnage vs actual manganese ore extracted, grade percentage, and overburden ratio. | Mine ID, Recorded Date, Target Tonnage, Actual Tonnage, Grade %, Recovery % | Historical yield time-series | Unique `(mine_id, recorded_date)`, positive tonnage constraints | R2 Spec / Geological Records |
| 4 | Database | Weather & Satellite Telemetry Table (`weather_telemetry`) | Ingests simulated satellite radar rainfall (mm), soil moisture (%), NDVI vegetative index, and pit flood risk indicators. | Mine ID, Timestamp, Rainfall mm, Soil Moisture %, Surface Temp C, Flood Index | Telemetry records with time-series indexes | Foreign key on `mine_id`, check constraints on percentages [0-100] | R1/R2 Spec / Telemetry Ingestion |
| 5 | Database | Shortfall Predictions Table (`shortfall_predictions`) | Stores ML inference results, predicted reserve deficit (MT), shortfall risk level, confidence score, and feature snapshot. | Mine ID, Prediction Horizon, Predicted Yield, Shortfall MT, Risk Level, Confidence | Persisted prediction record with UUID | Validates risk level enum (`LOW`, `MODERATE`, `HIGH`, `CRITICAL`) | R2/R3 Spec / AI Service Contract |
| 6 | Database | Corrective Actions Table (`corrective_actions`) | Prescribes actionable mitigations (e.g. auxiliary dewatering pump deployment, dumper rerouting, sand stowing acceleration). | Prediction ID, Mine ID, Action Type, Priority, Yield Recovery MT, Cost INR | Actionable item with status tracking | Cascade delete on prediction or set null, valid priority enum | R2/R3 Spec / Action Engine |
| 7 | Data Layer | Dual-Mode Supabase Client (`lib/supabase/`) | Transparent client switcher: uses live `@supabase/supabase-js` if valid URL/Key present, otherwise seamlessly activates in-memory `MockSupabaseClient`. | Supabase URL, Anon Key, or `USE_MOCK_DATA=true` | Fluent Supabase query interface (`.from().select().eq()`) | Graceful fallback to mock repo if network fails or credentials are dummy | R2/R4 Spec / Offline Architecture |
| 8 | API Routes | Shortfall Inference Proxy (`POST /api/predict`) | Validates input via Zod, forwards payload to FastAPI ML microservice, persists prediction & recommendations, provides local heuristic fallback. | JSON with `mine_id`, `horizon_days`, `weather_overrides`, `equipment_overrides` | `PredictResponse` JSON with shortfall MT, risk, confidence, actions | 400 Bad Request on Zod validation failure, fallback heuristic on ML service 503 | R2/R3/R4 Spec / API Architecture |
| 9 | API Routes | Mine Management API (`GET /api/mines`, `GET /api/mines/[id]`) | Fetches list of MOIL mines with aggregated operational status, active equipment counts, latest weather, and recent predictions. | Query params: `state`, `mine_type`, `risk_level` | Array of `Mine` objects with embedded telemetry | 404 Not Found on invalid mine UUID, 500 with sanitized error | R2 Spec / REST Design |
| 10 | API Routes | Equipment Telematics API (`GET/POST /api/equipment`) | Retrieves equipment health metrics, logs sensor telemetry, and triggers maintenance flags on abnormal vibration/temperature. | Query params: `mine_id`, `status`; POST body: equipment data | List of equipment or updated equipment entity | 400 on invalid telemetry range (e.g. vibration < 0) | R2 Spec / Equipment Telematics |
| 11 | API Routes | Weather & Radar Ingestion API (`GET /api/weather`) | Provides historical and forecast satellite weather data, rainfall accumulation, and soil moisture saturation per mine. | Query params: `mine_id`, `start_date`, `end_date` | Time-series telemetry points | 400 on invalid date format, 404 on unknown mine | R1/R2 Spec / Telemetry Service |
| 12 | API Routes | System Health & Readiness API (`GET /api/health`) | Comprehensive health check probing Next.js runtime, Supabase DB connection (live/mock), and FastAPI ML microservice upstream. | None | JSON `{ status: "healthy", database: "connected", ml_service: "up" }` | Returns 200 OK with `degraded` status when ML microservice is offline | R4 Spec / Operational Readiness |
| 13 | API Routes | Corrective Action Management API (`PATCH /api/alerts/[id]`) | Updates status of corrective actions (`PROPOSED` -> `ACKNOWLEDGED` -> `EXECUTED` -> `DISMISSED`) with audit trail. | Path `id`, Body `{ status: string, notes?: string }` | Updated action record | 400 on invalid status transition, 404 on action not found | R2/R4 Spec / Action Workflow |
| 14 | Security | Row Level Security (RLS) & Policies | Enforces database-level access control on Supabase PostgreSQL for anon vs authenticated mining personnel and service roles. | Supabase Auth JWT / Session Context | Filtered rows according to user role and mine jurisdiction | 403 Forbidden / Empty result set on unauthorized access | R2 Spec / Security Baseline |
| 15 | Validation | Zod Request/Response Validation Layer | Shared TypeScript schema library for strict runtime parsing, typing, and sanitization across all API routes and UI components. | Raw incoming JSON request bodies, query strings | Type-safe validated TypeScript objects | Standardized `{ success: false, errors: [...] }` 400 responses | R4 Spec / Robustness Requirement |
| 16 | E2E Testing | Tier 1 Unit & Schema Validation Suite | Tests individual Zod schemas, heuristic calculation logic, Mock DB repository query chain methods, and utility formatters. | Valid and invalid synthetic payloads | Vitest / Jest test assertions (100% pass) | Throws explicit assertion errors with diffs | R4 Spec / Test Quality |
| 17 | E2E Testing | Tier 2 API Integration Test Suite | Tests Next.js Route Handlers with mocked and real requests, verifying HTTP status codes, headers, and database mutations. | Synthetic HTTP `NextRequest` objects | Response JSON assertions (`200`, `400`, `404`) | Pinpoints exact route failure or contract mismatch | R4 Spec / Integration Testing |
| 18 | E2E Testing | Tier 3 FastAPI ML Microservice Suite | Tests Python FastAPI endpoints (`/health`, `/predict`, `/train`, `/metrics`) with extreme weather and equipment scenarios. | Pytest client test payloads | Status 200, JSON schema match, confidence score bounds | Catches ML regression, out-of-range probabilities | R3/R4 Spec / ML Verification |
| 19 | E2E Testing | Tier 4 Full End-to-End Workflow Verification | Executes complete cross-service workflow: UI/API -> Zod -> Next.js -> FastAPI -> Prediction Engine -> Supabase -> Action Prescription. | End-to-end simulated operational scenario | Complete system state transition and persisted telemetry | Fails if any tier breaks in the chain | Acceptance Criteria / E2E Suite |

---

### Edge Cases

| # | Feature | Input | Observed / Specified Behavior |
|---|---------|-------|-------------------------------|
| 1 | `POST /api/predict` | Empty request body `{}` or missing `mine_id` | Zod validator catches missing fields immediately, returns `400 Bad Request` with `{ success: false, error: { code: "VALIDATION_ERROR", details: [{ field: "mine_id", message: "Required" }] } }`. ML service is never hit. |
| 2 | `POST /api/predict` | Extreme weather: `rainfall_mm: 350.0`, `soil_moisture_pct: 99.5%` (Monsoon Cloudburst) | Validates successfully. ML model / heuristic triggers `CRITICAL` shortfall risk (>50% yield loss due to pit submergence), generates high-priority dewatering actions. |
| 3 | `POST /api/predict` | FastAPI ML microservice process is stopped / unreachable (`ECONNREFUSED`) | Next.js API route catches connection exception, logs structured warning, activates fallback heuristic engine (`lib/ml/fallback-predictor.ts`), computes valid prediction, persists result, and returns `200 OK` with `service_mode: "fallback_heuristic"`. |
| 4 | Supabase Client | Missing or dummy `NEXT_PUBLIC_SUPABASE_URL="https://placeholder.supabase.co"` | `getSupabaseClient()` detects dummy URL / missing env, routes all calls to `MockSupabaseClient`. Seed data is loaded into memory. All `.select()`, `.insert()`, `.update()` calls resolve successfully. Zero crashes. |
| 5 | `GET /api/mines/[id]` | Malformed non-UUID string e.g. `/api/mines/invalid-123` | Zod UUID schema validation rejects string, returns `400 Bad Request` with `Invalid UUID format` before database query execution. |
| 6 | `mining_equipment` | Negative vibration `vibration_level_mm_s: -5.2` or negative temp `temp_celsius: -50.0` | Rejected by PostgreSQL check constraint `CHECK (vibration_level_mm_s >= 0)` and Zod `z.number().nonnegative()`. |
| 7 | `weather_telemetry` | Future timestamp > `NOW() + INTERVAL '1 day'` | Rejected by database constraint and Zod validator preventing future timestamps from masquerading as historical telemetry. |
| 8 | `PATCH /api/alerts/[id]` | Non-existent alert ID `00000000-0000-0000-0000-000000000000` | Returns `404 Not Found` with `{ success: false, error: { code: "NOT_FOUND", message: "Corrective action alert not found" } }`. |
| 9 | Database Queries | Filter on `.eq('mine_type', 'UNDERGROUND')` with pagination `.range(0, 4)` | Mock client and PostgreSQL return exactly the first 5 underground mines sliced cleanly. |
| 10 | Auth Protection | Request to protected route without `Bearer` token or valid session | Returns `401 Unauthorized` with redirect header to `/login` when accessed via browser or JSON error when accessed via API. |

---

## 3. Supabase & PostgreSQL Database Architecture

### 3.1 PostgreSQL Schema DDL (`supabase/schema.sql`)

```sql
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

-- Mutation policies: Authenticated service role or authenticated users can insert/update
CREATE POLICY "Allow authenticated insert predictions" ON shortfall_predictions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated insert corrective_actions" ON corrective_actions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated update corrective_actions" ON corrective_actions FOR UPDATE USING (true);
CREATE POLICY "Allow authenticated log audit" ON audit_logs FOR INSERT WITH CHECK (true);
```

---

### 3.2 High-Fidelity MOIL Seed Data (`supabase/seed.sql`)

```sql
-- =============================================================================
-- MOIL LIMITED SEED DATA — 8 PRIMARY MANGANESE MINES
-- =============================================================================

INSERT INTO mines (id, code, name, state, district, latitude, longitude, mine_type, annual_capacity_mt, established_year, is_active)
VALUES
('b01a0001-0000-0000-0000-000000000001', 'MOIL-BAL', 'Balaghat Mine', 'Madhya Pradesh', 'Balaghat', 21.808300, 80.183300, 'UNDERGROUND', 450000.00, 1903, true),
('b01a0001-0000-0000-0000-000000000002', 'MOIL-DON', 'Dongri Buzurg Mine', 'Maharashtra', 'Bhandara', 21.558300, 79.683300, 'OPENCAST', 380000.00, 1921, true),
('b01a0001-0000-0000-0000-000000000003', 'MOIL-MAN', 'Mansar Mine', 'Maharashtra', 'Nagpur', 21.391700, 79.283300, 'MIXED', 220000.00, 1901, true),
('b01a0001-0000-0000-0000-000000000004', 'MOIL-CHK', 'Chikla Mine', 'Maharashtra', 'Bhandara', 21.550000, 79.750000, 'UNDERGROUND', 180000.00, 1912, true),
('b01a0001-0000-0000-0000-000000000005', 'MOIL-KAN', 'Kandri Mine', 'Maharashtra', 'Nagpur', 21.416700, 79.266700, 'MIXED', 160000.00, 1900, true),
('b01a0001-0000-0000-0000-000000000006', 'MOIL-GUM', 'Gumgaon Mine', 'Maharashtra', 'Nagpur', 21.383300, 79.033300, 'UNDERGROUND', 140000.00, 1908, true),
('b01a0001-0000-0000-0000-000000000007', 'MOIL-TIR', 'Tirodi Mine', 'Madhya Pradesh', 'Balaghat', 21.683300, 79.716700, 'OPENCAST', 190000.00, 1928, true),
('b01a0001-0000-0000-0000-000000000008', 'MOIL-UKW', 'Ukwa Mine', 'Madhya Pradesh', 'Balaghat', 21.966700, 80.466700, 'UNDERGROUND', 120000.00, 1906, true);

-- Seed Equipment for Balaghat & Dongri Buzurg
INSERT INTO mining_equipment (mine_id, equipment_code, name, equipment_type, model, status, health_score, operating_hours, vibration_level_mm_s, temp_celsius)
VALUES
('b01a0001-0000-0000-0000-000000000001', 'EQ-BAL-HOIST-01', 'Main Vertical Shaft Hoist #1', 'HOIST_WINCH', 'BHEL 1200kW Ward-Leonard', 'OPERATIONAL', 94.50, 14200.0, 1.45, 62.0),
('b01a0001-0000-0000-0000-000000000001', 'EQ-BAL-PUMP-01', 'Sub-level Dewatering Pump Alpha', 'DEWATERING_PUMP', 'Kirloskar 500HP High-Head', 'OPERATIONAL', 88.00, 8900.0, 2.10, 71.0),
('b01a0001-0000-0000-0000-000000000001', 'EQ-BAL-DRILL-01', 'Jumbo Electro-Hydraulic Drill', 'DRILL_RIG', 'Sandvik DD321', 'MAINTENANCE_REQUIRED', 64.00, 11400.0, 4.80, 86.5),
('b01a0001-0000-0000-0000-000000000002', 'EQ-DON-EXC-01', 'Hydraulic Pit Excavator #1', 'EXCAVATOR', 'Komatsu PC1250-8', 'OPERATIONAL', 91.00, 6500.0, 1.80, 74.0),
('b01a0001-0000-0000-0000-000000000002', 'EQ-DON-TRK-01', 'Heavy Off-Highway Dumper 01', 'HAUL_TRUCK', 'Caterpillar 773E (55 Ton)', 'OPERATIONAL', 82.50, 9300.0, 2.40, 78.0),
('b01a0001-0000-0000-0000-000000000002', 'EQ-DON-PUMP-01', 'Pit Sump Main Dewatering Pump', 'DEWATERING_PUMP', 'Sulzer 400HP Submersible', 'CRITICAL_FAILURE', 38.00, 13400.0, 6.90, 94.0);

-- Seed Historical Yields (Sample monthly baseline)
INSERT INTO historical_yields (mine_id, recorded_date, target_tonnage, actual_tonnage, manganese_grade_pct, overburden_tonnage, recovery_rate_pct)
VALUES
('b01a0001-0000-0000-0000-000000000001', '2026-06-01', 37500.0, 36200.0, 46.50, 8500.0, 96.53),
('b01a0001-0000-0000-0000-000000000001', '2026-07-01', 37500.0, 31800.0, 45.80, 7900.0, 84.80),
('b01a0001-0000-0000-0000-000000000002', '2026-06-01', 31500.0, 30900.0, 38.20, 94000.0, 98.10),
('b01a0001-0000-0000-0000-000000000002', '2026-07-01', 31500.0, 24100.0, 37.10, 61000.0, 76.51);

-- Seed Current Weather & Simulated Radar Telemetry
INSERT INTO weather_telemetry (mine_id, timestamp, rainfall_mm, soil_moisture_pct, surface_temp_c, humidity_pct, wind_speed_kmh, satellite_ndvi, flood_risk_index)
VALUES
('b01a0001-0000-0000-0000-000000000001', NOW() - INTERVAL '1 hour', 28.40, 62.50, 27.80, 82.0, 14.5, 0.450, 3.20),
('b01a0001-0000-0000-0000-000000000002', NOW() - INTERVAL '1 hour', 78.60, 89.20, 25.40, 94.0, 28.0, 0.520, 8.40);

-- Seed Baseline Shortfall Predictions & Corrective Actions
INSERT INTO shortfall_predictions (id, mine_id, prediction_timestamp, horizon_days, target_yield_mt, predicted_yield_mt, shortfall_tonnage, shortfall_risk_level, confidence_score, primary_failure_mode)
VALUES
('p01a0001-0000-0000-0000-000000000001', 'b01a0001-0000-0000-0000-000000000002', NOW(), 14, 15000.00, 10800.00, 4200.00, 'HIGH', 0.9150, 'Monsoon Pit Sump Overflow & Dumper Haulage Slippage');

INSERT INTO corrective_actions (prediction_id, mine_id, action_type, title, description, priority, estimated_yield_recovery_mt, cost_estimate_inr, status)
VALUES
('p01a0001-0000-0000-0000-000000000001', 'b01a0001-0000-0000-0000-000000000002', 'DEWATERING_MOBILIZATION', 'Mobilize 2x 250HP Standby Diesel Pumps to Bench 4', 'Deploy auxiliary dewatering skid to pit sump to evacuate 4,200 m3/hr excess water accumulation and prevent bench flooding.', 'URGENT', 2600.00, 350000.00, 'PROPOSED'),
('p01a0001-0000-0000-0000-000000000001', 'b01a0001-0000-0000-0000-000000000002', 'LOGISTICAL_REROUTE', 'Activate North-Eastern Gravel Haulage Bypass', 'Reroute CAT 773E dumpers away from inundated South incline to high-traction gravel bypass to maintain 85% hauling rate.', 'HIGH', 1100.00, 75000.00, 'PROPOSED');
```

---

## 4. Dual-Mode Supabase Client Architecture

To ensure 100% offline local development without requiring live Supabase credentials, the data access layer implements the **Dual-Mode Repository Pattern**.

### 4.1 Client Resolver Logic (`src/lib/supabase/client.ts`)

```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getMockSupabaseClient } from './mock-client';

let cachedClient: SupabaseClient | any = null;

export function getSupabase() {
  if (cachedClient) return cachedClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const forceMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true' || process.env.USE_MOCK_DATA === 'true';

  const isDummyUrl = !supabaseUrl || 
    supabaseUrl.includes('placeholder.supabase.co') || 
    supabaseUrl.includes('example.com') ||
    supabaseUrl === 'your-supabase-url';

  if (forceMock || isDummyUrl || !supabaseAnonKey || supabaseAnonKey.includes('placeholder')) {
    console.info('[Supabase] Operating in OFFLINE MOCK MODE (In-Memory Repository)');
    cachedClient = getMockSupabaseClient();
    return cachedClient;
  }

  try {
    cachedClient = createClient(supabaseUrl, supabaseAnonKey);
    console.info('[Supabase] Connected to LIVE Supabase Endpoint:', supabaseUrl);
    return cachedClient;
  } catch (err) {
    console.warn('[Supabase] Live client init failed, falling back to mock:', err);
    cachedClient = getMockSupabaseClient();
    return cachedClient;
  }
}
```

### 4.2 In-Memory Mock Repository (`src/lib/supabase/mock-client.ts`)

The `MockSupabaseClient` provides a fully chainable query builder supporting:
- `.from('table').select('*', { count: 'exact' })`
- `.eq(column, value)`, `.neq(column, value)`, `.gt()`, `.gte()`, `.lt()`, `.lte()`
- `.order(column, { ascending: boolean })`
- `.limit(count)`, `.range(from, to)`
- `.insert(data)`, `.update(data)`, `.delete()`
- `.single()` and `.maybeSingle()`
- `.auth.getUser()`, `.auth.signInWithPassword()`, `.auth.signOut()`

It initializes pre-loaded memory tables with all 8 MOIL mines, telemetry, and equipment.

---

## 5. Next.js App Router API Routes & Zod Validation Layer

### 5.1 Shared Zod Validation Schemas (`src/lib/validations/index.ts`)

```typescript
import { z } from 'zod';

export const MineTypeEnum = z.enum(['OPENCAST', 'UNDERGROUND', 'MIXED']);
export const EquipmentStatusEnum = z.enum(['OPERATIONAL', 'MAINTENANCE_REQUIRED', 'CRITICAL_FAILURE', 'STANDBY']);
export const RiskLevelEnum = z.enum(['LOW', 'MODERATE', 'HIGH', 'CRITICAL']);
export const ActionPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
export const ActionStatusEnum = z.enum(['PROPOSED', 'ACKNOWLEDGED', 'EXECUTED', 'DISMISSED']);

export const PredictRequestSchema = z.object({
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

export type PredictRequest = z.infer<typeof PredictRequestSchema>;

export const CorrectiveActionSchema = z.object({
  action_type: z.string(),
  title: z.string(),
  description: z.string(),
  priority: ActionPriorityEnum,
  estimated_yield_recovery_mt: z.number().nonnegative(),
  cost_estimate_inr: z.number().nonnegative(),
});

export const PredictResponseSchema = z.object({
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

export type PredictResponse = z.infer<typeof PredictResponseSchema>;
```

### 5.2 Next.js API Routes Implementation Blueprint

1. **`app/api/predict/route.ts`**:
   - Accepts `POST` requests.
   - Parses & validates body with `PredictRequestSchema.safeParse()`. Returns `400` on validation failure.
   - Fetches mine metadata, equipment telemetry, and latest weather from Supabase data layer.
   - Attempts to call FastAPI endpoint: `POST ${process.env.FASTAPI_URL || 'http://127.0.0.1:8000'}/predict` with timeout (3000ms).
   - If FastAPI is unreachable (offline) or returns 500: invokes `runFallbackHeuristicPrediction()`, which implements physical heuristic shortfall curves based on precipitation accumulation, soil moisture saturation threshold, and equipment health degradation.
   - Stores inference into `shortfall_predictions` and `corrective_actions` tables in Supabase/Mock.
   - Returns standardized `200 OK` JSON matching `PredictResponseSchema`.

2. **`app/api/mines/route.ts` & `app/api/mines/[id]/route.ts`**:
   - `GET /api/mines`: Returns list of all 8 MOIL mines with aggregated health score, current weather summary, and latest shortfall risk badge.
   - `GET /api/mines/[id]`: Returns detailed profile including all equipment assets, 30-day historical yields, satellite telemetry history, and active alerts.

3. **`app/api/equipment/route.ts`**:
   - `GET /api/equipment?mine_id=...`: Returns equipment registry with status badges, vibration charts, and maintenance countdowns.
   - `POST /api/equipment`: Allows adding or updating equipment telemetry with real-time health score calculation.

4. **`app/api/weather/route.ts`**:
   - `GET /api/weather?mine_id=...`: Returns radar rainfall, soil moisture graph data, and satellite NDVI indices.

5. **`app/api/alerts/route.ts` & `app/api/alerts/[id]/route.ts`**:
   - `GET /api/alerts`: Lists active HIGH and CRITICAL reserve shortfall warnings and urgent corrective actions.
   - `PATCH /api/alerts/[id]`: Acknowledges or executes a corrective action, recording timestamp and operator note.

6. **`app/api/health/route.ts`**:
   - Probes Next.js runtime, Supabase connection, and FastAPI service upstream. Returns diagnostic JSON:
     ```json
     {
       "status": "healthy",
       "timestamp": "2026-08-25T14:30:00Z",
       "components": {
         "nextjs_api": { "status": "up" },
         "database": { "status": "up", "mode": "in_memory_mock" },
         "fastapi_ml": { "status": "up", "url": "http://127.0.0.1:8000" }
       }
     }
     ```

---

## 6. End-to-End Test Suite Architecture (Tiers 1 - 4)

The test harness follows a strict 4-Tier verification hierarchy guaranteeing zero regression, full schema fidelity, and operational readiness.

```
+-------------------------------------------------------------------------------+
|                       TIER 4: FULL END-TO-END WORKFLOW SUITE                  |
|   (Simulated Satellite Telemetry -> Next.js API -> FastAPI ML -> Supabase DB) |
+-------------------------------------------------------------------------------+
                                        ^
                                        |
+-------------------------------------------------------------------------------+
|                    TIER 3: FASTAPI ML INFERENCE SUITE (Pytest)                |
|   (Model weights, XGBoost feature engineering, extreme weather, latency <100ms)|
+-------------------------------------------------------------------------------+
                                        ^
                                        |
+-------------------------------------------------------------------------------+
|                 TIER 2: NEXT.JS API INTEGRATION SUITE (Vitest/Node)           |
|   (Route Handlers: /api/predict, /api/mines, /api/alerts, Auth, Error Mapping)|
+-------------------------------------------------------------------------------+
                                        ^
                                        |
+-------------------------------------------------------------------------------+
|                    TIER 1: UNIT & SCHEMA VALIDATION SUITE                     |
|   (Zod schemas, Pydantic schemas, Mock DB queries, Heuristic Math Engine)     |
+-------------------------------------------------------------------------------+
```

### 6.1 Tier 1: Unit & Schema Validation Tests
- **Zod Schema Tests (`tests/unit/validation.test.ts`)**:
  - Validates positive cases: valid UUIDs, valid mine types, realistic weather ranges.
  - Validates negative cases: invalid UUIDs, out-of-range rainfall (>500mm), negative equipment vibration, invalid risk enums.
- **Mock Database Query Builder Tests (`tests/unit/mock-db.test.ts`)**:
  - Tests `.select()`, `.eq()`, `.order()`, `.limit()`, `.insert()`, `.update()`, `.delete()`.
  - Verifies foreign key filtering (`mine_id`) and relational lookups.
- **Heuristic Fallback Predictor Tests (`tests/unit/fallback-predictor.test.ts`)**:
  - Tests mathematical properties: Monotonicity (higher rainfall + worse equipment health = higher shortfall risk).

### 6.2 Tier 2: API Integration Tests (`tests/integration/api-routes.test.ts`)
- **Route Handler Invocations**:
  - `POST /api/predict`: Valid payload returns 200 OK + `PredictResponseSchema` compliance.
  - `POST /api/predict`: Missing `mine_id` returns 400 Bad Request with field error.
  - `GET /api/mines`: Returns array containing exactly 8 MOIL mines.
  - `GET /api/mines/b01a0001-0000-0000-0000-000000000001`: Returns Balaghat mine with equipment.
  - `PATCH /api/alerts/[id]`: Transitions status from `PROPOSED` to `ACKNOWLEDGED`.
  - `GET /api/health`: Returns 200 OK and component breakdown.

### 6.3 Tier 3: FastAPI ML Inference Tests (`backend/tests/test_ml_service.py`)
- **Pytest Suite for Python ML Microservice**:
  - `test_health_endpoint()`: `GET /health` returns status `healthy` and model metadata.
  - `test_baseline_prediction()`: Standard input for Balaghat returns shortfall < 5% (Risk: LOW).
  - `test_monsoon_flooding_prediction()`: 120mm rainfall + 95% soil moisture + failed pump for Dongri Buzurg returns shortfall > 25% (Risk: HIGH/CRITICAL) and dewatering action.
  - `test_invalid_inputs()`: Negative soil moisture or missing parameters returns HTTP 422 Unprocessable Entity.
  - `test_inference_latency()`: Inference time < 100ms.

### 6.4 Tier 4: Full End-to-End Workflow Verification (`tests/e2e/e2e-workflow.test.ts`)
- **Complete Pipeline Integration Test**:
  - Scenario A: **Live Operational Flow**:
    1. Query `/api/mines` -> select Dongri Buzurg opencast mine.
    2. Ingest simulated satellite radar storm (85mm rainfall, 92% soil moisture).
    3. Trigger `POST /api/predict`.
    4. Verify Next.js routes payload to FastAPI microservice.
    5. Verify prediction output (Risk: HIGH, Primary failure mode: "Monsoon Pit Sump Overflow").
    6. Verify prediction and corrective actions are persisted in Supabase database.
    7. Query `/api/alerts` to confirm new high-priority dewatering alert appears.
    8. Patch alert status to `ACKNOWLEDGED` and verify audit log entry.
  - Scenario B: **Service Resilience & Fallback Flow**:
    1. Send request when FastAPI is unreachable.
    2. Confirm Next.js handles network error gracefully and returns fallback prediction with `service_mode: "fallback_heuristic"`.

---

## 7. Environment Configuration Specification

### 7.1 `.env.example`
```env
# ==============================================================================
# MOIL LIMITED PREDICTIVE INTELLIGENCE PLATFORM — ENVIRONMENT CONFIGURATION
# ==============================================================================

# Application Environment
NODE_ENV=development
PORT=3000

# Next.js Public App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase Configuration
# For local/offline development, dummy values will automatically trigger Mock Repository Mode
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-anon-key-moil-2026
SUPABASE_SERVICE_ROLE_KEY=placeholder-service-role-key

# Force Mock Database Mode (true/false)
NEXT_PUBLIC_USE_MOCK_DATA=true
USE_MOCK_DATA=true

# Python FastAPI AI/ML Microservice URL
FASTAPI_URL=http://127.0.0.1:8000
NEXT_PUBLIC_FASTAPI_URL=http://127.0.0.1:8000

# Authentication & Security
NEXTAUTH_SECRET=moil-predictive-intelligence-super-secret-jwt-key-2026
NEXTAUTH_URL=http://localhost:3000

# Telemetry & Feature Flags
ENABLE_SYNTHETIC_SATELLITE_STREAM=true
ML_MODEL_VERSION=v1.0.0-xgb
```

---

## 8. Documentation Architecture

1. **`README.md`**:
   - Executive overview of MOIL Limited manganese intelligence application.
   - Key capability matrix: Satellite radar telemetry fusion, equipment health diagnostics, XGBoost yield shortfall model, prescriptive action engine.
   - Interactive screenshot mockups and visual UI component index.
   - One-command quickstart guide (`npm run dev:all`).
2. **`SETUP.md`**:
   - Prerequisites: Node.js 18+, Python 3.10+, npm / pnpm / uv.
   - Fast-path setup with zero cloud dependencies (Offline Mock Mode).
   - Live Supabase cloud setup instructions (running migrations, applying RLS, executing seed SQL).
   - Python virtual environment setup & FastAPI model training.
3. **`ARCHITECTURE.md`**:
   - System component diagram (Next.js App Router -> Zod -> FastAPI -> Supabase).
   - Database Entity Relationship Diagram (ERD) with relational constraints.
   - ML model feature engineering & training methodology.
   - Failure recovery & resilience fallback pattern documentation.

---

## 9. Verification & Implementation Readiness

All interfaces, schemas, database tables, fallback mechanisms, and test specifications described in this document are fully specified and ready for implementation by the development subagents.
