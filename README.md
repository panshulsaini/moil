# MOIL Limited — Predictive Intelligence Platform

[![Status](https://img.shields.io/badge/status-certified-brightgreen.svg)]()
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black.svg)]()
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688.svg)]()
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)]()
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-336791.svg)]()
[![License](https://img.shields.io/badge/license-Proprietary%20MOIL-purple.svg)]()

A predictive intelligence and operations web application engineered for **MOIL Limited** (Manganese Ore India Limited — A Miniratna Government of India Enterprise).

The platform continuously fuses simulated satellite telemetry (monsoon rainfall, radar soil moisture, pore water pressure) with heavy equipment telematics and geological ore grades across the **Vidarbha-Balaghat manganese concession belt**. It predicts quantitative reserve shortfalls, computes compounding geotechnical risks, and generates prescriptive DGMS-compliant corrective mitigations in real-time.

---

## 🌟 Key Capabilities

1. **Simulated Satellite & Radar Telemetry Fusion**
   - Ingests and models precipitation rates, 7-day cumulative rainfall, Sentinel-1 radar soil moisture percentages, and piezometer pore water pressures across all 8 major MOIL mining units.
2. **Multi-Modal Feature Engineering Pipeline**
   - Transforms disparate weather, machinery, and geological telemetry into **7 domain interaction indices** ($EETI, PMSI, HRRM, DDR, SBP, GDRF, EHP$) that accurately capture compounding geotechnical and logistical hazards.
3. **Random Forest AI/ML Inference & Zero-Cold-Start Heuristics**
   - Employs a dual-headed Machine Learning ensemble (Random Forest Classifier for risk probability + Random Forest Regressors for tonnage deficit and grade degradation) paired with an automated mathematical heuristic fallback engine for 100% uptime.
4. **Prescriptive DGMS Corrective Mitigations**
   - Generates prioritized, engineering-grade mitigation actions (e.g., high-head submersible pump mobilization, haul road bypass rerouting, low-grade blending adjustments, and shift reallocation) with quantified yield recovery estimates.
5. **Interactive GIS Mining Map & Corridor Command**
   - Geospatial visualization of the Maharashtra-Madhya Pradesh manganese mining corridor (Balaghat, Dongri Buzurg, Mansar, Chikla, Kandri, Gumgaon, Tirodi, Ukwa) featuring live risk rings, pit water levels, and haulage status.
6. **Resilient Dual-Mode Data Layer**
   - Seamlessly operates against a live **PostgreSQL / Supabase** instance or in an offline, zero-dependency **In-Memory Mock Repository** with complete pre-seeded data for all 8 mines and equipment fleets.

---

## 🏗️ System Architecture

```
                                  ┌─────────────────────────────────────────────────────────┐
                                  │                Next.js 14 App Router UI                 │
                                  │      (Tailwind CSS, Lucide Icons, Recharts 2.12)       │
                                  └────────────────────────────┬────────────────────────────┘
                                                               │
                              ┌────────────────────────────────┴────────────────────────────────┐
                              ▼                                                                 ▼
 ┌──────────────────────────────────────────────────────────┐      ┌──────────────────────────────────────────────────────────┐
 │                  Next.js Route Handlers                  │      │                   Supabase Data Layer                    │
 │  - /api/predict (Inference proxy + heuristic fallback)   │      │  - PostgreSQL 15+ Schema (7 relational tables + RLS)     │
 │  - /api/mines (Mine registry + aggregated telemetry)     │◄────►│  - In-Memory Mock Repository (Zero-network fallback)     │
 │  - /api/equipment (Fleet health & operating hours)       │      │  - High-fidelity seed data for 8 MOIL mine complexes     │
 │  - /api/alerts (Corrective mitigation workflows)         │      └──────────────────────────────────────────────────────────┘
 │  - /api/health (Multi-tier service & DB health probe)    │
 │  [Zod Runtime Request & Response Validation Layer]       │
 └────────────────────────────┬─────────────────────────────┘
                              │ HTTP JSON Proxy (3000ms timeout + heuristic fallback)
                              ▼
 ┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
 │                                              FastAPI Python ML Microservice                                                │
 │                                            (Uvicorn ASGI Server, Port 8000)                                                │
 │ ┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
 │ │ ML Inference Engine: Scikit-Learn Random Forest Ensemble (Classifier + Shortfall & Grade Regressors)                    │ │
 │ │ Telemetry Feature Engineering Pipeline: 7 Multi-Modal Interaction Indices (EETI, PMSI, HRRM, DDR, SBP, GDRF, EHP)    │ │
 │ │ Prescriptive Action Planner: Automated DGMS Operational Recovery Recommendations                                      │ │
 │ │ Synthetic Telemetry Streamer: Realistic Stochastic Sensor & Weather Event Generator                                   │ │
 │ │ Pydantic v2 Contract Validation: Strict Schema Validation, Range Checks, & Error Handling                              │ │
 │ └────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
 └────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.17.0+ (v20+ recommended)
- **Python**: v3.10+ (v3.10 - v3.12 supported)
- **Git** & **npm** / **yarn**

---

### Step 1: Clone & Configure Environment

```bash
# Clone the repository
git clone https://github.com/moil-limited/moil-predictive-intelligence.git
cd moil_project

# Create local environment configuration
cp .env.example .env.local
```

---

### Step 2: Start the Python FastAPI ML Microservice

```bash
# Create and activate Python virtual environment
# Windows (PowerShell):
python -m venv venv
.\venv\Scripts\Activate.ps1

# Linux / macOS:
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Launch FastAPI microservice (Runs on http://127.0.0.1:8000)
uvicorn app.main:app --app-dir backend --port 8000 --reload
```

*Verify ML service health:* `GET http://127.0.0.1:8000/api/v1/health`

---

### Step 3: Start the Next.js Frontend

In a separate terminal:

```bash
# Install frontend dependencies
npm install

# Start Next.js development server (Runs on http://localhost:3000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### Step 4: Run Automated Test Suites

The project features a **4-Tier Automated Test Suite** with 100% test coverage across both Node.js and Python ecosystems:

```bash
# 1. Execute all Node.js / Next.js tests (Tiers 1, 2, 4)
node tests/run_e2e_suite.js

# 2. Execute all Python / FastAPI ML tests (Tiers 1, 3, 4)
python tests/run_e2e_suite.py

# 3. Execute Pytest suite directly
pytest backend/tests/ -v
```

---

## 🛠️ Technology Stack Breakdown

| Layer | Technologies | Purpose |
|---|---|---|
| **Frontend Framework** | Next.js 14 (App Router), React 18, TypeScript 5 | Server & client rendering, streaming UI, route layouts |
| **Styling & Components** | Tailwind CSS 3.4, shadcn/ui, Lucide Icons, clsx | Industrial high-contrast dark theme, animated KPI badges |
| **Data Visualization** | Recharts 2.12 | Dual-axis telemetry trends, radar charts, risk distributions |
| **ML Microservice** | FastAPI 0.110, Uvicorn, Pydantic v2 | High-throughput asynchronous prediction endpoint |
| **Machine Learning** | Scikit-Learn 1.4, NumPy 1.26, Pandas 2.2, Joblib | Random Forest ensemble, tree variance, calibration |
| **Database & Auth** | PostgreSQL 15+, Supabase JS 2.43 | Relational schema, RLS policies, audit logs, mock repository |
| **Validation Layer** | Zod 3.23 & Pydantic v2 | Dual-tier runtime type validation and input sanitization |
| **Testing Harness** | `node:test`, `unittest`, `pytest`, `httpx` | 4-tier unit, integration, ML, and disaster simulation tests |

---

## 🧭 Application Modules & Navigation

| Route | View Name | Core Functionality |
|---|---|---|
| `/` | **Operations Command Center** | High-level executive KPIs, national shortfall risk matrix, 8-mine status grid, active alert feed. |
| `/telemetry` | **Satellite Telemetry Fusion** | Dual-axis live charts plotting precipitation vs. extraction rate, soil moisture vs. slope stability, and sensor feeds. |
| `/predictor` | **Shortfall Simulation Sandbox** | Interactive parameter sliders (rainfall, soil moisture, dumper cycle time, fleet uptime) with real-time ML inference. |
| `/map` | **Interactive GIS Mining Map** | Spatial map of the Vidarbha-Balaghat corridor, showing mine markers, hazard severity rings, and pit details. |
| `/planner` | **Corrective Action Planner** | Prescriptive mitigation cards, action status toggles, cost/tonnage recovery estimators, and shift handover exports. |

---

## 🏛️ Mining Concession Coverage (8 MOIL Mines)

1. **Balaghat Mine** (Madhya Pradesh) — Flagship deep underground manganese mine with vertical hoisting shafts.
2. **Dongri Buzurg Mine** (Maharashtra) — Large-scale opencast pit known for high-grade dioxide ore.
3. **Mansar Mine** (Maharashtra) — Historic mixed opencast/underground operation.
4. **Chikla Mine** (Maharashtra) — Deep underground operation with heavy dewatering requirements.
5. **Kandri Mine** (Maharashtra) — Mixed mine producing high-grade metallurgical ore.
6. **Gumgaon Mine** (Maharashtra) — Underground mine with semi-steep manganese ore body dipping.
7. **Tirodi Mine** (Madhya Pradesh) — Strategic opencast quarry with multi-bench stripping operations.
8. **Ukwa Mine** (Madhya Pradesh) — Underground mine in fragile hilly terrain subject to monsoon runoff.

---

## 📄 Documentation Sitemap

- [SETUP.md](./SETUP.md) — Comprehensive step-by-step local development & production setup guide.
- [ARCHITECTURE.md](./ARCHITECTURE.md) — Deep technical specification, mathematical formulas, and database ERD.
- [TEST_READY.md](./TEST_READY.md) — Test harness verification report and 4-tier coverage matrix.

---

## ⚖️ License & Intellectual Property

&copy; 2026 MOIL Limited. All rights reserved. Developed for internal operational intelligence, resource planning, and disaster mitigation management.
