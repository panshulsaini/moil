# MOIL Limited — Technical Architecture & Mathematical Specification

**Document Version**: 1.0.0  
**Target Enterprise**: MOIL Limited (Manganese Ore India Limited)  
**System Classification**: Mission-Critical Mining Operations & Predictive Risk Intelligence Platform

---

## 1. System Overview & Component Topology

The **MOIL Predictive Intelligence Platform** is architected as a decoupled, multi-runtime enterprise system designed for high availability, zero cold-start latency, and rigorous mathematical fidelity.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     PRESENTATION LAYER (Next.js 14)                              │
│ ┌─────────────────────────┐ ┌──────────────────────────┐ ┌─────────────────────────────────────┐ │
│ │ Operations Center (/)   │ │ Telemetry Fusion (/telemetry)│ Shortfall Sandbox (/predictor)   │ │
│ ├─────────────────────────┤ ├──────────────────────────┤ ├─────────────────────────────────────┤ │
│ │ GIS Mining Map (/map)   │ │ Action Planner (/planner)│ │ Recharts & Lucide UI Components    │ │
│ └─────────────────────────┘ └──────────────────────────┘ └─────────────────────────────────────┘ │
└────────────────────────────────────────────────┬─────────────────────────────────────────────────┘
                                                 │ HTTPS / Client-side Data Fetching
                                                 ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                               NEXT.JS APP ROUTER API BACKEND LAYER                               │
│ ┌──────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ Route Handlers: /api/predict, /api/mines, /api/equipment, /api/alerts, /api/health           │ │
│ ├──────────────────────────────────────────────────────────────────────────────────────────────┤ │
│ │ Zod Runtime Schema Validation & Input Sanitization Layer (Boundary Value Analysis)           │ │
│ ├──────────────────────────────────────────────────────────────────────────────────────────────┤ │
│ │ FastAPI Upstream Reverse Proxy (3000ms Timeout + AbortController + Graceful Fallback)       │ │
│ ├──────────────────────────────────────────────────────────────────────────────────────────────┤ │
│ │ Deterministic Heuristic Fallback Predictor (Zero-Cold-Start In-Memory Engine)                │ │
│ └───────────────────────────────────────┬──────────────────────────────┬───────────────────────┘ │
└─────────────────────────────────────────┼──────────────────────────────┼─────────────────────────┘
                                          │                              │
                    Live / Mock Query API │                              │ HTTP JSON Payload
                                          ▼                              ▼
┌────────────────────────────────────────────────────┐ ┌───────────────────────────────────────────┐
│              SUPABASE DATA PERSISTENCE             │ │       FASTAPI PYTHON ML MICROSERVICE      │
│ ┌────────────────────────────────────────────────┐ │ │ ┌───────────────────────────────────────┐ │
│ │ PostgreSQL 15+ Relational Database             │ │ │ │ Telemetry Feature Engineering Pipeline │ │
│ │ (7 Tables, Indexes, UUIDs, Constraints, RLS)   │ │ │ │ - 7 Interaction Features ($EETI, PMSI) │ │
│ ├────────────────────────────────────────────────┤ │ │ ├───────────────────────────────────────┤ │
│ │ In-Memory Mock Repository & Query Builder      │ │ │ │ Random Forest Ensemble Model           │ │
│ │ (Pre-seeded with 8 MOIL mine complexes)        │ │ │ │ - Classifier (150 trees)               │ │
│ ├────────────────────────────────────────────────┤ │ │ │ - Dual Regressors (Tonnage & Grade)    │ │
│ │ Transactional Audit Logging Engine             │ │ │ ├───────────────────────────────────────┤ │
│ └────────────────────────────────────────────────┘ │ │ │ Prescriptive Corrective Engine        │ │
│                                                    │ │ ├───────────────────────────────────────┤ │
│                                                    │ │ │ Pydantic v2 Contract Validation       │ │
│                                                    │ │ └───────────────────────────────────────┘ │
└────────────────────────────────────────────────────┘ └───────────────────────────────────────────┘
```

---

## 2. Multi-Modal Feature Engineering & Mathematical Formulation

Raw telemetry from satellite sensors, pit instrumentation, machinery telematics, and geological block models is transformed into **7 domain interaction features** that model compounding operational risks.

```
       Satellite Precipitation & Soil Moisture           Equipment Telematics & Fleet Logs
                          │                                               │
                          ▼                                               ▼
              ┌───────────────────────┐                       ┌───────────────────────┐
              │   PMSI, DDR & HRRM    │                       │     EETI & EHP        │
              └───────────┬───────────┘                       └───────────┬───────────┘
                          │                                               │
                          └───────────────────────┬───────────────────────┘
                                                  │
                                                  ▼
                                      ┌───────────────────────┐
                                      │ SBP & GDRF (Geology)  │
                                      └───────────┬───────────┘
                                                  │
                                                  ▼
                                    ┌───────────────────────────┐
                                    │ 21-Dimensional ML Vector  │
                                    └───────────────────────────┘
