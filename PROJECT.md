# Project: MOIL Limited Predictive Intelligence Platform

## Overview
A comprehensive predictive intelligence and operations web application for MOIL Limited (Manganese Ore India Limited). The platform fuses simulated satellite telemetry (precipitation, radar soil moisture, runoff) with heavy equipment telematics and geological ore grades to predict manganese reserve shortfalls, calculate risk indices, and generate automated operational corrective actions.

---

## Architecture

```
                               ┌────────────────────────────────────────┐
                               │       Next.js 14+ App Router UI        │
                               │  (Tailwind CSS, shadcn/ui, Recharts)   │
                               └──────────────────┬─────────────────────┘
                                                  │
                        ┌─────────────────────────┴────────────────────────┐
                        ▼                                                  ▼
      ┌────────────────────────────────────┐             ┌───────────────────────────────────┐
      │      Next.js Route Handlers        │             │        Supabase Data Layer        │
      │       (/api/predict, /api/mines,   │             │   (PostgreSQL Schema, RLS, Seed,  │
      │        /api/equipment, /api/alerts)│             │     Dual-Mode Mock/Live Client)   │
      │       [Zod Validation Layer]       │             └───────────────────────────────────┘
      └─────────────────┬──────────────────┘
                        │ HTTP JSON Proxy (with heuristic fallback)
                        ▼
      ┌────────────────────────────────────────────────────────────────────┐
      │                   FastAPI Python ML Microservice                   │
      │             (Uvicorn ASGI Server, Port 8000, Pydantic v2)           │
      │ ┌────────────────────────────────────────────────────────────────┐ │
      │ │ ML Engine: Random Forest / Gradient Boosting + Telemetry Fusion│ │
      │ │ Synthetic Telemetry Streamer & Feature Engineering Pipeline    │ │
      │ │ Deterministic Heuristic Engine & Corrective Action Planner     │ │
      │ └────────────────────────────────────────────────────────────────┘ │
      └────────────────────────────────────────────────────────────────────┘
```

---

## Code Layout

```
moil_project/
├── ORIGINAL_REQUEST.md
├── PROJECT.md
├── TEST_INFRA.md
├── README.md
├── SETUP.md
├── ARCHITECTURE.md
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.mjs
├── tailwind.config.ts
├── postcss.config.mjs
├── src/ / app/                     # Next.js App Router
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                # Executive Operations Center
│   │   ├── telemetry/page.tsx      # Satellite Telemetry Fusion Visualizer
│   │   ├── predictor/page.tsx      # Real-Time Shortfall Simulation Sandbox
│   │   ├── map/page.tsx            # Interactive GIS Mining Map & Corridors
│   │   ├── planner/page.tsx        # Corrective Action & Dispatch Planner
│   │   └── api/                    # Route handlers with Zod validation & proxy
│   │       ├── health/route.ts
│   │       ├── predict/route.ts
│   │       ├── mines/route.ts
│   │       ├── equipment/route.ts
│   │       └── alerts/route.ts
│   ├── components/
│   │   ├── ui/                     # UI components (shadcn/ui styled)
│   │   ├── dashboard/              # KPI cards, charts, risk badges
│   │   ├── telemetry/              # Dual-axis Recharts telemetry visualizers
│   │   ├── predictor/              # Interactive parameter sliders & gauges
│   │   ├── map/                    # Vector / Leaflet GIS mine map visualizer
│   │   ├── planner/                # Mitigation action cards & export handlers
│   │   └── layout/                 # Sidebar, header, navigation bar
│   ├── lib/
│   │   ├── supabase.ts             # Resilient dual-mode mock/live Supabase client
│   │   ├── api-client.ts           # Typesafe API client with fallback heuristic
│   │   ├── types.ts                # TypeScript domain models & DTOs
│   │   ├── validation.ts           # Zod validation schemas
│   │   └── utils.ts
├── supabase/
│   ├── schema.sql                  # PostgreSQL DDL (7 tables, indexes, RLS)
│   ├── seed.sql                    # High-fidelity seed data for 8 MOIL mines
│   └── migrations/
├── backend/                        # Python FastAPI ML Microservice
│   ├── requirements.txt
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI app entrypoint & middleware
│   │   ├── config.py               # Microservice configuration
│   │   ├── schemas/                # Pydantic v2 schemas
│   │   │   ├── __init__.py
│   │   │   ├── telemetry.py
│   │   │   ├── prediction.py
│   │   │   └── corrective_action.py
│   │   ├── models/                 # ML model & heuristic predictors
│   │   │   ├── __init__.py
│   │   │   ├── predictor.py        # Random Forest / Gradient Boosting & Heuristic
│   │   │   ├── feature_engineering.py # Multi-modal interaction features
│   │   │   ├── data_generator.py   # Synthetic mine telemetry generator
│   │   │   └── corrective_engine.py# Actionable operational recommendations
│   │   └── api/                    # FastAPI routers
│   │       ├── __init__.py
│   │       ├── v1/
│   │       │   ├── predict.py
│   │       │   ├── telemetry.py
│   │       │   ├── mines.py
│   │       │   └── health.py
│   └── tests/                      # Pytest suite for ML microservice
│       ├── __init__.py
│       ├── test_schemas.py
│       ├── test_models.py
│       ├── test_features.py
│       └── test_api.py
└── tests/                          # Master E2E & Next.js test suite
    ├── unit/                       # Frontend & Zod unit tests
    ├── integration/                # Next.js API route integration tests
    └── e2e/                        # Cross-service end-to-end workflow tests
```

