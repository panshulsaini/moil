"""
Pytest fixtures and test configurations for the MOIL ML Microservice test suite.
"""

import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Ensure backend root is on sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.main import app
from app.models.predictor import PredictorManager


@pytest.fixture(scope="session")
def client() -> TestClient:
    """Provides a TestClient for FastAPI endpoints."""
    # Ensure predictor is initialized for test session
    manager = PredictorManager.get_instance()
    if not manager.ml_predictor.is_trained:
        manager.train_and_persist(n_samples=500, random_state=42)
    
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def valid_nested_payload():
    """Valid nested prediction request payload."""
    return {
        "satellite": {
            "rainfall_24h_mm": 18.5,
            "rainfall_7d_cumulative_mm": 65.0,
            "soil_moisture_pct": 42.0,
            "flood_risk_score": 15.0,
            "slope_erosion_index": 2.2,
            "pore_water_pressure_kpa": 35.0,
        },
        "equipment": {
            "fleet_availability_pct": 88.0,
            "active_excavators": 4,
            "active_dumpers": 14,
            "active_pumps": 4,
            "unscheduled_downtime_hours": 1.2,
            "dumper_cycle_time_min": 24.0,
            "dewatering_pump_capacity_m3hr": 400.0,
            "haul_road_friction_coeff": 0.42,
            "maintenance_backlog_score": 2.5,
        },
        "geology": {
            "mine_id": "MOIL-BAL-01",
            "mine_name": "Balaghat Mine",
            "sector_id": "North-Pit-B2",
            "planned_tonnage": 15000.0,
            "current_extraction": 12800.0,
            "target_grade_mn_pct": 45.0,
            "estimated_block_grade_mn_pct": 44.5,
            "stripping_ratio": 4.2,
            "ore_moisture_pct": 6.5,
        },
        "forecast_days": 7,
    }


@pytest.fixture
def valid_flat_payload():
    """Valid flattened prediction request matching Next.js frontend proxy contract."""
    return {
        "mine_id": "MOIL-DBZ-02",
        "planned_tonnage": 12000.0,
        "current_extraction": 9500.0,
        "rainfall_mm_per_hr": 2.5,
        "soil_moisture_percent": 68.0,
        "pore_water_pressure_kpa": 55.0,
        "active_dumpers": 12,
        "active_excavators": 3,
        "active_pumps": 5,
        "pump_capacity_gpm": 2500.0,
        "dumper_cycle_time_min": 32.0,
        "haul_road_friction_coeff": 0.32,
        "unscheduled_downtime_hours": 2.8,
        "manganese_grade_percent": 41.0,
        "stripping_ratio": 5.2,
    }


@pytest.fixture
def monsoon_heavy_payload():
    """Severe monsoon weather causing high shortfall risk."""
    return {
        "satellite": {
            "rainfall_24h_mm": 120.0,
            "rainfall_7d_cumulative_mm": 450.0,
            "soil_moisture_pct": 92.0,
            "flood_risk_score": 85.0,
            "slope_erosion_index": 7.8,
            "pore_water_pressure_kpa": 110.0,
        },
        "equipment": {
            "fleet_availability_pct": 58.0,
            "active_excavators": 2,
            "active_dumpers": 7,
            "active_pumps": 6,
            "unscheduled_downtime_hours": 7.5,
            "dumper_cycle_time_min": 48.0,
            "dewatering_pump_capacity_m3hr": 350.0,
            "haul_road_friction_coeff": 0.20,
            "maintenance_backlog_score": 6.5,
        },
        "geology": {
            "mine_id": "MOIL-DBZ-02",
            "mine_name": "Dongri Buzurg Mine",
            "sector_id": "South-Pit-B4",
            "planned_tonnage": 18000.0,
            "current_extraction": 8200.0,
            "target_grade_mn_pct": 40.0,
            "estimated_block_grade_mn_pct": 36.0,
            "stripping_ratio": 7.2,
            "ore_moisture_pct": 22.0,
        },
        "forecast_days": 14,
    }


@pytest.fixture
def dry_optimal_payload():
    """Ideal operating conditions with low shortfall probability."""
    return {
        "satellite": {
            "rainfall_24h_mm": 0.0,
            "rainfall_7d_cumulative_mm": 0.0,
            "soil_moisture_pct": 20.0,
            "flood_risk_score": 0.0,
            "slope_erosion_index": 1.0,
            "pore_water_pressure_kpa": 20.0,
        },
        "equipment": {
            "fleet_availability_pct": 96.0,
            "active_excavators": 6,
            "active_dumpers": 22,
            "active_pumps": 3,
            "unscheduled_downtime_hours": 0.2,
            "dumper_cycle_time_min": 18.0,
            "dewatering_pump_capacity_m3hr": 500.0,
            "haul_road_friction_coeff": 0.55,
            "maintenance_backlog_score": 1.0,
        },
        "geology": {
            "mine_id": "MOIL-BAL-01",
            "mine_name": "Balaghat Mine",
            "sector_id": "East-Pit-A1",
            "planned_tonnage": 20000.0,
            "current_extraction": 18500.0,
            "target_grade_mn_pct": 46.0,
            "estimated_block_grade_mn_pct": 46.8,
            "stripping_ratio": 3.8,
            "ore_moisture_pct": 4.0,
        },
        "forecast_days": 7,
    }