```

---

### Formula 1: Effective Equipment Throughput Index ($EETI$)
Quantifies true mechanical extraction capacity by weighting excavators and dumpers, adjusted for overall fleet availability and penalized by unscheduled breakdown hours.

$$\text{Equipment Score} = \frac{N_{\text{excavators}} \times 120.0 + N_{\text{dumpers}} \times 35.0}{155.0}$$

$$\text{Downtime Factor} = 1.0 - \min\left(0.5, \frac{T_{\text{downtime}}}{24.0}\right)$$

$$EETI = \left(\frac{A_{\text{fleet}}}{100.0}\right) \times \text{Equipment Score} \times \text{Downtime Factor}$$

- $N_{\text{excavators}}$: Active hydraulic excavators ($120\text{ MT/hr}$ nominal capacity).
- $N_{\text{dumpers}}$: Active off-highway haul dumpers ($35\text{ MT/hr}$ cycle capacity).
- $A_{\text{fleet}}$: Fleet availability percentage ($0 - 100\%$).
- $T_{\text{downtime}}$: Unscheduled equipment downtime hours in past 24 hours.

---

### Formula 2: Precipitation-Moisture Stress Index ($PMSI$)
A composite index ($0 - 100$) evaluating immediate precipitation surge against accumulated soil saturation.

$$PMSI = \min\left(100.0, \max\left(0.0, \left(\frac{R_{24h}}{50.0}\right) \times 40.0 + \left(\frac{M_{\text{soil}}}{100.0}\right) \times 60.0\right)\right)$$

- $R_{24h}$: 24-hour cumulative rainfall ($\text{mm}$).
- $M_{\text{soil}}$: Sentinel-1 radar soil moisture percentage ($0 - 100\%$).

---

### Formula 3: Haul Road Resistance Multiplier ($HRRM$)
Models the exponential rolling resistance and traction slip on wet, unpaved pit haul roads. Baseline is $1.0$ (dry gravel).

$$\text{Moisture Penalty} = \max\left(0.0, \frac{M_{\text{soil}} - 50.0}{50.0} \times 0.75\right)$$

$$\text{Cycle Delay Penalty} = \max\left(0.0, \frac{C_{\text{dumper}} - 15.0}{15.0} \times 0.25\right)$$

$$HRRM = 1.0 + \text{Moisture Penalty} + \text{Cycle Delay Penalty}$$

- $C_{\text{dumper}}$: Measured dumper cycle turnaround time (minutes).

---

### Formula 4: Dewatering Deficit Ratio ($DDR$)
Measures the unhandled water inflow accumulating in the pit sump relative to total active pumping evacuation capacity.

$$Q_{\text{inflow}} = R_{24h} \times 25.0 \quad (\text{m}^3/\text{hr})$$

$$DDR = \max\left(0.0, \min\left(1.0, \frac{Q_{\text{inflow}} - C_{\text{pumps}}}{\max(1.0, Q_{\text{inflow}})}\right)\right)$$

- $C_{\text{pumps}}$: Aggregate operational dewatering pump capacity ($\text{m}^3/\text{hr}$).
- $DDR = 0.0$: Pumping capacity fully handles runoff.
- $DDR = 1.0$: Severe flooding; pumps overwhelmed.

---

### Formula 5: Stripping Backlog Pressure ($SBP$)
Evaluates the overburden removal backlog relative to the statutory benchmark stripping ratio ($3.5:1$ for MOIL opencast pits).

$$SBP = \max\left(0.0, \frac{\text{SR}_{\text{actual}} - 3.5}{3.5}\right)$$

- $\text{SR}_{\text{actual}}$: Current volumetric stripping ratio ($\text{m}^3\text{ overburden}/\text{tonne ore}$).

---

### Formula 6: Grade Dilution Risk Factor ($GDRF$)
Quantifies the risk of mined manganese grade falling below market specification due to face slumping and excessive ore moisture.

$$\Delta_{\text{grade}} = \max\left(0.0, \frac{G_{\text{target}} - G_{\text{block}}}{\max(1.0, G_{\text{target}})}\right)$$

$$\text{Moisture Dilution} = \left(\frac{M_{\text{ore}}}{30.0}\right) \times 0.15$$

$$GDRF = \Delta_{\text{grade}} + \text{Moisture Dilution}$$

- $G_{\text{target}}$: Target dispatch manganese content ($\% \text{Mn}$).
- $G_{\text{block}}$: Geological block model estimated grade ($\% \text{Mn}$).
- $M_{\text{ore}}$: Surface ore moisture percentage ($0 - 30\%$).

---

### Formula 7: Equipment Health Penalty ($EHP$)
Aggregates machinery maintenance backlog and historical unscheduled downtime into a normalized risk penalty ($0.0 - 1.0$).

$$EHP = \min\left(1.0, \max\left(0.0, \left(\frac{S_{\text{backlog}}}{10.0}\right) \times 0.5 + \min\left(0.5, \frac{T_{\text{downtime}}}{12.0} \times 0.5\right)\right)\right)$$

- $S_{\text{backlog}}$: Maintenance backlog score ($0 - 10$, where $10$ represents overdue preventive overhauls).

---

## 3. Machine Learning Architecture & Fallback Engine

```
                             Raw Telemetry Request
                                       │
                                       ▼
                       Feature Engineering Pipeline (21 Feats)
                                       │
                                       ├──────────────────────────────┐
                                       │                              │
                     [If Model Trained on Disk]          [If Cold-Start / Offline]
                                       │                              │
                                       ▼                              ▼
                         Random Forest Ensemble         Deterministic Heuristic Engine
                      ┌──────────────────────────┐      ┌─────────────────────────────┐
                      │ - Classifier (150 trees) │      │ - Domain Rule Scoring       │
                      │ - Regressors (Tonnage)   │      │ - Exact Contract Match      │
                      │ - Tree Variance Conf.    │      │ - Instantaneous Execution   │
                      └────────────┬─────────────┘      └──────────────┬──────────────┘
                                   │                                   │
                                   └─────────────────┬─────────────────┘
                                                     │
                                                     ▼
                                     Prescriptive Corrective Engine
                                                     │
                                                     ▼
                                       Final Prediction Response
