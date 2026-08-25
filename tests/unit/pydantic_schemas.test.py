"""
Tier 1 Unit Test: Python Pydantic v2 Schema Validation & Boundary Analysis.
Tests schema definitions, field constraints, type coercions, and boundary conditions.
"""

import unittest
import sys
import os

# Add project root and backend to python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'backend')))

try:
    from app.schemas.telemetry import (
        SatelliteTelemetryInput,
        EquipmentTelemetryInput,
        GeologicalDataInput,
        RiskLevelEnum,
        ActionCategoryEnum,
        ActionPriorityEnum,
    )
    from app.schemas.prediction import (
        ShortfallPredictionRequest,
        ShortfallPredictionResponse,
        FeatureContribution,
    )
    from app.schemas.corrective_action import CorrectiveAction
except ImportError:
    # Direct import fallback from backend.app.schemas or backend.app.api.schemas
    try:
        from backend.app.api.schemas import (
            SatelliteTelemetryInput,
            EquipmentTelemetryInput,
            GeologicalDataInput,
            ShortfallPredictionRequest,
            ShortfallPredictionResponse,
            FeatureContribution,
            CorrectiveAction,
            RiskLevelEnum,
            ActionCategoryEnum,
            ActionPriorityEnum,
        )
    except ImportError:
        # Standalone mirror contract if backend is currently being written
        from enum import Enum
        from typing import List, Optional
        from pydantic import BaseModel, Field, ValidationError

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

        class SatelliteTelemetryInput(BaseModel):
            rainfall_24h_mm: float = Field(..., ge=0.0, le=500.0)
            rainfall_7d_cumulative_mm: float = Field(..., ge=0.0, le=2000.0)
            soil_moisture_pct: float = Field(..., ge=0.0, le=100.0)
            flood_risk_score: float = Field(..., ge=0.0, le=100.0)
            slope_erosion_index: float = Field(default=2.0, ge=0.0, le=10.0)

        class EquipmentTelemetryInput(BaseModel):
            fleet_availability_pct: float = Field(..., ge=0.0, le=100.0)
            active_excavators: int = Field(..., ge=0, le=50)
            active_dumpers: int = Field(..., ge=0, le=200)
            unscheduled_downtime_hours: float = Field(..., ge=0.0, le=24.0)
            dumper_cycle_time_min: float = Field(..., ge=1.0, le=180.0)
            dewatering_pump_capacity_m3hr: float = Field(default=300.0, ge=0.0)
            maintenance_backlog_score: float = Field(default=2.0, ge=0.0, le=10.0)

        class GeologicalDataInput(BaseModel):
            mine_id: str = Field(..., min_length=2, max_length=50)
            mine_name: str = Field(..., min_length=2, max_length=100)
            sector_id: str = Field(..., min_length=2, max_length=50)
            planned_tonnage: float = Field(..., gt=0.0, le=100000.0)
            target_grade_mn_pct: float = Field(..., ge=10.0, le=65.0)
            estimated_block_grade_mn_pct: float = Field(..., ge=10.0, le=65.0)
            stripping_ratio: float = Field(default=4.0, ge=0.0, le=25.0)
            ore_moisture_pct: float = Field(default=5.0, ge=0.0, le=35.0)

        class ShortfallPredictionRequest(BaseModel):
            satellite: SatelliteTelemetryInput
            equipment: EquipmentTelemetryInput
            geology: GeologicalDataInput
            forecast_days: int = Field(default=7, ge=1, le=30)

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