---

## Feature Inventory

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Python FastAPI ML Inference Engine | ML service with Random Forest/Ensemble, Pydantic v2 schemas, telemetry fusion | M1 | Survey |
| 2 | Telemetry Interaction Feature Engineering | 7 multi-modal interaction features fusing rain, soil moisture, equipment & geology | M1 | Survey |
| 3 | Prescriptive Corrective Actions Engine | Automated operational mitigation recommendations for shortfall risks | M1 | Survey |
| 4 | Synthetic Telemetry & Data Generator | Synthetic telemetry simulator for 8 MOIL mine sites with realistic noise & weather events | M1 | Survey |
| 5 | Pytest Microservice Test Suite | Comprehensive unit and integration tests for FastAPI ML engine | M1 | Survey |
| 6 | Supabase PostgreSQL Schema & RLS | 7 structured relational tables with UUIDs, indexes, constraints, and RLS policies | M2 | Survey |
| 7 | High-Fidelity MOIL Seed Data | Seed data for 8 MOIL mines (Balaghat, Dongri Buzurg, Mansar, etc.), equipment, yields | M2 | Survey |
| 8 | Resilient Dual-Mode Supabase Client | Zero-dependency mock repository fallback matching `@supabase/supabase-js` API | M2 | Survey |
| 9 | Next.js API Route Handlers | `/api/predict`, `/api/mines`, `/api/equipment`, `/api/alerts`, `/api/health` | M2 | Survey |
| 10| Zod Request & Response Validation | Runtime schema validation, sanitization, and 400-level error handling | M2 | Survey |
| 11| Next.js App Router Scaffold & Theme | Next.js 14/15, Tailwind CSS, dark/light theme, modern industrial styling | M3 | Survey |
| 12| Executive Operations Center (`/`) | KPI cards, reserve estimates, shortfall risk index, multi-mine status grid | M3 | Survey |
| 13| Telemetry Fusion Visualizer (`/telemetry`)| Recharts dual-axis charts: rainfall vs extraction, soil moisture vs slope stability | M3 | Survey |
| 14| Shortfall Predictor & Sandbox (`/predictor`)| Interactive real-time sliders for rainfall, soil moisture, fleet uptime & live ML output | M3 | Survey |
| 15| Interactive GIS Mining Map (`/map`) | Vector/GIS map of Vidarbha-Balaghat corridor, mine pins, live pit status, hazard layers | M3 | Survey |
| 16| Corrective Action Planner (`/planner`) | Operational mitigation workflows, priority dispatching, DGMS shift handover export | M3 | Survey |
| 17| 4-Tier E2E Test Suite | Automated end-to-end test suite verifying full flow Next.js -> FastAPI -> Supabase | M4 | Survey |
| 18| Production Documentation & Config | README.md, SETUP.md, ARCHITECTURE.md, .env.example with comprehensive setup guide | M5 | Survey |

