# Original User Request

## Initial Request — 2026-08-25T08:52:01Z

<USER_REQUEST>
Build a predictive intelligence web application for MOIL Limited that fuses simulated satellite telemetry (rainfall, soil moisture) with equipment/geological data to predict manganese reserve shortfalls and suggest corrective actions.

Working directory: C:\Users\Panshul Saini\.gemini\antigravity\scratch\moil_project
Integrity mode: development

## Requirements

### R1. Dashboard Frontend
Build a Next.js (App Router) web dashboard with Tailwind CSS and shadcn/ui. It must visualize predicted reserves, production trends, and shortfall risks using charts (e.g., Recharts) and a mockup map interface. The UI must be responsive and professional.

### R2. Backend and Database Integration
Set up Supabase for the backend. Implement secure authentication, structured database tables for mining data (equipment, historical yields, weather mock data), and protect sensitive routes. Store secrets in environment variables and provide a `.env.example`.

### R3. AI/ML Inference Service
Create a Python FastAPI microservice that exposes an endpoint for shortfall prediction. Implement a baseline model (e.g., XGBoost or Logistic Regression) that takes tabular data (weather, equipment status) and returns a prediction, confidence score, and simulated corrective actions.

### R4. Production-Ready Code Quality
Validate and sanitize all server inputs (use Zod/Pydantic). Handle API failures, database errors, and timeouts gracefully without exposing stack traces. Include basic unit tests for core logic and clear documentation (README.md, SETUP.md, ARCHITECTURE.md).

## Acceptance Criteria

### Automated Integration Testing
- [ ] A suite of automated tests successfully runs and verifies the end-to-end flow from the Next.js API route to the FastAPI ML endpoint and the Supabase database.
- [ ] The FastAPI server starts successfully and returns a 200 OK response with a prediction JSON payload when provided valid mock input data.
- [ ] The Next.js development server builds and starts without critical errors.
- [ ] Authentication flows (sign up / log in) function correctly against the Supabase instance.
- [ ] Invalid API inputs are caught by validation (Zod/Pydantic) and return appropriate 400-level error codes rather than 500 crashes.
</USER_REQUEST>
