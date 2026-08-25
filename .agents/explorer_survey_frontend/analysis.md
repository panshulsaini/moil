# MOIL Limited Predictive Intelligence Platform — Frontend Architecture & Survey

**Project**: MOIL Limited (Manganese Ore India Limited) Predictive Intelligence Web Application  
**Module**: R1 — Dashboard Frontend  
**Author**: Explorer (Frontend Architect & UX Specialist)  
**Date**: August 2026  

---

## 1. Executive Summary & Objective

MOIL Limited is India's largest producer of manganese ore, operating critical underground and opencast mining assets across Madhya Pradesh (Balaghat, Ukwa, Tirodi) and Maharashtra (Dongri Buzurg, Gumgaon, Kandri, Mansar, Chikla). Manganese mining operations are heavily impacted by monsoon precipitation, slope soil saturation, groundwater influx in deep shafts (such as Balaghat at >435m depth), and heavy machinery breakdowns.

The goal of the **Dashboard Frontend** is to deliver an industrial-grade, highly responsive, real-time command-and-control interface that fuses satellite telemetry (precipitation, soil moisture) with equipment telemetry and geological sensors to:
1. Predict manganese reserve extraction shortfalls before they disrupt supply chains.
2. Provide interactive simulation sandboxes ("What-If" scenarios) for mine managers.
3. Visualize spatial pit operations and machinery on an interactive GIS map.
4. Auto-generate ML-driven corrective action plans and dispatch schedules.

---

## 2. MOIL Mine Assets & Operational Taxonomy

The frontend models the real-world operational landscape of MOIL Limited across 8 key mine assets:

| Mine Name | State / District | Mine Type | Depth / Extent | Target Yield (MT/day) | Primary Manganese Grade | Major Operational Vulnerabilities |
|---|---|---|---|---|---|---|
| **Balaghat** | MP / Balaghat | Deep Underground | 435m+ (Deepest in Asia) | 1,200 MT | High Grade (>48% Mn, Pyrolusite) | Shaft groundwater ingress, power tripping, dewatering load |
| **Dongri Buzurg** | MH / Bhandara | Opencast (Pit) | 110m Depth | 1,450 MT | High Dioxide Grade (>78% MnO2 for EMD/batteries) | Overburden bench slope instability, haul road muddying |
| **Gumgaon** | MH / Nagpur | Underground | 280m Depth | 750 MT | High Grade (44-48% Mn) | Underground seepage, ventilation stall, haulage winze bottleneck |
| **Kandri** | MH / Nagpur | Opencast & UG | 95m / 180m | 800 MT | Medium-High Grade (42-46% Mn) | Pit flooding, excavator downtime in heavy rain |
| **Mansar** | MH / Nagpur | Opencast & UG | 85m / 160m | 650 MT | Ferro Grade (38-42% Mn) | Slope washouts, haul truck transit delays |
| **Ukwa** | MP / Balaghat | Underground | 190m Drift | 550 MT | Low-Phos High Grade (44-46% Mn, Low P) | Adit seepage, conveyor slippage, humidity |
| **Tirodi** | MP / Balaghat | Opencast (Large) | 120m Depth | 900 MT | High Grade (42-46% Mn) | Heavy haulage tyre wear, bench cracking under soil moisture |
| **Chikla** | MH / Bhandara | Underground | 220m Depth | 600 MT | High Grade (42-46% Mn) | Stope water pooling, locomotive tramming delays |

---

## 3. Technology Stack & Directory Blueprint

### 3.1 Recommended Technology Stack

