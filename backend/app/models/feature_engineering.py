"""
Feature engineering pipeline computing 7 multi-modal interaction features
fusing satellite rainfall, soil saturation, equipment availability, cycle times,
dewatering capacity, and manganese ore grades.
"""

from typing import Dict, List
import numpy as np

from app.schemas.prediction import ShortfallPredictionRequest


FEATURE_NAMES: List[str] = [
    "rainfall_24h_mm",
    "rainfall_7d_cumulative_mm",
    "soil_moisture_pct",
    "flood_risk_score",
    "slope_erosion_index",
    "fleet_availability_pct",
    "active_excavators",
    "active_dumpers",
    "unscheduled_downtime_hours",
    "dumper_cycle_time_min",
    "dewatering_pump_capacity_m3hr",
    "maintenance_backlog_score",
    "planned_tonnage",
    "target_grade_mn_pct",
    "estimated_block_grade_mn_pct",
    "stripping_ratio",
    "ore_moisture_pct",
    # 7 Interaction features:
    "eeti",
    "pmsi",
    "hrrm",
    "ddr",
    "sbp",
    "gdrf",
    "ehp",
]


class FeatureEngineeringPipeline:
    """Computes interaction features from raw telemetry inputs."""

    @staticmethod
    def calculate_eeti(
        fleet_availability_pct: float,
        active_excavators: int,
        active_dumpers: int,
        unscheduled_downtime_hours: float
    ) -> float:
        """
        1. Effective Equipment Throughput Index (EETI):
        Normalized capacity score based on fleet uptime, active excavators/dumpers,
        penalized by unscheduled breakdown hours.
        """
        raw_equip = (active_excavators * 120.0 + active_dumpers * 35.0) / 155.0
        downtime_factor = 1.0 - min(0.5, unscheduled_downtime_hours / 24.0)
        eeti = (fleet_availability_pct / 100.0) * raw_equip * downtime_factor
        return max(0.0, round(float(eeti), 4))

    @staticmethod
    def calculate_pmsi(
        rainfall_24h_mm: float,
        soil_moisture_pct: float
    ) -> float:
        """
        2. Precipitation-Moisture Stress Index (PMSI):
        Composite weather stress score (0-100) combining immediate precipitation
        and accumulated ground soil saturation.
        """
        rain_component = (rainfall_24h_mm / 50.0) * 40.0
        soil_component = (soil_moisture_pct / 100.0) * 60.0
        pmsi = min(100.0, max(0.0, rain_component + soil_component))
        return round(float(pmsi), 4)

    @staticmethod
    def calculate_hrrm(
        soil_moisture_pct: float,
        dumper_cycle_time_min: float
    ) -> float:
        """
        3. Haul Road Resistance Multiplier (HRRM):
        Friction and cycle delay multiplier due to wet muddy haul roads.
        Baseline is 1.0 (dry/unimpeded).
        """
        moisture_penalty = max(0.0, (soil_moisture_pct - 50.0) / 50.0 * 0.75)
        cycle_penalty = max(0.0, (dumper_cycle_time_min - 15.0) / 15.0 * 0.25)
        hrrm = 1.0 + moisture_penalty + cycle_penalty
        return round(float(hrrm), 4)

    @staticmethod
    def calculate_ddr(
        rainfall_24h_mm: float,
        dewatering_pump_capacity_m3hr: float
    ) -> float:
        """
        4. Dewatering Deficit Ratio (DDR):
        Quantifies the deficit between precipitation runoff inflow into the pit
        and total active dewatering pumping capacity (0.0 = fully controlled, 1.0 = overwhelmed).
        """
        water_inflow_est = rainfall_24h_mm * 25.0  # m3/hr inflow estimate per mm rain
        if water_inflow_est <= 0.0:
            return 0.0
        deficit = water_inflow_est - dewatering_pump_capacity_m3hr
        ddr = max(0.0, min(1.0, deficit / max(1.0, water_inflow_est)))
        return round(float(ddr), 4)

    @staticmethod
    def calculate_sbp(stripping_ratio: float) -> float:
        """
        5. Stripping Backlog Pressure (SBP):
        Ratio of overburden pressure above standard benchmark (3.5:1).
        """
        sbp = max(0.0, (stripping_ratio - 3.5) / 3.5)
        return round(float(sbp), 4)

    @staticmethod
    def calculate_gdrf(
        target_grade_mn_pct: float,
        estimated_block_grade_mn_pct: float,
        ore_moisture_pct: float
    ) -> float:
        """
        6. Grade Dilution Risk Factor (GDRF):
        Vulnerability of manganese ore purity to block shortfall and wet fines slumping.
        """
        grade_diff = max(0.0, (target_grade_mn_pct - estimated_block_grade_mn_pct) / max(1.0, target_grade_mn_pct))
        moisture_dilution = (ore_moisture_pct / 30.0) * 0.15
        gdrf = grade_diff + moisture_dilution
        return round(float(gdrf), 4)

    @staticmethod
    def calculate_ehp(
        maintenance_backlog_score: float,
        unscheduled_downtime_hours: float
    ) -> float:
        """
        7. Equipment Health Penalty (EHP):
        Combined equipment vulnerability score (0.0 - 1.0).
        """
        maint_comp = (maintenance_backlog_score / 10.0) * 0.5
        down_comp = min(0.5, (unscheduled_downtime_hours / 12.0) * 0.5)
        ehp = min(1.0, max(0.0, maint_comp + down_comp))
        return round(float(ehp), 4)

    @classmethod
    def transform_request(cls, req: ShortfallPredictionRequest) -> Dict[str, float]:
        """Extracts and computes the full 21-feature dictionary from a validated request."""
        sat = req.satellite
        eq = req.equipment
        geo = req.geology

        eeti = cls.calculate_eeti(
            fleet_availability_pct=eq.fleet_availability_pct,
            active_excavators=eq.active_excavators,
            active_dumpers=eq.active_dumpers,
            unscheduled_downtime_hours=eq.unscheduled_downtime_hours
        )
        pmsi = cls.calculate_pmsi(
            rainfall_24h_mm=sat.rainfall_24h_mm,
            soil_moisture_pct=sat.soil_moisture_pct
        )
        hrrm = cls.calculate_hrrm(
            soil_moisture_pct=sat.soil_moisture_pct,
            dumper_cycle_time_min=eq.dumper_cycle_time_min
        )
        ddr = cls.calculate_ddr(
            rainfall_24h_mm=sat.rainfall_24h_mm,
            dewatering_pump_capacity_m3hr=eq.dewatering_pump_capacity_m3hr
        )
        sbp = cls.calculate_sbp(stripping_ratio=geo.stripping_ratio)
        gdrf = cls.calculate_gdrf(
            target_grade_mn_pct=geo.target_grade_mn_pct,
            estimated_block_grade_mn_pct=geo.estimated_block_grade_mn_pct,
            ore_moisture_pct=geo.ore_moisture_pct
        )
        ehp = cls.calculate_ehp(
            maintenance_backlog_score=eq.maintenance_backlog_score,
            unscheduled_downtime_hours=eq.unscheduled_downtime_hours
        )

        return {
            "rainfall_24h_mm": sat.rainfall_24h_mm,
            "rainfall_7d_cumulative_mm": sat.rainfall_7d_cumulative_mm,
            "soil_moisture_pct": sat.soil_moisture_pct,
            "flood_risk_score": sat.flood_risk_score,
            "slope_erosion_index": sat.slope_erosion_index,
            "fleet_availability_pct": eq.fleet_availability_pct,
            "active_excavators": float(eq.active_excavators),
            "active_dumpers": float(eq.active_dumpers),
            "unscheduled_downtime_hours": eq.unscheduled_downtime_hours,
            "dumper_cycle_time_min": eq.dumper_cycle_time_min,
            "dewatering_pump_capacity_m3hr": eq.dewatering_pump_capacity_m3hr,
            "maintenance_backlog_score": eq.maintenance_backlog_score,
            "planned_tonnage": geo.planned_tonnage,
            "target_grade_mn_pct": geo.target_grade_mn_pct,
            "estimated_block_grade_mn_pct": geo.estimated_block_grade_mn_pct,
            "stripping_ratio": geo.stripping_ratio,
            "ore_moisture_pct": geo.ore_moisture_pct,
            # Interaction Features
            "eeti": eeti,
            "pmsi": pmsi,
            "hrrm": hrrm,
            "ddr": ddr,
            "sbp": sbp,
            "gdrf": gdrf,
            "ehp": ehp,
        }

    @classmethod
    def to_vector(cls, features_dict: Dict[str, float]) -> np.ndarray:
        """Converts feature dictionary into ordered numpy array vector."""
        return np.array([features_dict[k] for k in FEATURE_NAMES], dtype=np.float64).reshape(1, -1)