---

## Milestones

| # | Milestone Name | Scope | Dependencies | Status |
|---|----------------|-------|--------------|--------|
| M1 | AI/ML Python Microservice | FastAPI service, ML predictor, synthetic telemetry, Pydantic schemas, Pytest suite | none | DONE |
| M2 | Backend Data Layer & API Routes | Supabase schema & seed, dual-mode client, Next.js API routes, Zod validation | none | DONE |
| M3 | Next.js App Router Web Dashboard | 5 rich interactive views, Tailwind/shadcn UI, Recharts, GIS Map, simulation sandbox | M1, M2 | DONE |
| M4 | Dual-Track E2E Integration & Verification | 4-Tier E2E test suite, cross-service verification, 100% test pass | M1, M2, M3 | DONE |
| M5 | Documentation & Hardening | README.md, SETUP.md, ARCHITECTURE.md, .env.example, final audit | M4 | DONE |

---

## Interface Contracts

### 1. Next.js $\rightarrow$ FastAPI ML Microservice
- **Endpoint**: `POST http://127.0.0.1:8000/api/v1/predict/shortfall`
- **Request Payload**:
  ```json
  {
    "mine_id": "string (uuid or code e.g. BALAGHAT-01)",
    "planned_tonnage": 15000.0,
    "current_extraction": 11200.0,
    "rainfall_mm_per_hr": 28.5,
    "soil_moisture_percent": 74.2,
    "pore_water_pressure_kpa": 45.0,
    "active_dumpers": 12,
    "active_excavators": 4,
    "active_pumps": 6,
    "pump_capacity_gpm": 3000.0,
    "dumper_cycle_time_min": 32.0,
    "haul_road_friction_coeff": 0.38,
    "unscheduled_downtime_hours": 3.5,
    "manganese_grade_percent": 43.5,
    "stripping_ratio": 4.8
  }
  ```
- **Response Payload**:
  ```json
  {
    "status": "success",
    "shortfall_predicted": true,
    "shortfall_probability": 0.84,
    "risk_level": "CRITICAL",
    "expected_shortfall_tonnes": 3800.0,
    "confidence_score": 0.91,
    "feature_contributions": {
      "excess_rainfall_telemetry_index": 0.42,
      "pump_moisture_saturation_index": 0.28,
      "haul_road_resistance_multiplier": 0.18,
      "equipment_health_penalty": 0.12
    },
    "corrective_actions": [
      {
        "id": "ACT-DEWATER-01",
        "category": "DEWATERING",
        "title": "Deploy Auxiliary Submersible Pumps to Sump 3",
        "description": "Increase dewatering capacity by +1500 GPM to prevent pit inundation at Balaghat underground shaft.",
        "priority": "HIGH",
        "estimated_tonnage_recovery": 1800.0,
        "action_lead_time_hours": 2.0
      }
    ],
    "timestamp": "2026-08-25T14:30:00Z"
  }
  ```

### 2. Next.js API Routes $\rightarrow$ Supabase / Mock Layer
- Tables: `mines`, `mining_equipment`, `historical_yields`, `weather_telemetry`, `shortfall_predictions`, `corrective_actions`, `audit_logs`
- Data contract: Standard typed TypeScript models matching SQL schema with UUID keys and ISO 8601 timestamps.