```

### 3.1. Scikit-Learn Ensemble Pipeline
- **Classifier**: `RandomForestClassifier(n_estimators=150, max_depth=7, class_weight='balanced', random_state=42)`
  - Outputs binary shortfall probability $P(\text{shortfall} \mid \vec{x})$.
- **Tonnage Regressor**: `RandomForestRegressor(n_estimators=100, max_depth=6, random_state=42)`
  - Outputs continuous expected shortfall magnitude $\Delta Y_{\text{tonnes}}$.
- **Grade Degradation Regressor**: `RandomForestRegressor(n_estimators=100, max_depth=5, random_state=42)`
  - Outputs predicted manganese purity degradation $\Delta G_{\% \text{Mn}}$.

### 3.2. Confidence Calibration via Estimator Variance
Model confidence is mathematically derived from the inter-tree prediction variance across the ensemble:

$$\sigma_{\text{trees}} = \sqrt{\frac{1}{N} \sum_{i=1}^{N} \left(P_i(\text{shortfall}) - \bar{P}\right)^2}$$

$$\text{Confidence} = \max\left(0.55, \min\left(0.99, 1.0 - 1.5 \cdot \sigma_{\text{trees}}\right)\right)$$

### 3.3. Prescriptive Corrective Action Generation
When shortfall probability exceeds $0.35$, the **Prescriptive Corrective Engine** generates operational mitigations ranked by recovery impact:

| Trigger Condition | Category | Prescribed Action | Estimated Recovery |
|---|---|---|---|
| $DDR > 0.40 \lor PMSI > 65$ | `DEWATERING_MOBILIZATION` | Deploy auxiliary high-head submersible diesel pumps to pit sumps | $+1,800 - 3,200\text{ MT}$ |
| $HRRM > 1.35$ | `LOGISTICAL_REROUTE` | Activate aggregate-stabilized bypass haulage corridors | $+800 - 1,500\text{ MT}$ |
| $EETI < 0.65 \lor EHP > 0.45$ | `FLEET_REALLOCATION` | Dispatch backup heavy machinery from low-risk opencast benches | $+1,200 - 2,400\text{ MT}$ |
| $GDRF > 0.30$ | `GRADE_BLENDING` | Adjust ROM feeder blending ratio with high-grade Balaghat ore | $+500 - 1,100\text{ MT}$ |

---

## 4. Database Schema Design & Entity-Relationship (ERD)

The database layer consists of **7 strongly-typed relational tables** managed with PostgreSQL 15+ and protected with Row-Level Security (RLS).

```
 ┌──────────────────────┐         1:N         ┌──────────────────────┐
 │        MINES         │────────────────────<│   MINING_EQUIPMENT   │
 │──────────────────────│                     │──────────────────────│
 │ PK  id (UUID)        │                     │ PK  id (UUID)        │
 │     code (VARCHAR)   │                     │ FK  mine_id (UUID)   │
 │     name (VARCHAR)   │                     │     equipment_code   │
 │     mine_type        │                     │     health_score     │
 │     annual_capacity  │                     │     operating_hours  │
 └──────────┬───────────┘                     └──────────────────────┘
            │
            │ 1:N
            ├─────────────────────────────────┐
            │                                 │
            ▼ 1:N                             ▼ 1:N
 ┌──────────────────────┐         ┌──────────────────────┐
 │  HISTORICAL_YIELDS   │         │  WEATHER_TELEMETRY   │
 │──────────────────────│         │──────────────────────│
 │ PK  id (UUID)        │         │ PK  id (UUID)        │
 │ FK  mine_id (UUID)   │         │ FK  mine_id (UUID)   │
 │     recorded_date    │         │     timestamp        │
 │     target_tonnage   │         │     rainfall_mm      │
 │     actual_tonnage   │         │     soil_moisture_pct│
 │     recovery_rate_pct│         │     flood_risk_index │
 └──────────────────────┘         └──────────────────────┘
            │
            ▼ 1:N
 ┌────────────────────────────┐   1:N         ┌────────────────────────────┐
 │   SHORTFALL_PREDICTIONS    │──────────────<│     CORRECTIVE_ACTIONS     │
 │────────────────────────────│               │────────────────────────────│
 │ PK  id (UUID)              │               │ PK  id (UUID)              │
 │ FK  mine_id (UUID)         │               │ FK  prediction_id (UUID)   │
 │     prediction_timestamp   │               │ FK  mine_id (UUID)         │
 │     target_yield_mt        │               │     action_type            │
 │     shortfall_tonnage      │               │     priority               │
 │     shortfall_risk_level   │               │     status (PROPOSED, ...) │
 │     confidence_score       │               │     estimated_yield_recov  │
 │     features_snapshot      │               └────────────────────────────┘
 └────────────────────────────┘
            │
            ▼
 ┌────────────────────────────┐
 │         AUDIT_LOGS         │
 │────────────────────────────│
 │ PK  id (UUID)              │
 │     user_id (VARCHAR)      │
 │     action (VARCHAR)       │
 │     resource_type          │
 │     resource_id            │
 │     details (JSONB)        │
 │     timestamp              │
 └────────────────────────────┘