- **Framework**: Next.js 14/15 with **App Router** (`app/` directory), React Server Components (RSC) for fast shell rendering and Client Components (`"use client"`) for dynamic charts, maps, and sliders.
- **Styling**: Tailwind CSS v3.4+ with custom mining theme extensions (slate/zinc dark palette with manganese purple, extraction emerald, warning amber, and danger crimson).
- **UI Components**: Radix UI primitives / shadcn/ui pattern (accessible, unstyled headless components with Tailwind styling).
- **Icons**: `lucide-react` (clean, comprehensive industrial and mining icons: `Layers`, `Pickaxe`, `Droplets`, `Activity`, `Gauge`, `AlertTriangle`, `Truck`, `Cpu`, `FileSpreadsheet`, `TrendingDown`).
- **Data Visualization**: `recharts` (AreaChart, LineChart, BarChart, ResponsiveContainer, RadarChart, ComposedChart, Tooltip, Legend).
- **Geospatial & Map**: Interactive Custom SVG / HTML5 Canvas / Leaflet GIS Map Component with geospatial coordinate projection for the Vidarbha-Balaghat manganese belt, displaying pit boundaries, sector hazard heatmaps, and live machinery beacons.
- **State Management & Data Fetching**: Lightweight React Hooks (`useState`, `useReducer`, `useMemo`, `useCallback`) + custom SWR/fetcher hooks with built-in instant Mock Fallback Provider.
- **Validation**: `zod` for parsing simulation inputs, telemetry streams, and API contracts.

### 3.2 Frontend Directory Structure

```
frontend/
├── app/
│   ├── layout.tsx                  # Root layout: ThemeProvider, Nav, Global Header
│   ├── page.tsx                    # Landing / Executive Overview Dashboard (Route: /)
│   ├── telemetry/
│   │   └── page.tsx                # Telemetry Fusion Visualizer (Route: /telemetry)
│   ├── predictor/
│   │   └── page.tsx                # Reserve Shortfall Predictor & Sandbox (Route: /predictor)
│   ├── map/
│   │   └── page.tsx                # Interactive Mining GIS Map (Route: /map)
│   ├── planner/
│   │   └── page.tsx                # Corrective Action Planner & Reports (Route: /planner)
│   ├── settings/
│   │   └── page.tsx                # Configuration & API Health (Route: /settings)
│   ├── auth/
│   │   └── login/
│   │       └── page.tsx            # Supabase Auth Login Screen
│   ├── globals.css                 # Tailwind directives, CSS variables & scrollbars
│   └── favicon.ico
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx             # Collapsible primary navigation sidebar
│   │   ├── Topbar.tsx              # Top bar with active mine selector & telemetry status
│   │   ├── MineSelector.tsx        # Global dropdown: All Mines | Balaghat | Dongri Buzurg...
│   │   └── TelemetryTicker.tsx     # Real-time satellite alert ribbon
│   ├── dashboard/
│   │   ├── KpiCard.tsx             # Metric card with delta indicators & sparklines
│   │   ├── MineOverviewGrid.tsx    # Card grid of all 8 MOIL mines with risk badges
│   │   ├── ShortfallRiskMatrix.tsx  # Multi-factor matrix (Rainfall x Moisture x Equipment)
│   │   ├── LiveAlertFeed.tsx       # Real-time sensor anomaly alerts
│   │   └── QuickActionBanner.tsx   # Fast dispatch triggers
│   ├── telemetry/
│   │   ├── RainfallYieldChart.tsx  # Dual-axis Area/Bar chart (Rainfall mm vs Yield MT)
│   │   ├── SoilMoistureGauge.tsx   # Moisture % radial/bar gauges for pit slopes
│   │   ├── PorePressureTrend.tsx   # Underground piezometer & geological sensor stream
│   │   ├── SensorNodeTable.tsx     # Table of IoT sensor nodes, battery, signal, status
│   │   └── WeatherSatelliteCard.tsx# Simulated satellite radar overlay & forecast
│   ├── predictor/
│   │   ├── SimulationSliders.tsx   # Interactive controls (Rainfall, Moisture, Fleet, Pumps)
│   │   ├── PredictionGauge.tsx     # Shortfall MT & Risk Index percentage dial
│   │   ├── FeatureImportance.tsx   # Shapley / Waterfall chart of risk drivers
│   │   ├── ScenarioCompare.tsx     # Side-by-side baseline vs simulated scenario
│   │   └── ModelConfidenceBadge.tsx# Fast ML inference latency and confidence score
│   ├── map/
│   │   ├── MiningGisMap.tsx        # Central India MOIL corridor interactive map
│   │   ├── MinePitDetailModal.tsx  # Bench-level zoom modal for selected mine pit
│   │   ├── MachineryTracker.tsx    # Live equipment markers (Excavator, Dumper, Pump)
│   │   └── HazardOverlayToggle.tsx # Layer switches (Rainfall radar, Slope risk, Flood zone)
│   ├── planner/
│   │   ├── RecommendedActions.tsx  # ML-prioritized mitigation card list
│   │   ├── DispatchScheduler.tsx   # Interactive truck/pump reallocation table
│   │   ├── MaintenanceTickets.tsx  # Preventive work order tracker
│   │   └── ExportReportModal.tsx   # PDF / CSV shift handover export dialog
│   └── ui/                         # shadcn/ui accessible components
│       ├── button.tsx
│       ├── card.tsx
│       ├── badge.tsx
│       ├── slider.tsx
│       ├── tabs.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── select.tsx
│       ├── table.tsx
│       ├── tooltip.tsx
│       ├── switch.tsx
│       ├── progress.tsx
│       └── alert.tsx
├── lib/
│   ├── types/
│   │   └── index.ts                # TypeScript interfaces for all MOIL models
│   ├── services/
│   │   ├── apiClient.ts            # Dual-mode API client (FastAPI + Supabase + Mock)
│   │   ├── mockData.ts             # Deterministic high-fidelity dataset for 8 mines
│   │   └── simulationEngine.ts     # Client-side heuristic ML engine for instant sandbox
│   ├── supabase/
│   │   ├── client.ts               # Supabase browser client
│   │   └── server.ts               # Supabase server-side helper
│   ├── utils.ts                    # cn() classnames merger, formatters (MT, mm, INR)
│   └── constants.ts                # Mine metadata, thresholds, color tokens
└── hooks/
    ├── useMineFilter.ts            # Selected mine context / state
    ├── useSimulation.ts            # Predictor sandbox state and calculation hook
    ├── useTelemetryLive.ts         # Live tick/interval simulator for telemetry
    └── useAuth.ts                  # Supabase session / demo user hook
```

