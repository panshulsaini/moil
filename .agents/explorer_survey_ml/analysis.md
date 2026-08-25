# AI/ML Inference Service — Technical Architecture & Survey Report

**Project**: MOIL Limited Predictive Intelligence Platform  
**Module**: R3: AI/ML Inference Service  
**Author**: Explorer Survey ML Agent  
**Date**: 2026-08-25  
**Working Directory**: `C:\Users\Panshul Saini\.gemini\antigravity\scratch\moil_project\.agents\explorer_survey_ml`

---

## 1. Executive Summary

The AI/ML Inference Service is a core analytical engine designed for **MOIL Limited** (India's largest manganese ore producer). Its objective is to prevent production disruptions, grade dilution, and ore supply chain bottlenecks across open-cast and underground mines.

The microservice is implemented in **Python FastAPI (with Pydantic v2)**, providing low-latency REST endpoints for real-time inference, batch scoring, on-demand simulated telemetry streaming, and automated model retraining.

### Key Capabilities
1. **Multi-Modal Telemetry Fusion**: Fuses satellite-derived hydro-meteorological data (precipitation, soil saturation, flood risk) with heavy equipment telematics (HEMM availability, MTBF, cycle times) and geological block models (Mn grade, stripping ratio, moisture).
2. **Dual-Task Prediction**:
   - **Classification**: Probability of manganese reserve / production shortfall occurrence within a 7-to-30-day forecast horizon.
   - **Regression**: Quantitative estimation of expected tonnage shortfall ($\Delta \text{Tonnes}$) and manganese grade degradation ($\Delta \text{Grade}_{\text{Mn}} \%$).
3. **Calibrated Confidence Scoring & Feature Attribution**: Computes probabilistic confidence intervals and top feature risk contributors (SHAP-inspired weights).
4. **Actionable Corrective Action Generator**: Translates predicted risk factors into operational engineering interventions (pumping deployment, fleet re-routing, grade blending, bench sequencing).
5. **Deterministic Heuristic Fallback Engine**: Guarantees high availability (100% uptime SLA) with zero cold-start latency, ensuring valid inference even if model training artifacts are not yet initialized.

---

## 2. MOIL Mining Operational Context & Domain Modeling

MOIL operates key manganese mines across Maharashtra and Madhya Pradesh:
- **Balaghat Mine** (MP): World-class underground & open-cast mine producing high-grade dioxide and metallurgical manganese ore ($40\text{--}48\% \text{ Mn}$).
- **Dongri Buzurg Mine** (MH): Open-cast mine producing high-grade dioxide ore (pyrolusite) critical for dry-cell batteries; highly sensitive to monsoon moisture and pit floor stability.
- **Gumgaon, Kandri, Mansar, Chikla, Tirodi, Ukwa Mines**: Mix of underground and open-cast operations with varying stripping ratios ($1:3$ to $1:8$) and dewatering requirements.

### Operational Disruption Vectors
| Disruption Vector | Primary Driver | Operational Impact |
|---|---|---|
| **Pit Flooding & Waterlogging** | Heavy rainfall ($>40\text{ mm/day}$), high soil saturation ($>75\%$) | Inaccessible lower benches, submerged sumps, stalled excavators |
| **Haul Road Degradation** | High soil moisture, runoff erosion | Dumper cycle time increase by $30\text{--}80\%$, slip hazards, tyre wear |
| **Equipment Unscheduled Breakdown** | High operating hours, severe load, delayed MTBF maintenance | Reduced excavation throughput ($\text{tph}$), ore stockpile depletion |
| **Grade Dilution & Contamination** | Inaccurate face blasting, monsoon mud slumping into ore vein | Mn purity drop ($<35\%$), excess silica/phosphorus, penalty rejections |
| **Overburden Stripping Backlog** | Inadequate dumper/excavator ratio | Exposed ore starvation for subsequent production shifts |

---

## 3. Telemetry & Multi-Modal Data Fusion Specification

The inference pipeline ingests three structured telemetry domains per mine sector:

```
+-----------------------------------------------------------------------------------+
|                           TELEMETRY FUSION INGESTION                              |
+-----------------------------------------------------------------------------------+
|  1. Satellite & Weather           2. Equipment & Telematics     3. Geological Blocks   |
|  - Rainfall 24h & 7d (mm)        - Fleet Availability (%)      - Reserve Grade (% Mn) |
|  - Soil Saturation Index (0-100) - Unscheduled Downtime (hrs)   - Planned Target (t)   |
|  - Flood Risk Index (0-100)      - Mean Time Between Failures   - Stripping Ratio      |
|  - Runoff & Slope Erosion Index  - Dumper Cycle Time (mins)     - Ore Hardness / SG    |
|                                  - Fuel Consumption (L/hr)      - In-situ Moisture (%) |
+----------------------------------------+------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                           FEATURE ENGINEERING PIPELINE                            |
|  - Effective Fleet Capacity Index    - Precipitation Stress Index                 |
|  - Haul Road Friction Delay Factor   - Dewatering Deficit Ratio                   |
|  - Grade Risk Factor                 - Stripping Pressure Index                   |
+----------------------------------------+------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                       DUAL PREDICTIVE INFERENCE ENGINE                            |
|       [Scikit-Learn / XGBoost Ensemble]  <--->  [Rule-Based Heuristic Fallback]   |
+----------------------------------------+------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                         OUTPUT GENERATION & RESPONSE                              |
|  - Shortfall Probability & Level (LOW / MEDIUM / HIGH / CRITICAL)                 |
|  - Expected Tonnage Deficit (Tonnes) & Grade Degradation (% Mn)                   |
|  - Confidence Score (0.0 - 1.0) & Contributing Risk Factors (SHAP/Attribution)     |
|  - Ranked Corrective Action Recommendations (Operational Interventions)          |
+-----------------------------------------------------------------------------------+
```

### Raw Telemetry Schema Fields

1. **Satellite & Weather Feed (`SatelliteTelemetry`)**:
   - `rainfall_24h_mm` (float, $\ge 0.0$): Precipitation in the last 24 hours.
   - `rainfall_7d_cumulative_mm` (float, $\ge 0.0$): 7-day cumulative precipitation.
   - `soil_moisture_pct` (float, $0.0 \le x \le 100.0$): Surface soil moisture saturation index.
   - `flood_risk_score` (float, $0.0 \le x \le 100.0$): Optical/SAR derived pit flood probability.
   - `slope_erosion_index` (float, $0.0 \le x \le 10.0$): Slope instability and runoff risk.

2. **Equipment & HEMM Telematics (`EquipmentTelemetry`)**:
   - `fleet_availability_pct` (float, $0.0 \le x \le 100.0$): Operational availability of excavators and dumpers.
   - `active_excavators` (int, $\ge 0$): Number of operational excavators on active ore face.
   - `active_dumpers` (int, $\ge 0$): Number of hauling trucks in circulation.
   - `unscheduled_downtime_hours` (float, $\ge 0.0$): Cumulative breakdown hours in current shift.
   - `dumper_cycle_time_min` (float, $\ge 0.0$): Round-trip cycle time from pit face to crusher/stockpile.
   - `dewatering_pump_capacity_m3hr` (float, $\ge 0.0$): Active pumping discharge capacity.
   - `maintenance_backlog_score` (float, $0.0 \le x \le 10.0$): Overdue preventative maintenance penalty.

3. **Geological & Block Model Data (`GeologicalData`)**:
   - `mine_id` (string): MOIL mine identifier (e.g. `MOIL-BAL-01`, `MOIL-DBZ-02`).
   - `mine_name` (string): e.g., "Balaghat Mine", "Dongri Buzurg Mine".
   - `sector_id` (string): e.g., "North-Pit-B4", "Underground-Level-5".
   - `planned_tonnage` (float, $> 0.0$): Target ore extraction in metric tonnes.
   - `target_grade_mn_pct` (float, $0.0 \le x \le 60.0$): Target manganese grade percentage.
   - `estimated_block_grade_mn_pct` (float, $0.0 \le x \le 60.0$): Geostatistical kriging estimated grade.
   - `stripping_ratio` (float, $\ge 0.0$): Current overburden-to-ore volumetric ratio.
   - `ore_moisture_pct` (float, $0.0 \le x \le 30.0$): In-situ moisture content of ore body.

---

## 4. Machine Learning Formulation & Feature Engineering

### 4.1 Feature Engineering Formulas

The feature engineering layer computes 7 interaction indicators:

1. **Effective Equipment Throughput Index ($EETI$)**:
   $$EETI = \left(\frac{\text{fleet\_availability\_pct}}{100}\right) \times \left(\frac{\text{active\_excavators} \times 120 + \text{active\_dumpers} \times 35}{155}\right) \times \left(1.0 - \min(0.5, \frac{\text{unscheduled\_downtime}}{24})\right)$$
2. **Precipitation-Moisture Stress Index ($PMSI$)**:
   $$PMSI = \min\left(100.0, \; \left(\frac{\text{rainfall\_24h\_mm}}{50.0} \times 40.0\right) + \left(\frac{\text{soil\_moisture\_pct}}{100.0} \times 60.0\right)\right)$$
3. **Haul Road Resistance Multiplier ($HRRM$)**:
   $$HRRM = 1.0 + \max\left(0.0, \; \frac{\text{soil\_moisture\_pct} - 50.0}{50.0} \times 0.75\right) + \left(\frac{\text{dumper\_cycle\_time\_min} - 15.0}{15.0} \times 0.25\right)$$
4. **Dewatering Deficit Ratio ($DDR$)**:
   $$\text{Water Inflow Est} = \text{rainfall\_24h\_mm} \times 25.0 \quad (\text{m}^3/\text{hr})$$
   $$DDR = \max\left(0.0, \; \min\left(1.0, \; \frac{\text{Water Inflow Est} - \text{dewatering\_pump\_capacity}}{\max(1.0, \text{Water Inflow Est})}\right)\right)$$
5. **Stripping Backlog Pressure ($SBP$)**:
   $$SBP = \max\left(0.0, \; \frac{\text{stripping\_ratio} - 3.5}{3.5}\right)$$
6. **Grade Dilution Risk Factor ($GDRF$)**:
   $$GDRF = \max\left(0.0, \; \frac{\text{target\_grade\_mn\_pct} - \text{estimated\_block\_grade\_mn\_pct}}{\text{target\_grade\_mn\_pct}}\right) + \left(\frac{\text{ore\_moisture\_pct}}{30.0} \times 0.15\right)$$
7. **Equipment Health Penalty ($EHP$)**:
   $$EHP = \frac{\text{maintenance\_backlog\_score}}{10.0} \times 0.5 + \min\left(0.5, \; \frac{\text{unscheduled\_downtime\_hours}}{12.0} \times 0.5\right)$$

### 4.2 Machine Learning Model Architecture

We use a dual-model ensemble built on `scikit-learn`:

1. **Shortfall Classifier (`RandomForestClassifier` / `GradientBoostingClassifier`)**:
   - Hyperparameters: `n_estimators=150`, `max_depth=6`, `min_samples_split=4`, `class_weight='balanced'`.
   - Objective: Predict binary shortfall flag ($y \in \{0, 1\}$) where $y=1$ indicates target tonnage or grade deficit $\ge 10\%$.
   - Output: Calibrated probability $P(\text{Shortfall})$.

2. **Shortfall Magnitude Regressor (`RandomForestRegressor` / `GradientBoostingRegressor`)**:
   - Hyperparameters: `n_estimators=100`, `max_depth=5`, `criterion='squared_error'`.
   - Objective: Predict expected tonnage deficit $\Delta T$ in metric tonnes.

3. **Grade Degradation Regressor (`RandomForestRegressor`)**:
   - Objective: Predict grade drop $\Delta \text{Grade}_{\text{Mn}}$ in percentage points.

4. **Confidence Score Formulation**:
   $$\text{Confidence} = 1.0 - \left( 1.5 \times \text{StdDev}(\hat{y}_{\text{trees}}) + 0.05 \times \mathbb{I}_{\text{extreme\_weather}} \right)$$
   Bounded to the range $[0.50, 0.99]$.

5. **Risk Classification Bands**:
   - **LOW**: $P(\text{Shortfall}) < 0.30$
   - **MEDIUM**: $0.30 \le P(\text{Shortfall}) < 0.65$
   - **HIGH**: $0.65 \le P(\text{Shortfall}) < 0.85$
   - **CRITICAL**: $P(\text{Shortfall}) \ge 0.85$

---

## 5. Deterministic Heuristic Fallback Engine

To guarantee zero service downtime and deterministic test results even before ML model training:

```python
class HeuristicShortfallPredictor:
    def predict(self, features: dict) -> dict:
        # 1. Weather Impact Score [0.0 - 1.0]
        weather_score = (features["pmsi"] / 100.0) * 0.40 + features["ddr"] * 0.60
        
        # 2. Equipment Impact Score [0.0 - 1.0]
        equip_score = (1.0 - min(1.0, features["eeti"])) * 0.60 + features["ehp"] * 0.40
        
        # 3. Geological & Stripping Impact [0.0 - 1.0]
        geo_score = features["gdrf"] * 0.60 + min(1.0, features["sbp"]) * 0.40
        
        # Weighted Shortfall Probability
        raw_prob = (weather_score * 0.45) + (equip_score * 0.35) + (geo_score * 0.20)
        prob = max(0.02, min(0.98, raw_prob))
        
        # Predicted Tonnage Shortfall
        tonnage_shortfall = max(0.0, features["planned_tonnage"] * prob * 0.85)
        
        # Predicted Grade Degradation
        grade_degradation = max(0.0, features["target_grade_mn_pct"] * geo_score * 0.25)
        
        return {
            "shortfall_probability": round(prob, 4),
            "expected_shortfall_tonnes": round(tonnage_shortfall, 2),
            "expected_grade_degradation_pct": round(grade_degradation, 2),
            "risk_level": self._classify_risk(prob),
            "confidence_score": 0.88,
            "engine_used": "deterministic_heuristic_v1"
        }
```

---

## 6. Corrective Action Recommendation Engine

The recommendation engine translates underlying feature anomalies into prioritized operational decisions:

| Condition Trigger | Recommendation Title | Action Category | Suggested Operational Command |
|---|---|---|---|
| $PMSI > 60 \lor DDR > 0.4$ | **Deploy High-Capacity Submersible Pumps** | `PUMPING_DRAINAGE` | "Deploy 2x 500 m³/hr auxiliary submersible pumps at pit sump; channel runoff away from ore face." |
| $HRRM > 1.3$ | **Reroute Haulage & Armor Haul Roads** | `HAULAGE_LOGISTICS` | "Divert 35T dumpers to upper crest bypass ramp; dress slippery curves with 40mm crushed basalt." |
| $EETI < 0.7 \lor EHP > 0.4$ | **Mobilize Standby HEMM & Rapid Maintenance** | `FLEET_MANAGEMENT` | "Transfer 2x CAT 349 excavators from overburden sector to high-grade ore face; prioritize EX-03 hydraulic servicing." |
| $GDRF > 0.2$ | **Enact Grade Blending with Stockpile** | `GRADE_BLENDING` | "Blend current run-of-mine ore with Balaghat Grade-A stockpile (46% Mn) in ratio 2:1 to meet dispatch spec." |
| $SBP > 0.5$ | **Rebalance Stripping-to-Ore Ratio** | `MINE_PLANNING` | "Increase overburden stripping allocation on Bench 5 to prevent ore exposure starvation in Q3." |

Each recommendation output includes:
- `id`: Unique UUID/string
- `title`: Concise action title
- `category`: Category enum
- `priority`: `CRITICAL` | `HIGH` | `MEDIUM` | `LOW`
- `description`: Actionable operational instructions
- `estimated_recovery_tonnes`: Estimated recoverable tonnage
- `estimated_time_hours`: Implementation timeframe
- `impact_score`: Normalized effectiveness index ($0.0\text{--}10.0$)

---

## 7. FastAPI Microservice & API Endpoints Specification

### 7.1 Microservice Directory Layout

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                     # FastAPI app factory, CORS, exception handlers
│   ├── config.py                   # App settings, environment variables
│   ├── api/
│   │   ├── __init__.py
│   │   ├── routes.py               # REST route handlers
│   │   └── schemas.py              # Pydantic v2 validation models
│   ├── ml/
│   │   ├── __init__.py
│   │   ├── model.py                # Model manager, training, inference wrapper
│   │   ├── features.py             # Feature engineering & transformation
│   │   ├── heuristic.py            # Zero-cold-start deterministic engine
│   │   └── synthetic_data.py       # Domain-specific synthetic telemetry generator
│   ├── services/
│   │   ├── __init__.py
│   │   ├── telemetry_service.py    # Simulated streaming data feed provider
│   │   └── recommendation_engine.py# Actionable mitigation generator
│   └── core/
│       ├── __init__.py
│       └── logging.py              # Structured logging configuration
├── tests/
│   ├── __init__.py
│   ├── conftest.py                 # Pytest fixtures & mock clients
│   ├── test_api.py                 # FastAPI route & endpoint tests
│   ├── test_ml.py                  # Feature engineering & model unit tests
│   └── test_schemas.py             # Pydantic schema validation tests
├── requirements.txt                # Python dependencies
├── run.py                          # Local startup entrypoint
└── Dockerfile                      # Containerization specification
```

### 7.2 REST API Endpoints Specification

| Method | Path | Description | Request Body | Response Body |
|---|---|---|---|---|
| `GET` | `/` | Microservice Root | None | Service metadata, status, docs link |
| `GET` | `/api/v1/health` | Health Check & Model Info | None | `HealthCheckResponse` |
| `POST` | `/api/v1/predict/shortfall` | Single Mine Sector Prediction | `ShortfallPredictionRequest` | `ShortfallPredictionResponse` |
| `POST` | `/api/v1/predict/batch` | Batch Prediction across sectors | `BatchPredictionRequest` | `BatchPredictionResponse` |
| `GET` | `/api/v1/telemetry/simulated` | Stream simulated telemetry | Query params (`mine_id`, `scenario`) | `SimulatedTelemetryResponse` |
| `POST` | `/api/v1/train` | Retrain model on synthetic/historical data | `TrainRequest` (optional samples) | `TrainingResponse` |
| `GET` | `/api/v1/mines` | MOIL Mine Master Data | None | `List[MineMetadata]` |

---

## 8. Pydantic v2 Input/Output Schemas

```python
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator

class RiskLevelEnum(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class ActionCategoryEnum(str, Enum):
    PUMPING_DRAINAGE = "PUMPING_DRAINAGE"
    HAULAGE_LOGISTICS = "HAULAGE_LOGISTICS"
    FLEET_MANAGEMENT = "FLEET_MANAGEMENT"
    GRADE_BLENDING = "GRADE_BLENDING"
    MINE_PLANNING = "MINE_PLANNING"

class ActionPriorityEnum(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

# --- INPUT SCHEMAS ---

class SatelliteTelemetryInput(BaseModel):
    rainfall_24h_mm: float = Field(..., ge=0.0, le=500.0, description="Precipitation in last 24h (mm)")
    rainfall_7d_cumulative_mm: float = Field(..., ge=0.0, le=2000.0, description="7-day cumulative rainfall (mm)")
    soil_moisture_pct: float = Field(..., ge=0.0, le=100.0, description="Soil saturation percentage (0-100%)")
    flood_risk_score: float = Field(..., ge=0.0, le=100.0, description="Satellite optical/SAR flood risk (0-100)")
    slope_erosion_index: float = Field(default=2.0, ge=0.0, le=10.0, description="Slope erosion index (0-10)")

class EquipmentTelemetryInput(BaseModel):
    fleet_availability_pct: float = Field(..., ge=0.0, le=100.0, description="HEMM fleet availability percentage")
    active_excavators: int = Field(..., ge=0, le=50, description="Operational excavators on site")
    active_dumpers: int = Field(..., ge=0, le=200, description="Operational hauling dumpers")
    unscheduled_downtime_hours: float = Field(..., ge=0.0, le=24.0, description="Unscheduled breakdown hours in shift")
    dumper_cycle_time_min: float = Field(..., ge=1.0, le=180.0, description="Round trip cycle time in minutes")
    dewatering_pump_capacity_m3hr: float = Field(default=300.0, ge=0.0, description="Active dewatering pump capacity")
    maintenance_backlog_score: float = Field(default=2.0, ge=0.0, le=10.0, description="Preventative maintenance backlog (0-10)")

class GeologicalDataInput(BaseModel):
    mine_id: str = Field(..., min_length=2, max_length=50, description="Unique mine identifier, e.g. MOIL-BAL-01")
    mine_name: str = Field(..., min_length=2, max_length=100, description="Mine name, e.g. Balaghat Mine")
    sector_id: str = Field(..., min_length=2, max_length=50, description="Bench or pit sector ID")
    planned_tonnage: float = Field(..., gt=0.0, le=100000.0, description="Planned ore tonnage target")
    target_grade_mn_pct: float = Field(..., ge=10.0, le=65.0, description="Target Manganese grade percentage")
    estimated_block_grade_mn_pct: float = Field(..., ge=10.0, le=65.0, description="Estimated block grade percentage")
    stripping_ratio: float = Field(default=4.0, ge=0.0, le=25.0, description="Overburden to ore stripping ratio")
    ore_moisture_pct: float = Field(default=5.0, ge=0.0, le=35.0, description="In-situ ore moisture percentage")

class ShortfallPredictionRequest(BaseModel):
    satellite: SatelliteTelemetryInput
    equipment: EquipmentTelemetryInput
    geology: GeologicalDataInput
    forecast_days: int = Field(default=7, ge=1, le=30, description="Forecast window (days)")

# --- OUTPUT SCHEMAS ---

class FeatureContribution(BaseModel):
    factor_name: str
    contribution_pct: float
    description: str
    severity: str

class CorrectiveAction(BaseModel):
    id: str
    title: str
    category: ActionCategoryEnum
    priority: ActionPriorityEnum
    description: str
    estimated_recovery_tonnes: float
    estimated_time_hours: float
    impact_score: float

class ShortfallPredictionResponse(BaseModel):
    request_id: str
    mine_id: str
    mine_name: str
    sector_id: str
    shortfall_predicted: bool
    shortfall_probability: float = Field(..., ge=0.0, le=1.0)
    risk_level: RiskLevelEnum
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    expected_shortfall_tonnes: float
    expected_grade_degradation_pct: float
    contributing_factors: List[FeatureContribution]
    corrective_actions: List[CorrectiveAction]
    engine_used: str
    timestamp: str

class BatchPredictionRequest(BaseModel):
    items: List[ShortfallPredictionRequest] = Field(..., min_length=1, max_length=50)

class BatchPredictionResponse(BaseModel):
    total_processed: int
    predictions: List[ShortfallPredictionResponse]
    summary_high_risk_count: int
    summary_total_shortfall_tonnes: float

class SimulatedTelemetryResponse(BaseModel):
    mine_id: str
    mine_name: str
    scenario: str
    satellite: SatelliteTelemetryInput
    equipment: EquipmentTelemetryInput
    geology: GeologicalDataInput
    timestamp: str

class HealthCheckResponse(BaseModel):
    status: str
    service: str
    version: str
    model_loaded: bool
    model_type: str
    uptime_seconds: float
```

---

## 9. Synthetic Data Generator & Telemetry Simulator

The microservice includes a domain-grounded synthetic generator (`SyntheticMineDataGenerator`) to produce training records reflecting actual physical correlations in open-cast manganese mining:

1. **Weather Seasonality & Regimes**:
   - `Monsoon Heavy`: High rainfall ($60\text{--}180\text{ mm}$), soil moisture ($80\text{--}98\%$), high flood risk ($70\text{--}95$).
   - `Normal Dry`: Low rainfall ($0\text{--}10\text{ mm}$), soil moisture ($15\text{--}40\%$).
   - `Pre-Monsoon Storm`: Moderate rainfall ($20\text{--}50\text{ mm}$), moderate soil moisture.
2. **Coupled Cascading Effects**:
   - $\text{Soil Moisture} \uparrow \implies \text{Dumper Cycle Time} \uparrow \text{ by } 40\text{--}90\%$.
   - $\text{Rainfall} > 50\text{ mm} \implies \text{Unscheduled Downtime} \uparrow \text{ by } 3\text{--}8 \text{ hours}$.
   - $\text{Stripping Ratio} > 6.0 \implies \text{Ore Exposure Rate} \downarrow \implies \text{Shortfall Probability} \uparrow$.
   - $\text{Mud Runoff} \implies \text{Mn Grade Dilution } \Delta\text{Grade} = 2.0\text{--}5.5\%$.
3. **Pre-populated Mine Database**:
   - 8 MOIL mines configured with true coordinates (latitude/longitude), active benches, average daily capacity ($500\text{--}3500\text{ tonnes/day}$), and baseline Mn grades ($36\%\text{--}48\%$).

---

## 10. Python Environment, Dependencies & Pytest Suite

### 10.1 Environment Requirements (`requirements.txt`)
```text
fastapi>=0.110.0
uvicorn[standard]>=0.28.0
pydantic>=2.6.0
pydantic-settings>=2.2.0
scikit-learn>=1.4.0
numpy>=1.26.0
pandas>=2.2.0
joblib>=1.3.2
httpx>=0.27.0
pytest>=8.0.0
pytest-asyncio>=0.23.0
python-multipart>=0.0.9
```

### 10.2 Pytest Test Plan & Execution Commands

The test suite is structured in `backend/tests/` with 100% endpoint coverage:
1. **`test_schemas.py`**:
   - Valid payload ingestion.
   - Out-of-bounds rejection ($422$ status code for negative rainfall, moisture $>100\%$, cycle time $\le 0$).
   - Missing required fields rejection.
2. **`test_ml.py`**:
   - Feature engineering mathematical verification.
   - Heuristic fallback predictor output verification ($0.0 \le P(\text{Shortfall}) \le 1.0$).
   - Scikit-learn model training, serialization to `.joblib`, and reload verification.
   - Synthetic dataset generator distribution checks.
3. **`test_api.py`**:
   - `GET /api/v1/health` $\implies 200\text{ OK}$, `status == "healthy"`.
   - `POST /api/v1/predict/shortfall` with mock monsoon data $\implies 200\text{ OK}$, `shortfall_predicted == True`, `risk_level in ["HIGH", "CRITICAL"]`.
   - `POST /api/v1/predict/shortfall` with optimal dry weather data $\implies 200\text{ OK}$, `risk_level == "LOW"`.
   - `POST /api/v1/predict/batch` with 5 mine sectors $\implies 200\text{ OK}$, `total_processed == 5`.
   - `GET /api/v1/telemetry/simulated` $\implies 200\text{ OK}$, valid synthetic payload.
   - `POST /api/v1/train` $\implies 200\text{ OK}$, `model_trained == True`.
   - `GET /api/v1/mines` $\implies 200\text{ OK}$, returns 8 MOIL mines.

### Test Execution Commands
```bash
# Run all unit and integration tests
pytest backend/tests/ -v

# Run with coverage report
pytest backend/tests/ --cov=app --cov-report=term-missing

# Start local FastAPI development server with hot reload
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 11. Integration with Next.js Frontend and Supabase

1. **Next.js App Router Proxy / Direct Fetch**:
   - Next.js server actions or API routes (`/api/ml/predict`) can call FastAPI on `http://localhost:8000/api/v1/predict/shortfall`.
   - Response directly powers Recharts risk gauges, shortfall heatmaps, and recommendation action lists.
2. **Supabase Database Synchronization**:
   - Predictions and simulated telemetry records can be asynchronously written to Supabase `predictions` and `telemetry_logs` tables.
   - Allows historical audit logging, time-series shortfall trend analysis, and trigger notifications for mine managers when `risk_level == "CRITICAL"`.

---

## 12. Summary & Recommendations for Worker Agents

- **Worker Implementation**: Implement `backend/` following the modular structure in Section 7.1.
- **Resilience First**: Ensure `HeuristicShortfallPredictor` is initialized on startup so that the service serves valid predictions immediately without waiting for training.
- **Model Training on Boot**: Run a background training routine during FastAPI startup (`lifespan` handler) using `SyntheticMineDataGenerator(n_samples=2000)` to generate and persist the Random Forest model artifact.
- **Strict Validation**: Utilize Pydantic v2 `@field_validator` and `Field` constraints to catch corrupted sensor inputs before they enter the ML pipeline.
