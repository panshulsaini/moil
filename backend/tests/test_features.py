"""
Unit tests for the 7 multi-modal interaction feature engineering formulas.
"""

import numpy as np
from app.models.feature_engineering import (
    FeatureEngineeringPipeline,
    FEATURE_NAMES,
)
from app.schemas.prediction import ShortfallPredictionRequest


def test_calculate_eeti():
    """Verify EETI (Effective Equipment Throughput Index) computation."""
    # 1. Nominal case: 100% avail, 4 excavators (480), 12 dumpers (420) -> (900/155)=5.806, 0h downtime -> 5.806
    eeti_nominal = FeatureEngineeringPipeline.calculate_eeti(
        fleet_availability_pct=100.0,
        active_excavators=4,
        active_dumpers=12,
        unscheduled_downtime_hours=0.0
    )
    assert eeti_nominal > 5.0

    # 2. Downtime penalty case: 12h downtime -> downtime_factor = 1.0 - 0.5 = 0.5
    eeti_penalized = FeatureEngineeringPipeline.calculate_eeti(
        fleet_availability_pct=100.0,
        active_excavators=4,
        active_dumpers=12,
        unscheduled_downtime_hours=12.0
    )
    assert round(eeti_penalized, 2) == round(eeti_nominal * 0.5, 2)

    # 3. Low availability
    eeti_low_avail = FeatureEngineeringPipeline.calculate_eeti(
        fleet_availability_pct=50.0,
        active_excavators=4,
        active_dumpers=12,
        unscheduled_downtime_hours=0.0
    )
    assert round(eeti_low_avail, 2) == round(eeti_nominal * 0.5, 2)


def test_calculate_pmsi():
    """Verify PMSI (Precipitation-Moisture Stress Index) bounds and values."""
    # Zero weather stress
    pmsi_zero = FeatureEngineeringPipeline.calculate_pmsi(rainfall_24h_mm=0.0, soil_moisture_pct=0.0)
    assert pmsi_zero == 0.0

    # Intermediate stress: 25mm rain (20.0) + 50% moisture (30.0) = 50.0
    pmsi_mid = FeatureEngineeringPipeline.calculate_pmsi(rainfall_24h_mm=25.0, soil_moisture_pct=50.0)
    assert pmsi_mid == 50.0

    # Extreme stress capped at 100.0
    pmsi_extreme = FeatureEngineeringPipeline.calculate_pmsi(rainfall_24h_mm=150.0, soil_moisture_pct=95.0)
    assert pmsi_extreme == 100.0


def test_calculate_hrrm():
    """Verify HRRM (Haul Road Resistance Multiplier) baseline and delays."""
    # Dry road and fast cycle time (baseline = 1.0)
    hrrm_dry = FeatureEngineeringPipeline.calculate_hrrm(soil_moisture_pct=30.0, dumper_cycle_time_min=15.0)
    assert hrrm_dry == 1.0

    # Wet muddy road (80% moisture) and delayed cycle (30 mins)
    # moisture_penalty: (80-50)/50 * 0.75 = 0.45
    # cycle_penalty: (30-15)/15 * 0.25 = 0.25
    # hrrm = 1.0 + 0.45 + 0.25 = 1.70
    hrrm_muddy = FeatureEngineeringPipeline.calculate_hrrm(soil_moisture_pct=80.0, dumper_cycle_time_min=30.0)
    assert hrrm_muddy == 1.70


def test_calculate_ddr():
    """Verify DDR (Dewatering Deficit Ratio) inflow vs pumping balance."""
    # Zero rain -> zero deficit
    assert FeatureEngineeringPipeline.calculate_ddr(0.0, 300.0) == 0.0

    # Inflow matches pump capacity: 20mm * 25 = 500 m3/hr vs 500 m3/hr capacity
    assert FeatureEngineeringPipeline.calculate_ddr(20.0, 500.0) == 0.0

    # Inflow exceeds pump capacity: 40mm * 25 = 1000 m3/hr vs 400 m3/hr capacity
    # Deficit = 600 / 1000 = 0.60
    ddr_deficit = FeatureEngineeringPipeline.calculate_ddr(40.0, 400.0)
    assert ddr_deficit == 0.60

    # Pump capacity exceeds inflow -> 0.0
    assert FeatureEngineeringPipeline.calculate_ddr(10.0, 500.0) == 0.0


def test_calculate_sbp():
    """Verify SBP (Stripping Backlog Pressure) benchmark comparisons."""
    # Normal stripping ratio (3.5:1)
    assert FeatureEngineeringPipeline.calculate_sbp(3.5) == 0.0
    # Lower than benchmark
    assert FeatureEngineeringPipeline.calculate_sbp(2.0) == 0.0
    # Elevated stripping ratio (7.0:1) -> (7.0 - 3.5)/3.5 = 1.0
    assert FeatureEngineeringPipeline.calculate_sbp(7.0) == 1.0


def test_calculate_gdrf():
    """Verify GDRF (Grade Dilution Risk Factor) calculation."""
    # Equal target and block grade (40% Mn) with low moisture (5%)
    # GDRF = 0 + (5/30)*0.15 = 0.025
    gdrf_nominal = FeatureEngineeringPipeline.calculate_gdrf(40.0, 40.0, 5.0)
    assert gdrf_nominal == 0.025

    # Diluted block grade (35% Mn vs 40% target) with 20% ore moisture
    # grade_diff = (40-35)/40 = 0.125
    # moisture_comp = (20/30)*0.15 = 0.10
    # GDRF = 0.225
    gdrf_diluted = FeatureEngineeringPipeline.calculate_gdrf(40.0, 35.0, 20.0)
    assert gdrf_diluted == 0.225


def test_calculate_ehp():
    """Verify EHP (Equipment Health Penalty) computation."""
    # Ideal equipment health
    assert FeatureEngineeringPipeline.calculate_ehp(0.0, 0.0) == 0.0

    # High backlog (8/10 -> 0.40) and high downtime (6h -> 0.25) -> 0.65
    ehp_high = FeatureEngineeringPipeline.calculate_ehp(8.0, 6.0)
    assert ehp_high == 0.65


def test_transform_request_and_to_vector(valid_nested_payload):
    """Verify request transformation outputs all 21 expected features in correct array shape."""
    req = ShortfallPredictionRequest.model_validate(valid_nested_payload)
    feat_dict = FeatureEngineeringPipeline.transform_request(req)

    # Check all feature names present
    for fname in FEATURE_NAMES:
        assert fname in feat_dict, f"Missing feature: {fname}"

    # Check vector conversion
    vec = FeatureEngineeringPipeline.to_vector(feat_dict)
    assert isinstance(vec, np.ndarray)
    assert vec.shape == (1, len(FEATURE_NAMES))
    assert not np.isnan(vec).any()