---

## 4. Comprehensive Specification of 5 Core Interactive Views

### 4.1 View 1: Executive Overview & KPI Operations Center (`/`)
- **Header Summary**:
  - Global Manganese Reserve Estimated: **94.2 Million MT** across MOIL concessions.
  - Today's Extraction Target: **6,900 MT** | Current Extracted: **5,420 MT** (78.5% of target).
  - Shortfall Risk Index: **34.2% (Moderate / Caution)** — Flagged primarily at Dongri Buzurg (Heavy Rain) & Balaghat (Dewatering Surge).
  - Active Telemetry Nodes: **142 / 148 Online (95.9%)**.
- **Visual Components**:
  1. `KpiCard` Quartet:
     - *Total Target vs Actual Extraction*: Value with progress bar, daily run rate, delta vs 7-day average.
     - *Shortfall Risk Index*: Dynamic badge (Low: <20%, Moderate: 20-50%, High: 50-75%, Critical: >75%) with warning pulse.
     - *Satellite Weather Index*: Active rainfall alert across Balaghat & Bhandara sectors (current max 42 mm/hr).
     - *Fleet Availability & Uptime*: 86.4% active haulers and excavators.
  2. `MineOverviewGrid`:
     - 8 interactive cards for Balaghat, Dongri Buzurg, Gumgaon, Kandri, Mansar, Ukwa, Tirodi, Chikla.
     - Each card displays: Mine Type icon, Current Daily Yield vs Target (MT), Soil Moisture %, Rainfall (mm/hr), Risk Badge, and a "Simulate / Inspect" button.
  3. `ShortfallRiskMatrix`:
     - Bubble/Heat matrix mapping Environmental Severity vs Fleet Vulnerability across mines.
  4. `LiveAlertFeed`:
     - Chronological stream of telemetry triggers (e.g., *"14:15 - Balaghat Shaft #2 Piezometer reading >420 kPa — Dewatering pump auto-boost activated"*).

