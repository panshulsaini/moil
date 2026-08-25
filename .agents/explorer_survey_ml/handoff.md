# Handoff Report — AI/ML Inference Service Survey (R3)

**Agent**: `explorer_survey_ml`  
**Working Directory**: `C:\Users\Panshul Saini\.gemini\antigravity\scratch\moil_project\.agents\explorer_survey_ml`  
**Target Milestone**: R3: AI/ML Inference Service Architecture & Implementation Plan  
**Recipient**: `orchestrator_1` (Conv ID: `e227b513-ae34-46fc-9370-9b4deb4f3e5a`)  
**Date**: 2026-08-25  

---

## 1. Observation

1. **Authoritative Project Requirements (`ORIGINAL_REQUEST.md`)**:
   - Lines 9-10: *"Mission: Build a predictive intelligence web application for MOIL Limited that fuses simulated satellite telemetry (rainfall, soil moisture) with equipment/geological data to predict manganese reserve shortfalls and suggest corrective actions."*
   - Line 15: *"R3. AI/ML Inference Service: Python FastAPI microservice with shortfall prediction endpoint, baseline ML model (e.g. XGBoost / Logistic Regression / Random Forest), prediction, confidence score, and simulated corrective actions."*
   - Line 16: *"R4. Production-Ready Code Quality: Zod/Pydantic validation & sanitization, graceful error handling, basic unit tests, clear documentation (README.md, SETUP.md, ARCHITECTURE.md)."*
   - Lines 19-20: *"Acceptance Criteria: A suite of automated tests successfully runs and verifies the end-to-end flow from Next.js API route to FastAPI ML endpoint and Supabase database. FastAPI server starts successfully and returns 200 OK with prediction JSON payload on valid mock input."*

2. **Orchestrator Strategic Context (`.agents/orchestrator_1/BRIEFING.md`)**:
   - Lines 44-45: *"Multi-tier system architecture: Next.js frontend (App Router + Tailwind + shadcn/ui + Recharts + Leaflet/Mock Maps) + FastAPI Python backend (XGBoost/scikit-learn predictive model + synthetic data generation + telemetry fusion) + Supabase database client/mock fallback & schema + automated E2E testing suite."*

3. **Workspace State**:
   - Directory `C:\Users\Panshul Saini\.gemini\antigravity\scratch\moil_project` contains initial orchestrator metadata in `.agents`. Production code for the backend microservice will reside cleanly under `backend/`.

---

## 2. Logic Chain

1. **Requirement Mapping (Obs 1, 2) $\rightarrow$ Microservice Framework**:
   - R3 requires Python FastAPI with Pydantic validation, multi-modal fusion, and prediction endpoints.
   - FastAPI provides native ASGI performance, OpenAPI schema generation, and direct async integration for Next.js and Supabase upstream callers.

2. **Domain-Specific Mining Fusion (Obs 1) $\rightarrow$ Multi-Modal Feature Architecture**:
   - MOIL open-cast & underground mining dynamics require correlating hydro-meteorological stressors (satellite rainfall, soil saturation) with HEMM equipment telematics (availability %, dumper cycle time, unscheduled downtime, pump capacity) and geological reserve properties (Mn grade %, planned tonnage, stripping ratio).
   - We formulated 7 interaction features ($EETI, PMSI, HRRM, DDR, SBP, GDRF, EHP$) to capture real-world mining mechanics (e.g., rainfall saturation slowing dumpers, submerging sumps, and diluting ore purity).

3. **Reliability & Zero-Cold-Start SLA (Obs 1, 2) $\rightarrow$ Dual Predictive Engine**:
   - If the microservice boots up without a pre-computed `.joblib` model artifact or during training, relying solely on ML would cause 500 errors.
   - We designed a dual-mode engine: `RandomForestClassifier` & `RandomForestRegressor` for machine learning inference, paired with a deterministic `HeuristicShortfallPredictor` for zero-cold-start fallback and baseline verification.

4. **Prescriptive Operations (Obs 1) $\rightarrow$ Rule-Based Corrective Actions**:
   - Operational engineers need concrete interventions, not just probabilities.
   - We mapped feature anomalies to actionable mitigation protocols (auxiliary dewatering pump deployment, haulage re-routing, HEMM reassignment, Grade-A ore stockpile blending).

5. **Testability & Production Readiness (Obs 1) $\rightarrow$ Comprehensive Pytest Suite**:
   - Automated verification requires unit and integration tests across schemas, ML transformations, fallback heuristics, and FastAPI route responses.

---

## 3. Caveats

1. **Synthetic Telemetry vs Real Satellite APIs**: In production, satellite feeds originate from ESA Sentinel-1 (SAR soil moisture) or IMD weather radar APIs. For this application, a high-fidelity synthetic telemetry simulator (`SyntheticMineDataGenerator`) models identical statistical distributions and correlations.
2. **Scikit-Learn vs XGBoost Windows Compatibility**: To prevent native C++ compiler dependency issues on Windows during automated test execution, the primary implementation uses `scikit-learn` (`RandomForestClassifier`, `GradientBoostingRegressor`), with optional `xgboost` integration if available in the runtime.
3. **No Production Source Code Written by Explorer**: As an Explorer agent, all designs, schemas, formulas, and test plans have been documented in `.agents/explorer_survey_ml/analysis.md` without modifying project root source code.

---

## 4. Conclusion

The technical design for **R3: AI/ML Inference Service** is fully specified and ready for immediate implementation by the Worker agent.

### Key Deliverables in `analysis.md`:
- **FastAPI Microservice Specification**: Clean directory structure (`backend/app/...`, `backend/tests/...`) and complete REST API definitions (`/api/v1/predict/shortfall`, `/api/v1/predict/batch`, `/api/v1/telemetry/simulated`, `/api/v1/train`, `/api/v1/health`, `/api/v1/mines`).
- **Pydantic v2 Schemas**: Complete data contracts with field boundary constraints, type validators, and structured error responses.
- **ML & Heuristic Algorithms**: Mathematical formulas for 7 engineered interaction features, Random Forest ensemble architecture, confidence score calculation, and zero-cold-start heuristic fallback.
- **Actionable Mitigation Engine**: Structured operational corrective actions mapped across 5 mining categories.
- **Testing & Verification Suite**: Complete Pytest test suite plan with command-line execution instructions.

---

## 5. Verification Method

To independently verify this design during implementation:

1. **Inspect Analysis Report**:
   - View `C:\Users\Panshul Saini\.gemini\antigravity\scratch\moil_project\.agents\explorer_survey_ml\analysis.md` to confirm all schemas, formulas, endpoints, and architectural patterns.

2. **Worker Implementation Verification**:
   - When the Worker agent generates `backend/`, verify the following execution commands:
   ```bash
   # Install dependencies
   pip install -r backend/requirements.txt

   # Run test suite
   pytest backend/tests/ -v

   # Start FastAPI server
   uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000
   ```

3. **Endpoint Validation Checks**:
   - `GET http://localhost:8000/api/v1/health` $\rightarrow$ Expect `{"status": "healthy", "service": "moil-predictive-inference"}`.
   - `POST http://localhost:8000/api/v1/predict/shortfall` with valid mock JSON $\rightarrow$ Expect HTTP 200 with `shortfall_probability`, `risk_level`, `confidence_score`, `expected_shortfall_tonnes`, and `corrective_actions`.
   - `POST http://localhost:8000/api/v1/predict/shortfall` with negative rainfall or out-of-range moisture $\rightarrow$ Expect HTTP 422 validation error.
