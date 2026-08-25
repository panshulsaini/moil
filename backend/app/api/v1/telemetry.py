"""
Simulated satellite, equipment, and geological telemetry stream endpoints.
"""

from typing import Optional
from fastapi import APIRouter, Query

from app.schemas.telemetry import SimulatedTelemetryResponse
from app.models.data_generator import SyntheticMineDataGenerator

router = APIRouter(prefix="/telemetry", tags=["Telemetry Simulator"])

generator = SyntheticMineDataGenerator(seed=42)


@router.get("/simulated", response_model=SimulatedTelemetryResponse)
async def get_simulated_telemetry(
    mine_id: Optional[str] = Query(None, description="MOIL Mine ID (e.g. MOIL-BAL-01)"),
    scenario: str = Query("random", description="Scenario: normal_dry | monsoon_heavy | pre_monsoon_storm | equipment_breakdown | grade_dilution | random")
) -> SimulatedTelemetryResponse:
    """Generates a realistic multi-modal telemetry snapshot for any or random MOIL mine."""
    return generator.generate_single_telemetry(mine_id=mine_id, scenario=scenario)


@router.get("/simulated/{mine_id}", response_model=SimulatedTelemetryResponse)
async def get_simulated_telemetry_for_mine(
    mine_id: str,
    scenario: str = Query("random", description="Scenario: normal_dry | monsoon_heavy | pre_monsoon_storm | equipment_breakdown | grade_dilution | random")
) -> SimulatedTelemetryResponse:
    """Generates a realistic multi-modal telemetry snapshot for a specific MOIL mine."""
    return generator.generate_single_telemetry(mine_id=mine_id, scenario=scenario)