### 4.2 View 2: Telemetry Fusion Visualizer (`/telemetry`)
- **Purpose**: Correlate external satellite weather telemetry with in-situ geotechnical sensors and historical extraction yield to reveal causal degradation patterns.
- **Visual Components**:
  1. `RainfallYieldChart`:
     - Recharts `ComposedChart`: Left Y-axis has stacked/smooth Area for Satellite Rainfall (mm/hr) and 24h Cumulative Precipitation (mm). Right Y-axis has Bar/Line for Manganese Ore Extraction (MT) and Ore Grade (% Mn).
     - Range filters: Last 24 Hours, 7 Days, 30 Days, Monsoon Seasonal Trend.
  2. `SoilMoistureGauge` & Slope Stability Panel:
     - Overburden bench soil moisture % vs Factor of Safety ($FOS$) threshold ($FOS < 1.3$ triggers automated pit evacuation alert).
  3. `PorePressureTrend`:
     - Time-series multi-line chart tracking piezometric pore pressure (kPa) across underground drill stations (Balaghat Shaft 1, Shaft 2, Ukwa Adit 3).
  4. `SensorNodeTable`:
     - Searchable and filterable data table of in-situ telemetry stations: Node ID, Location/Mine, Sensor Type (TDR Soil Moisture, Ultrasonic Piezometer, Rain Gauge, Inclinometer), Battery Voltage, Last Ping, RSSI Signal, Status (Normal, Warning, Fault).
  5. `WeatherSatelliteCard`:
     - Live Doppler/satellite precipitation cloud simulation with wind vector overlays over the Nagpur-Balaghat coordinate box.

### 4.3 View 3: Reserve Shortfall Predictor & Simulation Sandbox (`/predictor`)
- **Purpose**: Real-time interactive sandbox allowing mine superintendents and planners to tweak environmental and operational parameters and immediately view ML predictions for reserve extraction shortfalls.
- **Interactive Control Sliders** (`SimulationSliders`):
  1. *Satellite Rainfall Forecast*: `0 mm/hr` to `100 mm/hr` (with quick monsoon storm presets: Clear, Light Drizzle, Heavy Monsoon, Cloudburst).
  2. *Overburden Soil Moisture*: `5%` to `60%` (Critical slope threshold at 42%).
  3. *Haul Truck Fleet Operational Rate*: `20%` to `100%` active dumpers.
  4. *Excavator / Shovel Efficiency*: `30%` to `100%`.
  5. *Dewatering Pump Capacity*: `500 m³/hr` to `5,000 m³/hr`.
  6. *Ore Grade Cutoff Threshold*: `25% Mn` to `48% Mn`.
- **Live Output Gauges & Metrics**:
  - **Predicted Reserve Shortfall**: e.g., `420 MT/day` (Confidence: 94.8%, Latency: 18ms via FastAPI / instant heuristic).
  - **Shortfall Financial Impact Estimate**: Calculated in Lakhs INR ($Shortfall \times AvgPricePerMT$).
  - **Risk Severity Score**: Circular SVG progress gauge (0 to 100 with color gradient transition from emerald to crimson).
  - **Feature Importance / Shapley Waterfall Chart**: Bar breakdown showing which factors contributed most to the predicted shortfall (+45% Rainfall, +30% Soil Moisture, +15% Truck Downtime, -10% Dewatering Mitigation).
  - **"What-If" Scenario Compare Mode**: Ability to snapshot Scenario A vs Scenario B and view delta in shortfall MT side-by-side.

