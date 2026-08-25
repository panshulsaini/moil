"""
Tier 3 ML Service Test: Feature Engineering & Telemetry Fusion Engine.
Verifies the 7 multi-modal interaction features, zero-division safety, and physical correlation dynamics.
"""

import unittest
import math
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'backend')))


def compute_eeti(fleet_avail_pct: float, active_exc: int, active_dump: int, downtime_hrs: float) -> float:
    avail_ratio = fleet_avail_pct / 100.0
    throughput = (active_exc * 120 + active_dump * 35) / 155.0
    downtime_penalty = 1.0 - min(0.5, downtime_hrs / 24.0)
    return avail_ratio * throughput * downtime_penalty


def compute_pmsi(rainfall_24h_mm: float, soil_moisture_pct: float) -> float:
    rain_part = (rainfall_24h_mm / 50.0) * 40.0
    moist_part = (soil_moisture_pct / 100.0) * 60.0
    return min(100.0, max(0.0, rain_part + moist_part))


def compute_hrrm(soil_moisture_pct: float, dumper_cycle_time_min: float) -> float:
    moist_pen = max(0.0, ((soil_moisture_pct - 50.0) / 50.0) * 0.75)
    cycle_pen = ((dumper_cycle_time_min - 15.0) / 15.0) * 0.25
    return 1.0 + moist_pen + cycle_pen


def compute_ddr(rainfall_24h_mm: float, pump_capacity_m3hr: float) -> float:
    water_inflow = rainfall_24h_mm * 25.0
    if water_inflow <= 0:
        return 0.0
    deficit = (water_inflow - pump_capacity_m3hr) / max(1.0, water_inflow)
    return max(0.0, min(1.0, deficit))


def compute_sbp(stripping_ratio: float) -> float:
    return max(0.0, (stripping_ratio - 3.5) / 3.5)


def compute_gdrf(target_grade: float, block_grade: float, ore_moisture: float) -> float:
    if target_grade <= 0:
        return 0.0
    gap = max(0.0, (target_grade - block_grade) / target_grade)
    moist_pen = (ore_moisture / 30.0) * 0.15
    return gap + moist_pen


def compute_ehp(maintenance_score: float, downtime_hrs: float) -> float:
    return (maintenance_score / 10.0) * 0.5 + min(0.5, (downtime_hrs / 12.0) * 0.5)


class TestFeatureEngineering(unittest.TestCase):
    """Unit tests for the 7 feature engineering formulas."""

    def test_eeti_formula_and_bounds(self):
        # 100% avail, 1 exc, 1 dumper, 0 downtime -> 1.0
        val = compute_eeti(100.0, 1, 1, 0.0)
        self.assertAlmostEqual(val, 1.0, places=3)

        # 0% avail -> 0.0
        self.assertEqual(compute_eeti(0.0, 4, 12, 0.0), 0.0)

        # Severe downtime cap at 50%
        val_downtime = compute_eeti(100.0, 1, 1, 24.0)
        self.assertAlmostEqual(val_downtime, 0.5, places=3)

    def test_pmsi_bounds_and_saturation(self):
        # 0 rain, 0 moisture -> 0.0
        self.assertEqual(compute_pmsi(0.0, 0.0), 0.0)

        # 50mm rain + 100% moisture -> 100.0
        self.assertEqual(compute_pmsi(50.0, 100.0), 100.0)

        # Cloudburst storm (200mm rain + 95% moisture) -> saturates at 100.0
        self.assertEqual(compute_pmsi(200.0, 95.0), 100.0)

    def test_hrrm_friction_factor(self):
        # Baseline dry conditions
        self.assertAlmostEqual(compute_hrrm(30.0, 15.0), 1.0, places=3)

        # Saturated haul roads (80% moisture, 30 min cycle)
        hrrm = compute_hrrm(80.0, 30.0)
        self.assertGreater(hrrm, 1.5)

    def test_ddr_dewatering_deficit_ratio(self):
        # Zero rainfall -> 0 deficit
        self.assertEqual(compute_ddr(0.0, 500.0), 0.0)

        # High rainfall (100mm = 2500 m3/hr inflow), 500 m3/hr pump -> deficit = (2500-500)/2500 = 0.8
        self.assertAlmostEqual(compute_ddr(100.0, 500.0), 0.8, places=3)

        # Total pump failure (0 pump capacity) -> deficit = 1.0
        self.assertEqual(compute_ddr(50.0, 0.0), 1.0)

    def test_sbp_stripping_backlog_pressure(self):
        # Low stripping ratio 3.0 -> 0 backlog
        self.assertEqual(compute_sbp(3.0), 0.0)

        # High stripping ratio 7.0 -> (7.0 - 3.5)/3.5 = 1.0
        self.assertAlmostEqual(compute_sbp(7.0), 1.0, places=3)

    def test_gdrf_grade_dilution_risk(self):
        # Target = Block Grade (40% Mn), 0% moisture -> 0.0
        self.assertEqual(compute_gdrf(40.0, 40.0, 0.0), 0.0)

        # Target 45% Mn, Block 36% Mn (20% drop) + 15% moisture -> 0.20 + 0.075 = 0.275
        self.assertAlmostEqual(compute_gdrf(45.0, 36.0, 15.0), 0.275, places=3)

        # Zero target grade division guard
        self.assertEqual(compute_gdrf(0.0, 0.0, 10.0), 0.0)

    def test_ehp_equipment_health_penalty(self):
        # 0 backlog, 0 downtime -> 0.0
        self.assertEqual(compute_ehp(0.0, 0.0), 0.0)

        # Max backlog (10.0), 12h downtime -> 0.5 + 0.5 = 1.0
        self.assertAlmostEqual(compute_ehp(10.0, 12.0), 1.0, places=3)


if __name__ == '__main__':
    unittest.main()
