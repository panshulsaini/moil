"""
Pydantic v2 schemas for multi-modal mine telemetry (satellite, equipment, geological).
"""

from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class SatelliteTelemetryInput(BaseModel):
    """Satellite and hydro-meteorological observation telemetry."""
    model_config = ConfigDict(extra="ignore")

    rainfall_24h_mm: float = Field(
        ...,
        ge=0.0,
        le=500.0,
        description="Precipitation in the last 24 hours in millimeters (mm)"
    )
    rainfall_7d_cumulative_mm: float = Field(
        default=0.0,
        ge=0.0,
        le=2000.0,
        description="7-day cumulative precipitation in millimeters (mm)"
    )
    soil_moisture_pct: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Surface soil saturation index / moisture percentage (0-100%)"
    )
    flood_risk_score: float = Field(
        default=0.0,
        ge=0.0,
        le=100.0,
        description="Satellite SAR/Optical derived pit flood risk score (0-100)"
    )
    slope_erosion_index: float = Field(
        default=2.0,
        ge=0.0,
        le=10.0,
        description="Pit bench slope instability and runoff erosion index (0-10)"
    )
    pore_water_pressure_kpa: Optional[float] = Field(
        default=30.0,
        ge=0.0,
        le=250.0,
        description="Pore water pressure measured by piezometers in kPa"
    )


class EquipmentTelemetryInput(BaseModel):
    """Heavy Earth Moving Machinery (HEMM) and telematics telemetry."""
    model_config = ConfigDict(extra="ignore")

    fleet_availability_pct: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Overall operational availability of excavators and dumpers (%)"
    )
    active_excavators: int = Field(
        ...,
        ge=0,
        le=50,
        description="Number of operational excavators actively digging on ore/OB faces"
    )
    active_dumpers: int = Field(
        ...,
        ge=0,
        le=200,
        description="Number of active hauling trucks in haulage circuit"
    )
    active_pumps: Optional[int] = Field(
        default=4,
        ge=0,
        le=50,
        description="Number of operational pit dewatering pumps"
    )
    unscheduled_downtime_hours: float = Field(
        ...,
        ge=0.0,
        le=24.0,
        description="Cumulative unscheduled breakdown hours during current shift"
    )
    dumper_cycle_time_min: float = Field(
        ...,
        ge=1.0,
        le=180.0,
        description="Round-trip dumper cycle time from pit face to crusher/stockpile in minutes"
    )
    dewatering_pump_capacity_m3hr: float = Field(
        default=300.0,
        ge=0.0,
        le=10000.0,
        description="Total active pit dewatering pumping capacity in m³/hr"
    )
    haul_road_friction_coeff: Optional[float] = Field(
        default=0.35,
        ge=0.0,
        le=1.0,
        description="Estimated haul road surface friction coefficient (0.0=slick mud, 1.0=dry paved)"
    )
    maintenance_backlog_score: float = Field(
        default=2.0,
        ge=0.0,
        le=10.0,
        description="Preventative maintenance backlog severity score (0=none, 10=critical)"
    )


class GeologicalDataInput(BaseModel):
    """Geological block model and extraction planning parameters."""
    model_config = ConfigDict(extra="ignore")

    mine_id: str = Field(
        ...,
        min_length=2,
        max_length=50,
        description="Unique MOIL mine identifier (e.g. MOIL-BAL-01, MOIL-DBZ-02)"
    )
    mine_name: str = Field(
        default="MOIL Manganese Mine",
        min_length=2,
        max_length=100,
        description="Mine name (e.g. Balaghat Mine, Dongri Buzurg Mine)"
    )
    sector_id: str = Field(
        default="North-Pit-B1",
        min_length=2,
        max_length=50,
        description="Pit bench or underground sector identifier"
    )
    planned_tonnage: float = Field(
        ...,
        gt=0.0,
        le=100000.0,
        description="Planned manganese ore target extraction in metric tonnes"
    )
    current_extraction: Optional[float] = Field(
        default=0.0,
        ge=0.0,
        description="Current actual extracted ore in metric tonnes"
    )
    target_grade_mn_pct: float = Field(
        ...,
        ge=10.0,
        le=65.0,
        description="Target manganese grade specification (% Mn)"
    )
    estimated_block_grade_mn_pct: float = Field(
        ...,
        ge=10.0,
        le=65.0,
        description="Geostatistical block model kriging estimated manganese grade (% Mn)"
    )
    stripping_ratio: float = Field(
        default=4.0,
        ge=0.0,
        le=25.0,
        description="Current overburden-to-ore volumetric stripping ratio (OB : Ore)"
    )
    ore_moisture_pct: float = Field(
        default=5.0,
        ge=0.0,
        le=35.0,
        description="In-situ ore moisture percentage"
    )


class SimulatedTelemetryResponse(BaseModel):
    """Simulated telemetry stream response."""
    mine_id: str
    mine_name: str
    sector_id: str
    scenario: str
    satellite: SatelliteTelemetryInput
    equipment: EquipmentTelemetryInput
    geology: GeologicalDataInput
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