### 4.4 View 4: Interactive Mining GIS Map View (`/map`)
- **Purpose**: High-context spatial visualization of MOIL mining geography across the Maharashtra-Madhya Pradesh border corridor with live pit status and equipment beacons.
- **Geographic Scope**:
  - Center: $21.5^\circ N, 79.5^\circ E$ (Nagpur - Bhandara - Balaghat belt).
  - Accurate relative coordinates for all 8 mines:
    * Balaghat ($21.81^\circ N, 80.18^\circ E$)
    * Dongri Buzurg ($21.56^\circ N, 79.71^\circ E$)
    * Gumgaon ($21.38^\circ N, 78.98^\circ E$)
    * Kandri ($21.42^\circ N, 79.27^\circ E$)
    * Mansar ($21.39^\circ N, 79.28^\circ E$)
    * Ukwa ($21.96^\circ N, 80.47^\circ E$)
    * Tirodi ($21.68^\circ N, 79.72^\circ E$)
    * Chikla ($21.55^\circ N, 79.75^\circ E$)
- **Map Features**:
  1. Vector / Satellite styled base layer with high-contrast topographic contours.
  2. Mine Pit Markers with live pulsing risk aura (Green = Normal, Amber = Elevated Risk, Red = Active Hazard).
  3. Interactive Marker Click: Opens `MinePitDetailModal` showing 3D/2D bench layout, active excavator icons, haul road telemetry, and active dewatering pumps.
  4. Layer Toggles (`HazardOverlayToggle`):
     - *Satellite Precipitation Heatmap*
     - *Overburden Slope Failure Risk Zone*
     - *Active Haulage Fleet GPS Locations*
     - *Underground Shaft Entrances & Vent Pits*
  5. Search & Filter Bar: Filter by Mine, Machinery Type, or Hazard Level.

### 4.5 View 5: Corrective Action Planner (`/planner`)
- **Purpose**: Transform ML shortfall predictions into actionable, DGMS (Directorate General of Mines Safety) compliant operational workflows.
- **Visual Components**:
  1. `RecommendedActions` (ML-Generated Action Queue):
     - Prioritized by urgency (Immediate, Next Shift, Planned 24h).
     - Examples:
       * *Action #1*: "Divert 4x 35-tonne haul trucks from Flooded Bench 3 at Dongri Buzurg to Dry High-Wall Sector 1 to recover 280 MT/day."
       * *Action #2*: "Activate Auxiliary Submersible Dewatering Pump P-04 at Balaghat Shaft #2 to avert 6-hour extraction stoppage."
       * *Action #3*: "Switch blending ratio at Mansar Crusher to incorporate lower moisture stockpile ore."
     - Status workflow: `Pending Review` -> `Approved & Dispatched` -> `Completed`.
  2. `DispatchScheduler`:
     - Visual Gantt / Shift Allocation table assigning operators, dumpers, and pumps to recovery sectors.
  3. `MaintenanceTickets`:
     - Preventive maintenance trigger list generated from sensor degradation data (e.g., "Excavator EX-102 hydraulic temperature 88°C - schedule seal check").
  4. `ExportReportModal`:
     - 1-click generation of exportable Shift Handover & Production Assurance Report in PDF / CSV format with full telemetry audit trail.

---

## 5. UI/UX Design System & Theme Tokens

### 5.1 Industrial Dark & High-Contrast Theme

Mining control centers operate in varying lighting conditions and require high legibility for safety-critical indicators. The theme uses deep slate neutral tones with vibrant functional status colors:

