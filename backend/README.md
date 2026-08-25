# MOIL Limited AI/ML Predictive Intelligence Microservice

FastAPI Python microservice for predicting manganese reserve shortfalls, calculating multi-modal risk indices, and generating prescriptive operational corrective actions for MOIL Limited mining operations.

---

## Key Features

1. **Multi-Modal Telemetry Fusion**:
   - Fuses satellite precipitation and soil moisture radar observations with heavy equipment telematics and geological block kriging models.
   - Calculates 7 physical interaction features:
     - `EETI`: Effective Equipment Throughput Index
     - `PMSI`: Precipitation-Moisture Stress Index
     - `HRRM`: Haul Road Resistance Multiplier
     - `DDR`: Dewatering Deficit Ratio
     - `SBP`: Stripping Backlog Pressure
     - `GDRF`: Grade Dilution Risk Factor
     - `EHP`: Equipment Health Penalty

2. **Dual-Model Resilient Architecture**:
   - **Scikit-Learn ML Ensemble**: `RandomForestClassifier` for shortfall probability + `RandomForestRegressor` for quantitative deficit in metric tonnes and grade degradation.
   - **Deterministic Heuristic Fallback (`HeuristicShortfallPredictor`)**: Zero-cold-start rule-based engine guaranteeing 100% service uptime even prior to model training.

3. **Prescriptive Operational Mitigation Engine (`PrescriptiveCorrectiveEngine`)**:
   - Automatically generates prioritized operational interventions across:
     - Dewatering & Drainage (`PUMPING_DRAINAGE`)
     - Haulage Logistics & Ramp Dressing (`HAULAGE_LOGISTICS`)
     - Fleet Mobilization & Maintenance (`FLEET_MANAGEMENT`)
     - Grade Blending (`GRADE_BLENDING`)
     - Mine Planning & Geotechnical Depressurization (`MINE_PLANNING`)

4. **MOIL Mine Catalog & Telemetry Simulator**:
   - Master data and high-fidelity synthetic telemetry streamer for 8 MOIL mines:
     - `MOIL-BAL-01`: Balaghat Mine
     - `MOIL-DBZ-02`: Dongri Buzurg Mine
     - `MOIL-MAN-03`: Mansar Mine
     - `MOIL-CHK-04`: Chikla Mine
     - `MOIL-KAN-05`: Kandri Mine
     - `MOIL-GUM-06`: Gumgaon Mine
     - `MOIL-TIR-07`: Tirodi Mine
     - `MOIL-UKW-08`: Ukwa Mine

---

## Directory Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── config.py                 # Pydantic Settings configuration
│   ├── main.py                   # FastAPI application factory & middleware
│   ├── schemas/                  # Pydantic v2 strict schemas
│   │   ├── __init__.py
│   │   ├── telemetry.py          # Satellite, Equipment, Geology schemas
│   │   ├── prediction.py         # Prediction request/response, Enums
│   │   └── corrective_action.py  # Operational action items & priorities
│   ├── models/                   # Core ML, feature & mitigation engines
│   │   ├── __init__.py
│   │   ├── feature_engineering.py# 7 interaction feature equations
│   │   ├── data_generator.py     # 8 MOIL mines synthetic simulator
│   │   ├── predictor.py          # ML Random Forest + Heuristic predictor
│   │   └── corrective_engine.py  # Prescriptive mitigation generator
│   └── api/                      # REST routers
│       ├── __init__.py
│       └── v1/
│           ├── __init__.py
│           ├── health.py         # /api/v1/health
│           ├── mines.py          # /api/v1/mines
│           ├── telemetry.py      # /api/v1/telemetry/simulated
│           └── predict.py        # /api/v1/predict/shortfall, /batch, /train
├── tests/                        # Comprehensive Pytest test suite
│   ├── __init__.py
│   ├── conftest.py               # TestClient fixtures & mock payloads
│   ├── test_schemas.py           # Boundary & Pydantic constraint tests
│   ├── test_features.py          # Feature equation calculations
│   ├── test_models.py            # ML & Heuristic predictor verification
│   └── test_api.py               # REST API route integration tests
├── requirements.txt              # Microservice Python dependencies
├── run.py                        # Local development runner
└── README.md
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Root service metadata & discovery |
| `GET` | `/api/v1/health` | Service health, model loaded status, uptime |
| `GET` | `/api/v1/mines` | Master catalog of all 8 MOIL mines |
| `GET` | `/api/v1/mines/{mine_id}` | Detailed operational data for a mine |
| `GET` | `/api/v1/telemetry/simulated` | Stream simulated telemetry for random mine |
| `GET` | `/api/v1/telemetry/simulated/{mine_id}` | Stream simulated telemetry for specific mine |
| `POST` | `/api/v1/predict/shortfall` | Real-time shortfall prediction for single sector |
| `POST` | `/api/v1/predict/batch` | Batch shortfall predictions (up to 50 sectors) |
| `POST` | `/api/v1/train` | Retrain model on synthetic historical dataset |

---

## Installation & Running

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run local development server
python run.py
# Server starts on http://127.0.0.1:8000 (Interactive Swagger Docs: http://127.0.0.1:8000/docs)

# 3. Run test suite
pytest tests/ -v
```