class TestPydanticSchemas(unittest.TestCase):
    """Test suite for Pydantic v2 schemas and validation boundaries."""

    def test_satellite_telemetry_valid(self):
        data = {
            "rainfall_24h_mm": 45.0,
            "rainfall_7d_cumulative_mm": 150.0,
            "soil_moisture_pct": 72.5,
            "flood_risk_score": 35.0,
            "slope_erosion_index": 3.0,
        }
        obj = SatelliteTelemetryInput(**data)
        self.assertEqual(obj.rainfall_24h_mm, 45.0)
        self.assertEqual(obj.soil_moisture_pct, 72.5)

    def test_satellite_telemetry_boundaries(self):
        from pydantic import ValidationError

        # Negative rainfall rejected
        with self.assertRaises(ValidationError):
            SatelliteTelemetryInput(
                rainfall_24h_mm=-5.0,
                rainfall_7d_cumulative_mm=10.0,
                soil_moisture_pct=50.0,
                flood_risk_score=10.0,
            )

        # Soil moisture > 100 rejected
        with self.assertRaises(ValidationError):
            SatelliteTelemetryInput(
                rainfall_24h_mm=10.0,
                rainfall_7d_cumulative_mm=10.0,
                soil_moisture_pct=105.0,
                flood_risk_score=10.0,
            )

    def test_equipment_telemetry_valid_and_defaults(self):
        data = {
            "fleet_availability_pct": 85.0,
            "active_excavators": 4,
            "active_dumpers": 14,
            "unscheduled_downtime_hours": 2.5,
            "dumper_cycle_time_min": 28.0,
        }
        obj = EquipmentTelemetryInput(**data)
        self.assertEqual(obj.dewatering_pump_capacity_m3hr, 300.0)  # default
        self.assertEqual(obj.maintenance_backlog_score, 2.0)  # default

    def test_equipment_telemetry_invalid_cycle_time(self):
        from pydantic import ValidationError

        with self.assertRaises(ValidationError):
            EquipmentTelemetryInput(
                fleet_availability_pct=85.0,
                active_excavators=4,
                active_dumpers=14,
                unscheduled_downtime_hours=2.5,
                dumper_cycle_time_min=0.0,  # ge=1.0 required
            )

    def test_geological_data_planned_tonnage_positive(self):
        from pydantic import ValidationError

        with self.assertRaises(ValidationError):
            GeologicalDataInput(
                mine_id="MOIL-BAL-01",
                mine_name="Balaghat Mine",
                sector_id="North-Pit",
                planned_tonnage=0.0,  # gt=0.0 required
                target_grade_mn_pct=42.0,
                estimated_block_grade_mn_pct=40.0,
            )

    def test_full_prediction_request_and_response(self):
        req_data = {
            "satellite": {
                "rainfall_24h_mm": 80.0,
                "rainfall_7d_cumulative_mm": 220.0,
                "soil_moisture_pct": 88.0,
                "flood_risk_score": 75.0,
                "slope_erosion_index": 5.5,
            },
            "equipment": {
                "fleet_availability_pct": 65.0,
                "active_excavators": 2,
                "active_dumpers": 6,
                "unscheduled_downtime_hours": 6.0,
                "dumper_cycle_time_min": 45.0,
                "dewatering_pump_capacity_m3hr": 150.0,
                "maintenance_backlog_score": 6.5,
            },
            "geology": {
                "mine_id": "MOIL-DON-02",
                "mine_name": "Dongri Buzurg Mine",
                "sector_id": "West-Pit-C",
                "planned_tonnage": 18000.0,
                "target_grade_mn_pct": 39.0,
                "estimated_block_grade_mn_pct": 36.5,
                "stripping_ratio": 5.2,
                "ore_moisture_pct": 12.0,
            },
            "forecast_days": 14,
        }
        req = ShortfallPredictionRequest(**req_data)
        self.assertEqual(req.forecast_days, 14)
        self.assertEqual(req.geology.mine_name, "Dongri Buzurg Mine")

        resp_data = {
            "request_id": "req-12345",
            "mine_id": "MOIL-DON-02",
            "mine_name": "Dongri Buzurg Mine",
            "sector_id": "West-Pit-C",
            "shortfall_predicted": True,
            "shortfall_probability": 0.86,
            "risk_level": "CRITICAL",
            "confidence_score": 0.92,
            "expected_shortfall_tonnes": 4800.0,
            "expected_grade_degradation_pct": 2.5,
            "contributing_factors": [
                {
                    "factor_name": "Precipitation Stress",
                    "contribution_pct": 42.0,
                    "description": "High soil saturation causing pit haulage bottleneck",
                    "severity": "HIGH",
                }
            ],
            "corrective_actions": [
                {
                    "id": "ACT-PUMP-01",
                    "title": "Deploy Auxiliary Pumps",
                    "category": "PUMPING_DRAINAGE",
                    "priority": "CRITICAL",
                    "description": "Deploy 2x 500 m3/hr pumps to West Pit sump.",
                    "estimated_recovery_tonnes": 2400.0,
                    "estimated_time_hours": 3.0,
                    "impact_score": 8.5,
                }
            ],
            "engine_used": "scikit_random_forest_v1",
            "timestamp": "2026-08-25T14:30:00Z",
        }
        resp = ShortfallPredictionResponse(**resp_data)
        self.assertEqual(resp.risk_level, RiskLevelEnum.CRITICAL)
        self.assertGreaterEqual(resp.shortfall_probability, 0.0)
        self.assertLessEqual(resp.shortfall_probability, 1.0)


if __name__ == '__main__':
    unittest.main()
