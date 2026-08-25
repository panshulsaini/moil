# E2E Test Infra: MOIL Limited Predictive Intelligence Platform

## Test Philosophy
- Requirement-driven, opaque-box and grey-box verification.
- Enforces strict input validation, resilient fallback mechanisms, and seamless cross-service telemetry flow.
- Methodology: Category-Partition + Boundary Value Analysis (BVA) + Pairwise Combinatorial + Real-World Operational Workloads.

## Feature Inventory Mapping
| # | Feature | Source | Tier 1 (Unit) | Tier 2 (API) | Tier 3 (ML) | Tier 4 (E2E) |
|---|---------|--------|:-------------:|:------------:|:-----------:|:------------:|
| 1 | Python FastAPI ML Inference Engine | ORIGINAL_REQUEST §R3 | 5 | 5 | 5 | ✓ |
| 2 | Telemetry Interaction Features | ORIGINAL_REQUEST §R3 | 5 | 5 | 5 | ✓ |
| 3 | Prescriptive Corrective Actions | ORIGINAL_REQUEST §R3 | 5 | 5 | 5 | ✓ |
| 4 | Synthetic Telemetry Streamer | ORIGINAL_REQUEST §R3 | 5 | 5 | 5 | ✓ |
| 5 | Supabase Schema & Mock Fallback | ORIGINAL_REQUEST §R2 | 5 | 5 | - | ✓ |
| 6 | Next.js API Routes & Zod Validation | ORIGINAL_REQUEST §R2, §R4 | 5 | 5 | - | ✓ |
| 7 | Executive Operations Center UI | ORIGINAL_REQUEST §R1 | 5 | 5 | - | ✓ |
| 8 | Telemetry Fusion Visualizer UI | ORIGINAL_REQUEST §R1 | 5 | 5 | - | ✓ |
| 9 | Real-Time Simulation Sandbox UI | ORIGINAL_REQUEST §R1 | 5 | 5 | - | ✓ |
| 10| GIS Mining Map Visualizer UI | ORIGINAL_REQUEST §R1 | 5 | 5 | - | ✓ |
| 11| Corrective Action Planner UI | ORIGINAL_REQUEST §R1 | 5 | 5 | - | ✓ |

## Test Architecture
- **Tier 1 - Unit & Schema Validation**:
  - Python Pydantic v2 schemas: boundary checks, negative numbers, missing fields, type coercion.
  - TypeScript Zod schemas: valid payloads, invalid types, empty strings, boundary ranges.
  - Mathematical calculation units: heuristic shortfall predictor, interaction index formulas.
- **Tier 2 - Route Handlers & Mock DB Integration**:
  - Next.js `/api/health`, `/api/mines`, `/api/equipment`, `/api/alerts`, `/api/predict`.
  - In-memory mock database client CRUD methods (`select`, `eq`, `order`, `limit`, `insert`).
  - Expected HTTP status codes (200 OK on valid inputs, 400 Bad Request on invalid inputs).
- **Tier 3 - Python ML Service & Pytest Suite**:
  - Pytest test execution (`pytest backend/tests/ -v`).
  - Model fitting, prediction bounds ($0.0 \le probability \le 1.0$), confidence score ranges, latency $<100$ms.
  - Anomaly handling: cloudburst conditions, complete pump failure, zero planned tonnage edge cases.
- **Tier 4 - Cross-Service E2E Workflows**:
  - End-to-end integration test runner:
    1. Ingest simulated satellite telemetry.
    2. Post to Next.js `/api/predict`.
    3. Proxy to FastAPI `/api/v1/predict/shortfall`.
    4. Validate ML model prediction response.
    5. Save shortfall prediction and corrective actions to Supabase repository.
    6. Verify dashboard query returns newly generated prediction & alert.

## Coverage Goals
- Minimum 25 unit/schema tests.
- Minimum 15 API integration tests.
- Minimum 15 Python ML tests.
- Minimum 5 multi-step E2E workflow tests.
