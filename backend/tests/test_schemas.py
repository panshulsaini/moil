"""
Unit tests for Pydantic v2 schemas and validation constraints.
"""

import pytest
from pydantic import ValidationError

from app.schemas.telemetry import (
    SatelliteTelemetryInput,
    EquipmentTelemetryInput,
    GeologicalDataInput,
)
from app.schemas.corrective_action import (
    ActionCategory,
    PriorityLevel,
    CorrectiveActionItem,
)
from app.schemas.prediction import (
    RiskLevel,
    ShortfallPredictionRequest,
    ShortfallPredictionResponse,
    BatchPredictionRequest,
)


def test_valid_satellite_schema():
    """Verify valid satellite telemetry input parses successfully."""
    sat = SatelliteTelemetryInput(
        rainfall_24h_mm=25.0,
        rainfall_7d_cumulative_mm=100.0,
        soil_moisture_pct=45.0,
        flood_risk_score=10.0,
        slope_erosion_index=2.5,
    )
    assert sat.rainfall_24h_mm == 25.0
    assert sat.soil_moisture_pct == 45.0


def test_satellite_schema_rejects_negative_rainfall():
    """Verify negative rainfall triggers a validation error."""
    with pytest.raises(ValidationError) as exc:
        SatelliteTelemetryInput(
            rainfall_24h_mm=-5.0,
            soil_moisture_pct=50.0
        )
    assert "rainfall_24h_mm" in str(exc.value)


def test_satellite_schema_rejects_excess_moisture():
    """Verify soil moisture > 100% triggers a validation error."""
    with pytest.raises(ValidationError) as exc:
        SatelliteTelemetryInput(
            rainfall_24h_mm=10.0,
            soil_moisture_pct=105.0
        )
    assert "soil_moisture_pct" in str(exc.value)


def test_valid_equipment_schema():
    """Verify valid equipment telemetry input parses successfully."""
    eq = EquipmentTelemetryInput(
        fleet_availability_pct=85.0,
        active_excavators=4,
        active_dumpers=12,
        unscheduled_downtime_hours=1.5,
        dumper_cycle_time_min=25.0,
    )
    assert eq.fleet_availability_pct == 85.0
    assert eq.active_excavators == 4
    assert eq.dumper_cycle_time_min == 25.0


def test_equipment_schema_rejects_invalid_cycle_time():
    """Verify cycle time <= 0 triggers validation error."""
    with pytest.raises(ValidationError) as exc:
        EquipmentTelemetryInput(
            fleet_availability_pct=80.0,
            active_excavators=2,
            active_dumpers=6,
            unscheduled_downtime_hours=1.0,
            dumper_cycle_time_min=0.0
        )
    assert "dumper_cycle_time_min" in str(exc.value)


def test_equipment_schema_rejects_excess_downtime():
    """Verify downtime > 24h triggers validation error."""
    with pytest.raises(ValidationError) as exc:
        EquipmentTelemetryInput(
            fleet_availability_pct=80.0,
            active_excavators=2,
            active_dumpers=6,
            unscheduled_downtime_hours=26.0,
            dumper_cycle_time_min=20.0
        )
    assert "unscheduled_downtime_hours" in str(exc.value)


def test_valid_geology_schema():
    """Verify valid geological parameters parse successfully."""
    geo = GeologicalDataInput(
        mine_id="MOIL-BAL-01",
        mine_name="Balaghat Mine",
        planned_tonnage=15000.0,
        target_grade_mn_pct=45.0,
        estimated_block_grade_mn_pct=44.0,
    )
    assert geo.mine_id == "MOIL-BAL-01"
    assert geo.planned_tonnage == 15000.0


def test_geology_schema_rejects_zero_or_negative_tonnage():
    """Verify planned tonnage <= 0 triggers validation error."""
    with pytest.raises(ValidationError) as exc:
        GeologicalDataInput(
            mine_id="MOIL-BAL-01",
            planned_tonnage=0.0,
            target_grade_mn_pct=45.0,
            estimated_block_grade_mn_pct=44.0,
        )
    assert "planned_tonnage" in str(exc.value)


def test_shortfall_request_nested_parsing(valid_nested_payload):
    """Verify nested shortfall prediction request builds correctly."""
    req = ShortfallPredictionRequest.model_validate(valid_nested_payload)
    assert req.satellite.rainfall_24h_mm == 18.5
    assert req.equipment.active_excavators == 4
    assert req.geology.mine_id == "MOIL-BAL-01"
    assert req.forecast_days == 7


def test_shortfall_request_flattened_parsing(valid_flat_payload):
    """Verify flattened dictionary automatically builds valid nested models."""
    req = ShortfallPredictionRequest.model_validate(valid_flat_payload)
    assert req.geology.mine_id == "MOIL-DBZ-02"
    assert req.satellite.rainfall_24h_mm == 2.5 * 24.0
    assert req.satellite.soil_moisture_pct == 68.0
    assert req.equipment.active_dumpers == 12
    assert req.geology.target_grade_mn_pct == 41.0


def test_shortfall_request_forecast_days_bounds(valid_nested_payload):
    """Verify forecast days <= 0 or > 30 is rejected."""
    payload_invalid = dict(valid_nested_payload)
    payload_invalid["forecast_days"] = 45
    with pytest.raises(ValidationError):
        ShortfallPredictionRequest.model_validate(payload_invalid)


def test_corrective_action_alias_support():
    """Verify CorrectiveActionItem supports alternative field names seamlessly."""
    item = CorrectiveActionItem.model_validate({
        "id": "ACT-TEST-01",
        "category": "DEWATERING",
        "title": "Deploy pumps",
        "description": "Auxiliary pumps",
        "priority": "HIGH",
        "estimated_tonnage_recovery": 1500.0,
        "action_lead_time_hours": 3.0,
    })
    assert item.category == ActionCategory.DEWATERING
    assert item.estimated_recovery_tonnes == 1500.0
    assert item.estimated_time_hours == 3.0
    assert item.priority == PriorityLevel.HIGH


def test_batch_prediction_request_length_bounds(valid_nested_payload):
    """Verify batch prediction validates list length between 1 and 50."""
    with pytest.raises(ValidationError):
        BatchPredictionRequest.model_validate({"items": []})
    
    # Valid with 1 item
    batch = BatchPredictionRequest.model_validate({"items": [valid_nested_payload]})
    assert len(batch.items) == 1