```

### Table Indexing & Constraint Strategy

- **Foreign Key Cascades**: `mining_equipment`, `historical_yields`, and `weather_telemetry` delete on cascade with `mines(id)`.
- **Composite Unique Constraints**:
  - `historical_yields(mine_id, recorded_date)` prevents duplicate daily/monthly yield records.
  - `weather_telemetry(mine_id, timestamp)` prevents duplicate sensor timestamps.
- **B-Tree Indexes**: Created on `(mine_id, recorded_date DESC)`, `(mine_id, timestamp DESC)`, `(shortfall_risk_level)`, and `(priority)`.

---

## 5. Next.js API Routes & Proxy Resilience

All incoming requests pass through **Zod runtime schema validation** before reaching the application logic.

```
Incoming Request
      │
      ▼
Zod Schema Validation (Boundary Value Analysis)
      │
      ├─── Invalid (400 Bad Request) ───► Standardized Error JSON
      │
      ▼ Valid
Supabase Data Resolution (Mine master + telemetry)
      │
      ▼
FastAPI HTTP Proxy Execution (AbortController 3000ms timeout)
      │
      ├─── Success (HTTP 200) ──────────► Parse ML Payload
      │
      └─── Timeout / Unreachable ──────► Deterministic Heuristic Fallback
                                                │
                                                ▼
                                    Persist Prediction & Actions
                                                │
                                                ▼
                                    Atomic Audit Log Ingestion
                                                │
                                                ▼
                                    Return Response to Client
