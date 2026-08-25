# MOIL Limited — Local Development & Deployment Guide (SETUP.md)

This guide provides comprehensive, step-by-step setup instructions for running, developing, and testing the **MOIL Limited Predictive Intelligence Web Application** on **Windows**, **Linux**, and **macOS**.

---

## 📋 System Prerequisites

Ensure the following runtimes and tools are installed on your host system:

| Prerequisite | Minimum Version | Recommended Version | Verification Command |
|---|---|---|---|
| **Node.js** | `v18.17.0` | `v20.14.0` LTS | `node --version` |
| **npm** | `v9.0.0` | `v10.0.0+` | `npm --version` |
| **Python** | `3.10.0` | `3.11.x` | `python --version` (or `python3 --version`) |
| **pip** | `22.0.0` | Latest | `pip --version` |
| **Git** | `2.30.0` | Latest | `git --version` |

---

## 🚀 Step-by-Step Installation

```
moil_project/
├── backend/          # Python FastAPI ML Microservice (Port 8000)
├── app/              # Next.js 14 App Router Frontend & API Handlers (Port 3000)
├── supabase/         # PostgreSQL Schema & Seed SQL files
└── tests/            # Multi-tier automated test suites
```

---

### Step 1: Clone Repository & Configure Environment

Clone the repository and prepare the local environment file:

```bash
git clone https://github.com/moil-limited/moil-predictive-intelligence.git
cd moil_project

# Copy sample configuration to .env.local
cp .env.example .env.local
```

---

### Step 2: Set Up Python AI/ML Microservice

The AI/ML microservice is built with **FastAPI**, **Scikit-Learn**, and **Pydantic v2**.

#### 2.1. Create and Activate Virtual Environment

##### Windows (PowerShell):
```powershell
python -m venv venv
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\venv\Scripts\Activate.ps1
```

##### Windows (Command Prompt):
```cmd
python -m venv venv
venv\Scripts\activate.bat
```

##### Linux / macOS:
```bash
python3 -m venv venv
source venv/bin/activate
```

#### 2.2. Install Python Dependencies

```bash
pip install --upgrade pip
pip install -r backend/requirements.txt
```

#### 2.3. Start the FastAPI ML Microservice

```bash
uvicorn app.main:app --app-dir backend --port 8000 --reload
```

The ML microservice will start at `http://127.0.0.1:8000`.

##### Verification:
- **Health Check**: [http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health)
- **Interactive Swagger Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc Documentation**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

### Step 3: Set Up Next.js Frontend Dashboard

In a new terminal window (with project root `moil_project` as the working directory):

#### 3.1. Install Node.js Dependencies

```bash
npm install
```

#### 3.2. Start Next.js Development Server

```bash
npm run dev
```

The Next.js web application will start at `http://localhost:3000`.