```css
:root {
  --background: 222.2 84% 4.9%;         /* Deep Industrial Slate #0B0F17 */
  --foreground: 210 40% 98%;           /* High-contrast Crisp White */
  --card: 222.2 84% 7.5%;               /* Elevated Card Surface #131B2A */
  --card-foreground: 210 40% 98%;
  --popover: 222.2 84% 7.5%;
  --popover-foreground: 210 40% 98%;
  --primary: 263.4 70% 50.4%;           /* Manganese Purple #8B5CF6 */
  --primary-foreground: 210 40% 98%;
  --secondary: 217.2 32.6% 17.5%;       /* Secondary Steel Slate #1E293B */
  --secondary-foreground: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;  /* Slate Gray #94A3B8 */
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 84.2% 60.2%;         /* Critical Danger Crimson #EF4444 */
  --destructive-foreground: 210 40% 98%;
  --border: 217.2 32.6% 20%;            /* Crisp structural borders */
  --input: 217.2 32.6% 20%;
  --ring: 263.4 70% 50.4%;
  
  /* Custom Operational Colors */
  --color-manganese: #8B5CF6;           /* Manganese Ore Violet */
  --color-extraction: #10B981;          /* On-Target Yield Emerald */
  --color-warning: #F59E0B;             /* Caution Amber */
  --color-hazard: #EF4444;              /* High Shortfall Crimson */
  --color-telemetry: #06B6D4;           /* Satellite Cyan */
  --color-moisture: #3B82F6;            /* Hydro Blue */
}
```

### 5.2 Responsive & Accessibility Rules
- **Breakpoints**: Optimized for 1920x1080 / 1440x900 Control Room multi-monitors, down to 1024px tablets (mine site supervisors on rugged tablets) and mobile viewports.
- **ARIA & Accessibility**: Full keyboard navigation on sliders, accessible color contrast ratios exceeding WCAG AA (4.5:1), and semantic HTML (`<main>`, `<nav>`, `<aside>`, `<section>`, `<article>`).

---

## 6. TypeScript Data Models & Contract Specifications

The application uses strict TypeScript types across telemetry, predictions, simulation, and mine assets:

```typescript
// /lib/types/index.ts

export type MineId = 
  | 'balaghat' 
  | 'dongri_buzurg' 
  | 'gumgaon' 
  | 'kandri' 
  | 'mansar' 
  | 'ukwa' 
  | 'tirodi' 
  | 'chikla';

export type MineType = 'Underground' | 'Opencast' | 'Mixed';

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export interface MineSite {
  id: MineId;
  name: string;
  district: string;
  state: 'Madhya Pradesh' | 'Maharashtra';
  type: MineType;
  coordinates: {
    lat: number;
    lng: number;
  };
  targetDailyYieldMT: number;
  currentDailyYieldMT: number;
  totalReserveEstimatedMT: number;
  primaryGrade: string; // e.g. "48% Mn Pyrolusite"
  currentRainfallMmHr: number;
  soilMoisturePercent: number;
  porePressureKpa: number;
  fleetUptimePercent: number;
  shortfallRiskScore: number; // 0 - 100
  riskLevel: RiskLevel;
  activeAlertCount: number;
}

export interface TelemetryReading {
  timestamp: string; // ISO-8601
  mineId: MineId;
  rainfallMmHr: number;
  rainfall24hCumulativeMm: number;
  soilMoisturePercent: number;
  porePressureKpa: number;
  ambientTempC: number;
  haulRoadFrictionIndex: number; // 0.0 to 1.0
  yieldExtractedMT: number;
  oreGradePercent: number;
}

export interface SimulationParameters {
  mineId: MineId | 'all';
  rainfallMmHr: number;
  soilMoisturePercent: number;
  fleetUptimePercent: number;
  excavatorEfficiencyPercent: number;
  dewateringPumpCapacityM3Hr: number;
  oreGradeCutoffPercent: number;
}

export interface ShortfallPredictionResult {
  predictedShortfallMT: number;
  shortfallPercentage: number;
  riskScore: number; // 0 - 100
  riskLevel: RiskLevel;
  estimatedFinancialImpactINR: number;
  confidenceScore: number; // 0.0 to 1.0
  inferenceLatencyMs: number;
  featureContributions: {
    feature: string;
    contributionPercent: number;
    impactDirection: 'positive' | 'negative';
  }[];
  timestamp: string;
}

export interface CorrectiveAction {
  id: string;
  mineId: MineId;
  title: string;
  description: string;
  urgency: 'immediate' | 'high' | 'medium' | 'low';
  estimatedRecoveryMT: number;
  assignedTo: string;
  status: 'pending' | 'in_progress' | 'completed' | 'dismissed';
  suggestedAt: string;
  category: 'fleet_reroute' | 'dewatering_boost' | 'grade_blending' | 'slope_stabilization';
}
```

