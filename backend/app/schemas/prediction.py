"""
Pydantic v2 schemas for Shortfall Prediction Requests, Responses, and Batch Scoring.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Dict, List, Optional, Union
import uuid
from pydantic import BaseModel, Field, ConfigDict, model_validator

from app.schemas.telemetry import (
    SatelliteTelemetryInput,
    EquipmentTelemetryInput,
    GeologicalDataInput,
)
from app.schemas.corrective_action import CorrectiveActionItem


class RiskLevel(str, Enum):
    """Manganese shortfall risk classification bands."""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class FeatureContribution(BaseModel):
    """SHAP-inspired feature risk attribution component."""
    factor_name: str
    contribution_pct: float = Field(..., description="Relative contribution weight (0-1.0 or 0-100%)")
    description: str
    severity: str = Field(default="MEDIUM", description="LOW | MEDIUM | HIGH | CRITICAL")


class ShortfallPredictionRequest(BaseModel):
    """
    Shortfall prediction request schema.
    Supports both nested hierarchy (satellite, equipment, geology)
    and flattened request payloads for maximum interoperability.
    """
    model_config = ConfigDict(extra="ignore")

    satellite: SatelliteTelemetryInput
    equipment: EquipmentTelemetryInput
    geology: GeologicalDataInput
    forecast_days: int = Field(
        default=7,
        ge=1,
        le=30,
        description="Forecast horizon in days (1-30)"
    )

    @model_validator(mode="before")
    @classmethod
    def parse_payload(cls, data: any) -> any:
        if not isinstance(data, dict):
            return data

        # Check if already nested
        has_nested = "satellite" in data and "equipment" in data and "geology" in data
        if has_nested:
            return data

        # Otherwise construct nested structures from flattened dictionary
        satellite_dict = data.get("satellite") or {}
        equipment_dict = data.get("equipment") or {}
        geology_dict = data.get("geology") or {}

        # 1. Satellite mappings
        rainfall_24h = (
            data.get("rainfall_24h_mm")
            if "rainfall_24h_mm" in data
            else data.get("rainfall_mm_per_hr", 0.0) * 24.0
            if "rainfall_mm_per_hr" in data
            else satellite_dict.get("rainfall_24h_mm", 0.0)
        )
        rainfall_7d = data.get(
            "rainfall_7d_cumulative_mm",
            satellite_dict.get("rainfall_7d_cumulative_mm", rainfall_24h * 2.5)
        )
        soil_moisture = (
            data.get("soil_moisture_pct")
            if "soil_moisture_pct" in data
            else data.get("soil_moisture_percent", satellite_dict.get("soil_moisture_pct", 30.0))
        )
        flood_risk = data.get("flood_risk_score", satellite_dict.get("flood_risk_score", 0.0))
        slope_erosion = data.get("slope_erosion_index", satellite_dict.get("slope_erosion_index", 2.0))
        pore_pressure = data.get("pore_water_pressure_kpa", satellite_dict.get("pore_water_pressure_kpa", 30.0))

        built_satellite = {
            "rainfall_24h_mm": rainfall_24h,
            "rainfall_7d_cumulative_mm": rainfall_7d,
            "soil_moisture_pct": soil_moisture,
            "flood_risk_score": flood_risk,
            "slope_erosion_index": slope_erosion,
            "pore_water_pressure_kpa": pore_pressure,
        }

        # 2. Equipment mappings
        fleet_avail = (
            data.get("fleet_availability_pct")
            if "fleet_availability_pct" in data
            else data.get("fleet_uptime_pct", equipment_dict.get("fleet_availability_pct", 85.0))
        )
        excavators = data.get("active_excavators", equipment_dict.get("active_excavators", 4))
        dumpers = data.get("active_dumpers", equipment_dict.get("active_dumpers", 12))
        pumps = data.get("active_pumps", equipment_dict.get("active_pumps", 4))
        downtime = (
            data.get("unscheduled_downtime_hours")
            if "unscheduled_downtime_hours" in data
            else data.get("downtime_hours", equipment_dict.get("unscheduled_downtime_hours", 1.5))
        )
        cycle_time = (
            data.get("dumper_cycle_time_min")
            if "dumper_cycle_time_min" in data
            else data.get("cycle_time_min", equipment_dict.get("dumper_cycle_time_min", 25.0))
        )
        
        # Convert GPM to m3/hr if pump_capacity_gpm is provided (1 GPM ≈ 0.2271 m3/hr)
        if "pump_capacity_gpm" in data and "dewatering_pump_capacity_m3hr" not in data:
            pump_cap = data["pump_capacity_gpm"] * 0.227125
        else:
            pump_cap = data.get(
                "dewatering_pump_capacity_m3hr",
                equipment_dict.get("dewatering_pump_capacity_m3hr", 300.0)
            )

        friction = data.get("haul_road_friction_coeff", equipment_dict.get("haul_road_friction_coeff", 0.35))
        maint_backlog = data.get("maintenance_backlog_score", equipment_dict.get("maintenance_backlog_score", 2.0))

        built_equipment = {
            "fleet_availability_pct": fleet_avail,
            "active_excavators": excavators,
            "active_dumpers": dumpers,
            "active_pumps": pumps,
            "unscheduled_downtime_hours": downtime,
            "dumper_cycle_time_min": cycle_time,
            "dewatering_pump_capacity_m3hr": pump_cap,
            "haul_road_friction_coeff": friction,
            "maintenance_backlog_score": maint_backlog,
        }

        # 3. Geology mappings
        mine_id = data.get("mine_id", geology_dict.get("mine_id", "MOIL-BAL-01"))
        mine_name = data.get("mine_name", geology_dict.get("mine_name", "Balaghat Mine"))
        sector_id = data.get("sector_id", geology_dict.get("sector_id", "North-Pit-B1"))
        planned_tonnage = data.get("planned_tonnage", geology_dict.get("planned_tonnage", 15000.0))
        current_extraction = data.get("current_extraction", geology_dict.get("current_extraction", 0.0))
        
        target_grade = (
            data.get("target_grade_mn_pct")
            if "target_grade_mn_pct" in data
            else data.get("manganese_grade_percent", geology_dict.get("target_grade_mn_pct", 44.0))
        )
        estimated_grade = (
            data.get("estimated_block_grade_mn_pct")
            if "estimated_block_grade_mn_pct" in data
            else data.get("estimated_grade_mn_pct", geology_dict.get("estimated_block_grade_mn_pct", target_grade))
        )
        stripping_ratio = data.get("stripping_ratio", geology_dict.get("stripping_ratio", 4.0))
        ore_moisture = data.get("ore_moisture_pct", geology_dict.get("ore_moisture_pct", 5.0))

        built_geology = {
            "mine_id": mine_id,
            "mine_name": mine_name,
            "sector_id": sector_id,
            "planned_tonnage": planned_tonnage,
            "current_extraction": current_extraction,
            "target_grade_mn_pct": target_grade,
            "estimated_block_grade_mn_pct": estimated_grade,
            "stripping_ratio": stripping_ratio,
            "ore_moisture_pct": ore_moisture,
        }

        return {
            "satellite": built_satellite,
            "equipment": built_equipment,
            "geology": built_geology,
            "forecast_days": data.get("forecast_days", 7)
        }


class ShortfallPredictionResponse(BaseModel):
    """Comprehensive shortfall prediction response payload."""
    model_config = ConfigDict(extra="ignore")

    status: str = "success"
    request_id: str = Field(default_factory=lambda: f"REQ-{uuid.uuid4().hex[:8].upper()}")
    mine_id: str
    mine_name: str
    sector_id: str
    shortfall_predicted: bool
    shortfall_probability: float = Field(..., ge=0.0, le=1.0)
    risk_level: RiskLevel
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    expected_shortfall_tonnes: float = Field(..., ge=0.0)
    expected_grade_degradation_pct: float = Field(default=0.0, ge=0.0)
    contributing_factors: List[FeatureContribution] = Field(default_factory=list)
    feature_contributions: Optional[Dict[str, float]] = None
    corrective_actions: List[CorrectiveActionItem] = Field(default_factory=list)
    engine_used: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class BatchPredictionRequest(BaseModel):
    """Batch prediction request containing multiple mine sector scenarios."""
    items: List[ShortfallPredictionRequest] = Field(..., min_length=1, max_length=50)


class BatchPredictionResponse(BaseModel):
    """Batch prediction response summary."""
    status: str = "success"
    total_processed: int
    predictions: List[ShortfallPredictionResponse]
    summary_high_risk_count: int
    summary_total_shortfall_tonnes: float
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class TrainingRequest(BaseModel):
    """Model training trigger request."""
    n_samples: int = Field(default=2500, ge=100, le=25000)
    random_state: int = Field(default=42)
    force_retrain: bool = Field(default=False)


class TrainingResponse(BaseModel):
    """Model training execution report."""
    status: str
    model_type: str
    n_samples: int
    accuracy: float
    f1_score: float
    r2_tonnage: float
    artifact_path: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