##### Verification:
- Open your browser and navigate to [http://localhost:3000](http://localhost:3000).
- Check API health endpoint: [http://localhost:3000/api/health](http://localhost:3000/api/health).

---

## 🗄️ Database Configuration: Live Supabase vs. Offline Mock Mode

The platform features a **Resilient Dual-Mode Data Layer** allowing development without external network dependencies.

### Option A: Seamless Built-in Offline Mock Mode (Default)
No database setup or internet connection is required. When using placeholder values in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-anon-key-moil-2026
NEXT_PUBLIC_USE_MOCK_DATA=true
```
The application activates its built-in in-memory repository, populated with complete records for all 8 MOIL mines, machinery assets, yields, and weather feeds.

---

### Option B: Live Supabase PostgreSQL Connection

To connect to a live Supabase PostgreSQL instance:

1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in the Supabase Dashboard.
3. Run the schema creation script from `supabase/schema.sql`.
4. Run the seed data script from `supabase/seed.sql`.
5. Update your `.env.local` with your project credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   NEXT_PUBLIC_USE_MOCK_DATA=false
   USE_MOCK_DATA=false
   ```
6. Restart the Next.js server (`npm run dev`).

---

## 🧪 Executing the Automated Test Suites

The project is protected by a multi-runtime **4-Tier Automated Test Suite**.

### 1. Execute All Node.js / Next.js Test Suites (Tiers 1, 2, 4)
```bash
node tests/run_e2e_suite.js
```
*Coverage*:
- **Tier 1**: Zod Schema Validation & Boundary Analysis (`tests/unit/validation.test.js`)
- **Tier 1**: Mathematical Heuristics Monotonicity (`tests/unit/math_heuristics.test.js`)
- **Tier 1**: In-Memory Mock Supabase Query Engine (`tests/unit/mock_db.test.js`)
- **Tier 2**: Next.js API Route Handlers (`tests/integration/nextjs_api_routes.test.js`)
- **Tier 2**: FastAPI Proxy Resilience & Fallback (`tests/integration/proxy_resilience.test.js`)
- **Tier 2**: Database Mutations & Audit Logging (`tests/integration/db_mutations.test.js`)
- **Tier 4**: Cross-Service E2E Data Pipeline (`tests/e2e/e2e_pipeline.test.js`)
- **Tier 4**: Regional Disaster Simulation across 8 Mines (`tests/e2e/disaster_simulation.test.js`)

---

### 2. Execute All Python / FastAPI ML Test Suites (Tiers 1, 3, 4)
```bash
python tests/run_e2e_suite.py
```
*Coverage*:
- **Tier 1**: Pydantic v2 Schema Range Checks (`tests/unit/pydantic_schemas.test.py`)
- **Tier 3**: Feature Engineering & Interaction Formulas (`tests/ml_service/test_feature_engineering.py`)
- **Tier 3**: Model Accuracy & Sub-100ms Latency Budget (`tests/ml_service/test_model_performance.py`)
- **Tier 3**: Prescriptive Corrective Actions Engine (`tests/ml_service/test_corrective_engine.py`)
- **Tier 3**: FastAPI REST Endpoints & Health Probe (`tests/ml_service/test_inference_endpoints.py`)
- **Tier 4**: Cross-Service Telemetry to Alert Lifecycle (`tests/e2e/test_telemetry_to_alert.py`)

---

### 3. Direct Pytest Execution
```bash
pytest backend/tests/ -v
# or
pytest tests/ -v
```

---

## 🛠️ Production Build & Containerization

### Building Next.js for Production

```bash
# Build optimized Next.js bundle
npm run build

# Start production server
npm run start
```

### Running with Production ASGI Server

```bash
uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000 --workers 4
```

---

## 🔍 Troubleshooting & FAQs

### 1. PowerShell Script Execution Error (Windows)
**Error**: `File Activate.ps1 cannot be loaded because running scripts is disabled on this system.`  
**Solution**: Run PowerShell as Administrator and execute:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

### 2. Port Collisions (Port 3000 or 8000 in use)
**Error**: `EADDRINUSE: address already in use :::3000` or `[Errno 10048] address in use`  
**Solution**: Specify alternative ports in command lines and `.env.local`:
```bash
# For Next.js:
npm run dev -- -p 3001

# For FastAPI:
uvicorn app.main:app --app-dir backend --port 8001
```
Update `FASTAPI_URL=http://127.0.0.1:8001` in `.env.local`.

### 3. What happens if the Python ML microservice is stopped?
The Next.js API layer is built with an automatic **deterministic heuristic fallback engine** (`calculateHeuristicPrediction`). If the FastAPI service is offline, queries to `/api/predict` or the frontend simulation sandbox will continue operating seamlessly with calibrated risk estimates and corrective actions without 500 error crashes.

### 4. Linux Missing Python Header Packages
**Error**: `error: command 'gcc' failed with exit status 1` during `scikit-learn` or `numpy` installation.  
**Solution**: Install system build dependencies:
```bash
# Debian / Ubuntu:
sudo apt-get update && sudo apt-get install -y build-essential python3-dev

# Fedora / RHEL:
sudo dnf install -y gcc gcc-c++ python3-devel
```

---

## 📞 Support & Operations Contact

For internal technical support within MOIL Limited:
- **Department**: Central Mining Intelligence & IT Operations Division
- **Location**: MOIL Bhawan, 1A Katol Road, Nagpur - 440013, Maharashtra, India