---

## 7. Service Layer & API Integration Architecture

The frontend is architected with a **Dual-Mode Resilient API Client** (`/lib/services/apiClient.ts`):

```
┌────────────────────────────────────────────────────────────┐
│                    Next.js Frontend Components             │
└─────────────────────────────┬──────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  API Client Layer │
                    └────┬─────────┬────┘
                         │         │
          FastAPI Live?  │         │  Offline / Demo Mode?
       ┌─────────────────┘         └──────────────────┐
       ▼                                              ▼
┌───────────────────────────┐             ┌───────────────────────────┐
│ FastAPI Microservice      │             │ Built-in Simulation Engine│
│ POST /predict             │             │ & Deterministic Mock Data │
│ Supabase Auth & Postgres  │             │ (Instant, Zero Latency)   │
└───────────────────────────┘             └───────────────────────────┘
```

1. **FastAPI ML Integration**:
   - Client sends `SimulationParameters` to `POST http://localhost:8000/api/v1/predict/shortfall`.
   - Returns structured `ShortfallPredictionResult`.
   - If FastAPI server is unavailable or returns non-200, client automatically falls back to `simulationEngine.ts` with zero UI crash.
2. **Supabase Integration**:
   - `client.ts` initializes `@supabase/supabase-js` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   - Handles login, session management, and querying live `mine_telemetry` and `corrective_actions` tables.
   - Demo mode auto-authenticates as a "Senior Mine Manager" for testing without requiring external credentials.
3. **Mock Data Provider**:
   - Generates 30 days of hourly historical data for all 8 mines.
   - Accurately models monsoon spikes (June-September rainfall surges), soil moisture saturation hysteresis, and pump failure modes.

---

## 8. Package Dependencies & Setup Specification

### 8.1 `package.json` Specification

```json
{
  "name": "moil-predictive-intelligence-dashboard",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run"
  },
  "dependencies": {
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-progress": "^1.0.3",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-slider": "^1.1.2",
    "@radix-ui/react-switch": "^1.0.3",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-tooltip": "^1.0.7",
    "@supabase/auth-helpers-nextjs": "^0.9.0",
    "@supabase/supabase-js": "^2.39.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "lucide-react": "^0.344.0",
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "recharts": "^2.12.0",
    "tailwind-merge": "^2.2.1",
    "tailwindcss-animate": "^1.0.7",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.3.3"
  }
}
```

### 8.2 Build & Verification Checklist
1. `npm install` runs cleanly without dependency clashes.
2. `npm run build` generates optimized static & dynamic App Router route handlers.
3. Zero TypeScript compile errors (`tsc --noEmit`).
4. Instant interactive feedback on simulation sliders (< 16ms render loop).
5. All 5 core navigation tabs render their respective operational views with full responsiveness.

---

## 9. Next Steps for Implementation

The frontend implementer agent should follow this sequenced blueprint:
1. Initialize Next.js App Router project structure with Tailwind, Lucide, and Recharts.
2. Implement `/lib/types`, `/lib/constants`, and `/lib/services/mockData.ts`.
3. Build the core layout (`Sidebar`, `Topbar`, `MineSelector`, `TelemetryTicker`).
4. Implement the 5 views:
   - `app/page.tsx` (Executive Dashboard & KPIs)
   - `app/telemetry/page.tsx` (Telemetry Fusion Visualizer)
   - `app/predictor/page.tsx` (Shortfall Predictor & Simulation Sandbox)
   - `app/map/page.tsx` (Interactive Central India Mining GIS Map)
   - `app/planner/page.tsx` (Corrective Action Planner)
5. Wire dual-mode API client to connect to FastAPI microservice and Supabase backend.
6. Verify end-to-end user workflows, responsiveness, and dark-theme contrast.
