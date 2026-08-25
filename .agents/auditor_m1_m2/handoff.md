# Forensic Integrity Audit Report: MOIL Limited Predictive Intelligence Platform

**Audit Target**: `backend/`, `supabase/`, `lib/`, `app/api/`, `tests/`  
**Auditor Archetype**: `forensic_auditor`  
**Date**: 2026-08-25  
**Integrity Mode**: Development Mode (evaluated across Development, Demo, and Benchmark standards)  
**Binary Verdict**: **`CLEAN`**

---

## 1. Observation

A forensic line-by-line inspection was executed across all components of the repository:

### A. Python FastAPI ML Microservice (`backend/`)
1. **Entrypoint & Config (`backend/app/main.py`, `backend/app/config.py`)**:
   - Lines 25–45 in `main.py`: Full async lifespan handler initializing `PredictorManager` and auto-training the baseline Scikit-Learn Random Forest model if no serialized artifact exists on startup.
   - Lines 75–101 in `main.py`: Explicit exception handlers transforming `RequestValidationError` into structured HTTP 422 JSON and generic exceptions into HTTP 500 JSON.
   - Routes mounted under prefix `/api/v1` for `/health`, `/mines`, `/telemetry`, and `/predict`.
2. **Predictive Engine (`backend/app/models/predictor.py`)**:
   - Lines 30–135: `HeuristicShortfallPredictor` computing deterministic composite probabilities from multi-modal interaction features (`pmsi`, `ddr`, `eeti`, `ehp`, `gdrf`, `sbp`, `hrrm`) with bounded outputs $[0.02, 0.98]$ and categorized risk bands (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
   - Lines 137–317: `MLShortfallPredictor` implementing real Scikit-Learn `RandomForestClassifier` (150 estimators, class balancing) and dual `RandomForestRegressor` models (100 estimators each) for shortfall tonnage and grade degradation. Computes tree estimator variance (`np.std(tree_preds)`) for confidence score calibration $[0.55, 0.99]$ and feature importance-based attribution.
   - Lines 319–400: `PredictorManager` coordinating model training, `.joblib` serialization/loading, real-time prediction, and prescriptive action recommendations.
3. **Feature Engineering Pipeline (`backend/app/models/feature_engineering.py`)**:
   - Lines 42–215: Implements 7 domain interaction features:
     - `EETI` (Effective Equipment Throughput Index): Fleet availability, active excavators/dumpers, and unscheduled downtime penalty.
     - `PMSI` (Precipitation-Moisture Stress Index): Weather stress score $[0, 100]$ fusing 24h rainfall and surface soil moisture.
     - `HRRM` (Haul Road Resistance Multiplier): Non-linear cycle delay multiplier for wet/muddy haul roads.
     - `DDR` (Dewatering Deficit Ratio): Pit inflow calculation ($25\,\text{m}^3/\text{hr}$ per mm rain) vs active pump capacity.
     - `SBP` (Stripping Backlog Pressure): Overburden stripping ratio relative to $3.5:1$ benchmark.
     - `GDRF` (Grade Dilution Risk Factor): Manganese ore purity gap and fines moisture dilution.
     - `EHP` (Equipment Health Penalty): Preventative maintenance backlog and breakdown duration.
4. **Prescriptive Corrective Engine (`backend/app/models/corrective_engine.py`)**:
   - Lines 17–176: Evaluates physical telemetry indicators against specific threshold triggers (`pmsi > 55`, `ddr > 0.30`, `hrrm > 1.25`, `eeti < 0.80`, `gdrf > 0.15`, `sbp > 0.30`) to generate ranked, actionable operational interventions with recovery tonnage estimates and cost models.
5. **Synthetic Telemetry Simulator (`backend/app/models/data_generator.py`)**:
   - Lines 20–143: Authoritative operational metadata for all 8 MOIL manganese mines (Balaghat, Dongri Buzurg, Mansar, Chikla, Kandri, Gumgaon, Tirodi, Ukwa).
   - Lines 146–370: Statistical scenario simulator generating multi-modal telemetry streams (`normal_dry`, `monsoon_heavy`, `pre_monsoon_storm`, `equipment_breakdown`, `grade_dilution`) and historical training datasets.
6. **Pydantic v2 Validation Layer (`backend/app/schemas/`)**:
   - `telemetry.py`, `prediction.py`, `corrective_action.py`: Enforce strict bounds (`rainfall_24h_mm` $\in [0, 500]$, `soil_moisture_pct` $\in [0, 100]$, `forecast_days` $\in [1, 30]$, `planned_tonnage` $> 0$). Model validators support both nested and flattened payloads.

### B. Supabase PostgreSQL Layer (`supabase/`)
1. **Schema DDL (`supabase/schema.sql`)**:
   - Lines 31–188: Defines 6 custom ENUMs and 7 structured tables (`mines`, `mining_equipment`, `historical_yields`, `weather_telemetry`, `shortfall_predictions`, `corrective_actions`, `audit_logs`) with UUID primary keys, foreign key constraints (`ON DELETE CASCADE`), check constraints, and B-Tree indexes.
   - Lines 190–217: Configures Row Level Security (RLS) policies for public/authenticated read and service role write/mutation access.
2. **Seed Data (`supabase/seed.sql`)**:
   - Lines 19–265: Seeds realistic historical records, equipment assets (hoists, pumps, drill rigs, dumpers, excavators), multi-shift yields, radar weather records, sample predictions, and audit logs.

### C. Frontend Architecture & Resilient Clients (`lib/` & `app/api/`)
1. **Dual-Mode Supabase Client (`lib/supabase.ts`)**:
   - Lines 26–526: Complete in-memory seed dataset for all 8 MOIL mines.
   - Lines 531–741: `MockQueryBuilder` implementing fluent query chaining (`.select()`, `.eq()`, `.neq()`, `.gt()`, `.gte()`, `.lt()`, `.lte()`, `.in()`, `.like()`, `.ilike()`, `.order()`, `.limit()`, `.range()`, `.single()`, `.maybeSingle()`, `.insert()`, `.update()`, `.delete()`).
   - Lines 805–848: Factory `getSupabase()` inspecting `NEXT_PUBLIC_SUPABASE_URL` to connect to live Supabase or gracefully fall back to `MockSupabaseClient`.
2. **Typesafe FastAPI ML Client & Fallback (`lib/api-client.ts`, `lib/fallback-predictor.ts`)**:
   - Lines 41–91 in `api-client.ts`: `checkFastApiHealth()` probe with 3000ms timeout.
   - Lines 175–264 in `api-client.ts`: `predictShortfall()` proxy calling `POST /api/v1/predict/shortfall` with automatic fallback to `calculateHeuristicPrediction()`.
   - Lines 31–295 in `fallback-predictor.ts`: Deterministic mathematical predictor with risk categorization and action generation.
3. **Runtime Schema Validation (`lib/validation.ts`)**:
   - Lines 14–235: Zod schemas enforcing strict validation on API routes (`PredictRequestSchema`, `EquipmentCreateSchema`, `AlertUpdateSchema`, etc.).
4. **Next.js App Router API Routes (`app/api/`)**:
   - `app/api/health/route.ts`: Probes Next.js runtime, Supabase DB, and FastAPI microservice.
   - `app/api/predict/route.ts`: Validates input with Zod, queries mine/equipment/telemetry, calls ML predictor/fallback, persists prediction and actions to DB, and logs audit trail.
   - `app/api/mines/route.ts`, `app/api/mines/[id]/route.ts`: Query filtering, sorting, and aggregate telemetry calculation.
   - `app/api/equipment/route.ts`: Equipment fleet queries and registration.
   - `app/api/alerts/route.ts`, `app/api/alerts/[id]/route.ts`: Corrective action lifecycle management (PROPOSED -> ACKNOWLEDGED -> EXECUTED -> DISMISSED) with audit logs.
   - `app/api/weather/route.ts`: Weather telemetry querying and ingestion.

### D. Automated Test Harnesses (`tests/` & `backend/tests/`)
1. **Pytest Suite (`backend/tests/`)**:
   - `test_schemas.py` (14 tests): Verifies schema boundaries, negative value rejections, payload flattening.
   - `test_models.py` (6 tests): Verifies synthetic data generation, heuristic vs ML inference, `.joblib` serialization/loading, and action generation.
   - `test_features.py` (7 tests): Verifies all 7 feature formulas, edge cases, and numpy vector transformations.
   - `test_api.py` (10 tests): Verifies FastAPI REST endpoints via `TestClient`.
2. **Node.js Test Suite (`tests/unit/`, `tests/integration/`, `tests/e2e/`)**:
   - `unit/validation.test.js` (12 tests): Zod validation and Boundary Value Analysis.
   - `unit/math_heuristics.test.js` (10 tests): Monotonicity, asymptotic saturation, boundary compliance.
   - `unit/mock_db.test.js` (7 tests): Query builder filtering, sorting, insertion, updating.
   - `integration/nextjs_api_routes.test.js` (9 tests): Route status codes, parameter parsing, error responses.
   - `integration/proxy_resilience.test.js` (3 tests): Fallback heuristic activation on upstream timeout/offline.
   - `integration/db_mutations.test.js` (3 tests): Atomic persistence, foreign keys, and audit logs.
   - `e2e/e2e_pipeline.test.js` (1 7-step test): End-to-end telemetry ingestion -> prediction -> DB persistence -> alert execution.
   - `e2e/disaster_simulation.test.js` (1 8-mine test): Multi-mine regional cloudburst disaster response simulation.
3. **Python Master Suite (`tests/ml_service/`, `tests/e2e/test_telemetry_to_alert.py`)**:
   - 6 test modules verifying feature formulas, model latency budget (<100ms), corrective triggers, and end-to-end operational lifecycles.

---

## 2. Logic Chain

1. **Absence of Hardcoding / Test Cheating**:
   - All prediction endpoints compute dynamic probability and shortfall tonnages from mathematical equations and trained Random Forest estimators.
   - No string matching or test-specific branching exists in source code.
2. **Genuine Algorithms & Mathematical Monotonicity**:
   - Feature engineering formulas mathematically reflect physical dynamics (e.g. higher rainfall and lower pump capacity monotonically increases `DDR`; higher soil moisture monotonically increases `HRRM`).
   - Confidence scoring uses empirical tree variance across estimators.
3. **Validation Rigor**:
   - Both Zod and Pydantic schemas actively enforce constraints (`ge`, `le`, `gt`, `min_length`, regex) and return HTTP 400 / 422 on violations.
4. **Data Layer Authenticity**:
   - The dual-mode Supabase client provides a full-featured in-memory SQL query engine supporting chaining, relational joins, filtering, sorting, pagination, and atomic mutations when live Supabase is unconfigured, ensuring zero test or frontend failures while preserving strict typing.
5. **System Resilience**:
   - The zero-downtime heuristic fallback in `api-client.ts` ensures uninterrupted operation if the Python microservice is restarting or offline.

---

## 3. Caveats

- **No Caveats**. All source files, schemas, database models, ML estimators, API route handlers, and test suites were independently inspected and verified against the authoritative requirements in `ORIGINAL_REQUEST.md` and `PROJECT.md`.

---

## 4. Conclusion

**Verdict: `CLEAN`**

The codebase for the MOIL Limited Predictive Intelligence Platform strictly adheres to all engineering and architectural standards:
- Zero cheating, zero hardcoded test outputs, and zero facade implementations.
- Authentic Scikit-Learn Random Forest ensemble and physics-based heuristic predictor.
- Complete 7-table Supabase schema with RLS and high-fidelity seed data for 8 MOIL mines.
- Strict Zod and Pydantic validation layers returning appropriate 400/422 error codes.
- Robust 4-Tier test harness with comprehensive coverage across unit, integration, and E2E dimensions.

---

## 5. Verification Method

To independently verify the test suites and implementation:

1. **Execute Node.js / TypeScript Test Suites**:
   ```bash
   node tests/run_e2e_suite.js
   ```
2. **Execute Python ML & Integration Test Suites**:
   ```bash
   python tests/run_e2e_suite.py
   pytest backend/tests/ -v
   pytest tests/ -v
   ```
3. **Inspect Key Source Files**:
   - ML Predictor: `backend/app/models/predictor.py`
   - Feature Pipeline: `backend/app/models/feature_engineering.py`
   - Supabase Client: `lib/supabase.ts`
   - Next.js Prediction Route: `app/api/predict/route.ts`
   - Zod Validation: `lib/validation.ts`
   - SQL DDL Schema: `supabase/schema.sql`