```

---

## 6. Resilient Dual-Mode Data Layer Architecture

The platform embeds a custom **In-Memory Fluent Query Builder** (`MockQueryBuilder`) and mock database (`MockSupabaseClient`) in `lib/supabase.ts`.

### Capabilities:
- **Zero Configuration**: Activates automatically when environment variables contain placeholder credentials or `USE_MOCK_DATA=true`.
- **Full Chaining Support**: Implements `.from().select().eq().neq().gt().gte().lt().lte().in().like().ilike().order().limit().range().single().insert().update().delete()`.
- **Pre-Seeded Fidelity**: Pre-populated with data for all 8 MOIL mines, machinery assets, and historical telemetry feeds.

---

## 7. 4-Tier Automated Test Infrastructure

The application is validated across a 4-tier testing hierarchy:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             TIER 4: CROSS-SERVICE E2E WORKFLOW SUITE                             │
│ - Full Pipeline: Telemetry Ingestion -> Next.js API -> FastAPI ML -> Supabase DB -> Alert Feed  │
│ - Regional Disaster Multi-Mine Simulation across all 8 MOIL Mines                                │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│                             TIER 3: PYTHON FASTAPI ML INFERENCE SUITE                            │
│ - Mathematical monotonicity of 7 interaction formulas                                           │
│ - Prediction bounds [0, 1], confidence calibration [0.55, 0.99], latency < 100ms                │
│ - Prescriptive corrective engine rule generation                                                 │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│                            TIER 2: NEXT.JS API ROUTE INTEGRATION SUITE                           │
│ - Route handlers (/api/predict, /api/mines, /api/equipment, /api/alerts, /api/health)           │
│ - FastAPI proxy timeout resilience and heuristic fallback activation                             │
│ - Database mutations and audit logging integrity                                                 │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│                              TIER 1: UNIT & SCHEMA VALIDATION SUITE                              │
│ - Zod schema validation and boundary value analysis (rainfall <= 500mm, positive tonnages)       │
│ - Pydantic v2 schema constraints                                                                 │
│ - Mock Supabase query builder fluent operations                                                  │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Summary Specification Checklist

| Feature | Design Specification | Verification Reference |
|---|---|---|
| **API Boundary Validation** | Zod + Pydantic v2 runtime schemas | `tests/unit/validation.test.js` |
| **Fault Tolerance** | 3000ms timeout with heuristic fallback | `tests/integration/proxy_resilience.test.js` |
| **Model Ensemble** | RandomForest (150 trees) + Dual Regressors | `tests/ml_service/test_model_performance.py` |
| **Domain Formulas** | 7 Interaction Features ($EETI \dots EHP$) | `tests/ml_service/test_feature_engineering.py` |
| **Database Security** | PostgreSQL RLS + Foreign Keys + Audit Logs | `tests/integration/db_mutations.test.js` |
| **E2E Integration** | 7-step full lifecycle + 8-mine disaster sim | `tests/e2e/e2e_pipeline.test.js` |
