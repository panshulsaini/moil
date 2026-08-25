## 2026-08-25T09:02:00Z
You are Worker 3 implementing Milestone 3: Next.js App Router Web Dashboard Frontend for the MOIL Limited Predictive Intelligence Web Application.

Authoritative Project Requirements:
C:\Users\Panshul Saini\.gemini\antigravity\scratch\moil_project\ORIGINAL_REQUEST.md
Survey Specification:
C:\Users\Panshul Saini\.gemini\antigravity\scratch\moil_project\.agents\explorer_survey_frontend\analysis.md
Project Plan:
C:\Users\Panshul Saini\.gemini\antigravity\scratch\moil_project\PROJECT.md

Your Working Directory:
C:\Users\Panshul Saini\.gemini\antigravity\scratch\moil_project\.agents\worker_m3_frontend

Your Scope Ownership:
You exclusively own and write all frontend files:
`package.json`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, `next.config.mjs`, `app/` (all page routes and layouts except app/api which is already implemented), `components/` (all UI, layout, chart, and map components).

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Tasks:
1. Initialize/configure `package.json` with Next.js 14/15, React 18/19, Tailwind CSS, Lucide React (`lucide-react`), Recharts (`recharts`), clsx, tailwind-merge, class-variance-authority, zod, and types.
2. Configure `tailwind.config.ts`, `postcss.config.mjs`, `tsconfig.json`, `next.config.mjs`.
3. Create `components/ui/` styled components (Card, Button, Badge, Slider, Select, Tabs, Dialog, Alert, Table, Progress, Tooltip, Switch, Input) compatible with Tailwind CSS and shadcn/ui styling conventions.
4. Create `components/layout/` (`Sidebar.tsx`, `Header.tsx`, `MineSelector.tsx`, `ThemeToggle.tsx`, `AppShell.tsx`).
5. Configure `app/layout.tsx` with metadata, font configuration, responsive layout wrapper, and `app/globals.css` with industrial modern styling (MOIL brand accents, slate/zinc dark mode, amber/emerald/crimson risk badges).
6. Implement the 5 Complete, Interactive Dashboard Pages:
   - `app/page.tsx` (Executive Operations Center): Global reserve tonnage, current extraction rate, regional shortfall risk index, 8 MOIL mine cards grid (Balaghat, Dongri Buzurg, Mansar, Chikla, Kandri, Gumgaon, Tirodi, Ukwa) with status, active alerts feed, and rapid simulation triggers.
   - `app/telemetry/page.tsx` (Telemetry Fusion Visualizer): Multi-sensor telemetry analytics with Recharts dual-axis line/area charts (Satellite Rainfall mm/hr vs Daily Extraction MT, Radar Soil Moisture % vs Factor of Safety, Dewatering Pump Discharge GPM vs Sump Inflow), sensor health table, and real-time telemetry stream simulation toggle.
   - `app/predictor/page.tsx` (Real-Time Shortfall Simulation Sandbox): Interactive sliders for weather (Rainfall 0-150mm, Soil Moisture 0-100%, Pore Pressure 0-100kPa) and equipment (Dumpers, Excavators, Pumps, Cycle Time, Downtime). Calls `/api/predict` (with instant client-side fallback), displays shortfall probability gauge, expected tonnage loss, financial impact in ₹ Lakhs, feature contribution bar chart, and prescriptive corrective action recommendations.
   - `app/map/page.tsx` (Interactive GIS Mining Map): Visual interactive vector/SVG GIS map showing the Vidarbha-Balaghat mining corridor, 8 mine coordinates, active pit hazard zones (flood risk, slope instability), real-time fleet GPS pins, and clickable mine drilldown detail drawer.
   - `app/planner/page.tsx` (Corrective Action Planner): Action management matrix categorized by Dewatering, Haulage, Fleet, Grade Blending, and Planning. Interactive status workflow (`PROPOSED` -> `ACKNOWLEDGED` -> `EXECUTED` -> `DISMISSED`), tonnage recovery calculator, priority sorting, and 1-click DGMS-compliant shift handover export (CSV download and print view).
7. Verify all pages render cleanly without missing imports, broken dependencies, or TypeScript errors.
8. Document all components created, routes implemented, and write a comprehensive handoff report to `C:\Users\Panshul Saini\.gemini\antigravity\scratch\moil_project\.agents\worker_m3_frontend\handoff.md`.
