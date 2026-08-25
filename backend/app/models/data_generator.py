"""
Synthetic mine telemetry simulator for 8 MOIL manganese mines,
modeling realistic hydro-meteorological, equipment, and geological interactions.
"""

from typing import Any, Dict, List, Optional, Tuple
import numpy as np
import pandas as pd

from app.schemas.telemetry import (
    SatelliteTelemetryInput,
    EquipmentTelemetryInput,
    GeologicalDataInput,
    SimulatedTelemetryResponse,
)
from app.schemas.prediction import ShortfallPredictionRequest
from app.models.feature_engineering import FeatureEngineeringPipeline, FEATURE_NAMES


MOIL_MINES_METADATA: List[Dict[str, Any]] = [
    {
        "mine_id": "MOIL-BAL-01",
        "name": "Balaghat Mine",
        "state": "Madhya Pradesh",
        "district": "Balaghat",
        "type": "Underground & Opencast",
        "latitude": 21.8048,
        "longitude": 80.1849,
        "annual_capacity_tonnes": 1200000.0,
        "average_mn_grade_pct": 45.5,
        "primary_ore_type": "Dioxide & High-Grade Metallurgical",
        "active_benches_or_levels": 12,
        "default_daily_target_tonnes": 3500.0,
        "default_stripping_ratio": 4.5,
    },
    {
        "mine_id": "MOIL-DBZ-02",
        "name": "Dongri Buzurg Mine",
        "state": "Maharashtra",
        "district": "Bhandara",
        "type": "Opencast",
        "latitude": 21.5458,
        "longitude": 79.6912,
        "annual_capacity_tonnes": 950000.0,
        "average_mn_grade_pct": 40.0,
        "primary_ore_type": "Pyrolusite Battery-Grade Dioxide",
        "active_benches_or_levels": 8,
        "default_daily_target_tonnes": 2800.0,
        "default_stripping_ratio": 5.8,
    },
    {
        "mine_id": "MOIL-MAN-03",
        "name": "Mansar Mine",
        "state": "Maharashtra",
        "district": "Nagpur",
        "type": "Opencast & Underground",
        "latitude": 21.3985,
        "longitude": 79.2741,
        "annual_capacity_tonnes": 520000.0,
        "average_mn_grade_pct": 38.5,
        "primary_ore_type": "Medium-Grade Metallurgical",
        "active_benches_or_levels": 6,
        "default_daily_target_tonnes": 1500.0,
        "default_stripping_ratio": 4.2,
    },
    {
        "mine_id": "MOIL-CHK-04",
        "name": "Chikla Mine",
        "state": "Maharashtra",
        "district": "Bhandara",
        "type": "Underground",
        "latitude": 21.5583,
        "longitude": 79.7417,
        "annual_capacity_tonnes": 600000.0,
        "average_mn_grade_pct": 42.0,
        "primary_ore_type": "High-Grade Metallurgical Ore",
        "active_benches_or_levels": 9,
        "default_daily_target_tonnes": 1800.0,
        "default_stripping_ratio": 2.5,
    },
    {
        "mine_id": "MOIL-KAN-05",
        "name": "Kandri Mine",
        "state": "Maharashtra",
        "district": "Nagpur",
        "type": "Underground",
        "latitude": 21.4167,
        "longitude": 79.2667,
        "annual_capacity_tonnes": 420000.0,
        "average_mn_grade_pct": 44.0,
        "primary_ore_type": "High-Grade Low-Phosphorus Ore",
        "active_benches_or_levels": 7,
        "default_daily_target_tonnes": 1200.0,
        "default_stripping_ratio": 2.0,
    },
    {
        "mine_id": "MOIL-GUM-06",
        "name": "Gumgaon Mine",
        "state": "Maharashtra",
        "district": "Nagpur",
        "type": "Underground",
        "latitude": 21.3833,
        "longitude": 78.9833,
        "annual_capacity_tonnes": 350000.0,
        "average_mn_grade_pct": 41.5,
        "primary_ore_type": "Siliceous Metallurgical Ore",
        "active_benches_or_levels": 5,
        "default_daily_target_tonnes": 1000.0,
        "default_stripping_ratio": 1.8,
    },
    {
        "mine_id": "MOIL-TIR-07",
        "name": "Tirodi Mine",
        "state": "Madhya Pradesh",
        "district": "Balaghat",
        "type": "Opencast",
        "latitude": 21.6833,
        "longitude": 79.7000,
        "annual_capacity_tonnes": 480000.0,
        "average_mn_grade_pct": 37.0,
        "primary_ore_type": "Medium-to-Low Grade Metallurgical",
        "active_benches_or_levels": 5,
        "default_daily_target_tonnes": 1400.0,
        "default_stripping_ratio": 6.2,
    },
    {
        "mine_id": "MOIL-UKW-08",
        "name": "Ukwa Mine",
        "state": "Madhya Pradesh",
        "district": "Balaghat",
        "type": "Underground",
        "latitude": 21.9667,
        "longitude": 80.4667,
        "annual_capacity_tonnes": 310000.0,
        "average_mn_grade_pct": 39.0,
        "primary_ore_type": "Ferruginous Manganese Ore",
        "active_benches_or_levels": 4,
        "default_daily_target_tonnes": 900.0,
        "default_stripping_ratio": 1.5,
    },
]

MINES_BY_ID: Dict[str, Dict[str, Any]] = {m["mine_id"]: m for m in MOIL_MINES_METADATA}


class SyntheticMineDataGenerator:
    """Generates synthetic telemetry and historical datasets for training and simulation."""

    def __init__(self, seed: int = 42):
        self.rng = np.random.default_rng(seed)

    def get_mine_metadata(self, mine_id: Optional[str] = None) -> Dict[str, Any]:
        """Retrieves metadata for specified mine or selects random mine."""
        if mine_id and mine_id.upper() in MINES_BY_ID:
            return MINES_BY_ID[mine_id.upper()]
        
        # Check partial match (e.g. "BALAGHAT", "DBZ")
        if mine_id:
            query = mine_id.upper()
            for m_id, data in MINES_BY_ID.items():
                if query in m_id or query in data["name"].upper():
                    return data

        idx = self.rng.integers(0, len(MOIL_MINES_METADATA))
        return MOIL_MINES_METADATA[idx]

    def generate_single_telemetry(
        self,
        mine_id: Optional[str] = None,
        scenario: str = "random"
    ) -> SimulatedTelemetryResponse:
        """
        Generates simulated telemetry payload for a specific mine and scenario.
        Scenarios: 'normal_dry', 'monsoon_heavy', 'pre_monsoon_storm',
                   'equipment_breakdown', 'grade_dilution', 'random'
        """
        mine = self.get_mine_metadata(mine_id)
        
        if scenario == "random":
            scenario_weights = [0.45, 0.20, 0.15, 0.10, 0.10]
            scenarios = ["normal_dry", "monsoon_heavy", "pre_monsoon_storm", "equipment_breakdown", "grade_dilution"]
            scenario = self.rng.choice(scenarios, p=scenario_weights)

        # 1. Satellite weather generation
        if scenario == "monsoon_heavy":
            rainfall_24h = float(self.rng.uniform(60.0, 160.0))
            rainfall_7d = float(rainfall_24h * self.rng.uniform(2.5, 4.5))
            soil_moisture = float(self.rng.uniform(75.0, 98.0))
            flood_risk = float(self.rng.uniform(65.0, 95.0))
            slope_erosion = float(self.rng.uniform(6.0, 9.5))
            pore_pressure = float(self.rng.uniform(80.0, 160.0))
        elif scenario == "pre_monsoon_storm":
            rainfall_24h = float(self.rng.uniform(25.0, 55.0))
            rainfall_7d = float(rainfall_24h * self.rng.uniform(1.5, 2.5))
            soil_moisture = float(self.rng.uniform(45.0, 70.0))
            flood_risk = float(self.rng.uniform(25.0, 50.0))
            slope_erosion = float(self.rng.uniform(3.5, 6.0))
            pore_pressure = float(self.rng.uniform(40.0, 80.0))
        elif scenario == "normal_dry":
            rainfall_24h = float(self.rng.uniform(0.0, 10.0))
            rainfall_7d = float(rainfall_24h * self.rng.uniform(1.0, 2.0))
            soil_moisture = float(self.rng.uniform(15.0, 38.0))
            flood_risk = float(self.rng.uniform(0.0, 15.0))
            slope_erosion = float(self.rng.uniform(0.5, 2.5))
            pore_pressure = float(self.rng.uniform(15.0, 35.0))
        else: # equipment_breakdown or grade_dilution
            rainfall_24h = float(self.rng.uniform(5.0, 25.0))
            rainfall_7d = float(rainfall_24h * self.rng.uniform(1.2, 2.5))
            soil_moisture = float(self.rng.uniform(25.0, 50.0))
            flood_risk = float(self.rng.uniform(10.0, 30.0))
            slope_erosion = float(self.rng.uniform(1.5, 4.0))
            pore_pressure = float(self.rng.uniform(25.0, 50.0))

        # 2. Equipment telematics generation
        if scenario == "equipment_breakdown":
            fleet_avail = float(self.rng.uniform(40.0, 65.0))
            active_excavators = int(self.rng.integers(1, 3))
            active_dumpers = int(self.rng.integers(4, 9))
            downtime_hours = float(self.rng.uniform(5.0, 12.0))
            dumper_cycle = float(self.rng.uniform(35.0, 65.0))
            maint_backlog = float(self.rng.uniform(6.5, 9.5))
            active_pumps = int(self.rng.integers(2, 5))
            pump_capacity = float(self.rng.uniform(200.0, 450.0))
            friction_coeff = float(self.rng.uniform(0.25, 0.40))
        elif scenario == "monsoon_heavy":
            fleet_avail = float(self.rng.uniform(60.0, 78.0))
            active_excavators = int(self.rng.integers(2, 5))
            active_dumpers = int(self.rng.integers(8, 16))
            downtime_hours = float(self.rng.uniform(3.0, 8.0))
            # Wet muddy roads slow down dumpers by 40-80%
            dumper_cycle = float(self.rng.uniform(32.0, 55.0))
            maint_backlog = float(self.rng.uniform(3.0, 6.0))
            active_pumps = int(self.rng.integers(4, 10))
            pump_capacity = float(self.rng.uniform(400.0, 800.0))
            friction_coeff = float(self.rng.uniform(0.18, 0.32))
        else: # normal_dry or grade_dilution
            fleet_avail = float(self.rng.uniform(85.0, 98.0))
            active_excavators = int(self.rng.integers(4, 8))
            active_dumpers = int(self.rng.integers(14, 25))
            downtime_hours = float(self.rng.uniform(0.2, 2.0))
            dumper_cycle = float(self.rng.uniform(18.0, 28.0))
            maint_backlog = float(self.rng.uniform(0.5, 3.0))
            active_pumps = int(self.rng.integers(3, 6))
            pump_capacity = float(self.rng.uniform(300.0, 600.0))
            friction_coeff = float(self.rng.uniform(0.40, 0.60))

        # 3. Geological parameters
        target_grade = float(mine["average_mn_grade_pct"])
        planned_tonnage = float(mine["default_daily_target_tonnes"] * 7) # 7-day planned tonnage
        
        if scenario == "grade_dilution":
            estimated_grade = float(target_grade - self.rng.uniform(3.5, 7.0))
            ore_moisture = float(self.rng.uniform(12.0, 24.0))
            stripping_ratio = float(mine["default_stripping_ratio"] + self.rng.uniform(1.5, 3.5))
        elif scenario == "monsoon_heavy":
            estimated_grade = float(target_grade - self.rng.uniform(1.0, 3.5))
            ore_moisture = float(self.rng.uniform(15.0, 28.0))
            stripping_ratio = float(mine["default_stripping_ratio"] + self.rng.uniform(0.5, 2.0))
        else:
            estimated_grade = float(target_grade + self.rng.uniform(-0.8, 1.2))
            ore_moisture = float(self.rng.uniform(3.0, 8.0))
            stripping_ratio = float(mine["default_stripping_ratio"])

        # Construct sub-models
        sat = SatelliteTelemetryInput(
            rainfall_24h_mm=round(rainfall_24h, 2),
            rainfall_7d_cumulative_mm=round(rainfall_7d, 2),
            soil_moisture_pct=round(soil_moisture, 2),
            flood_risk_score=round(flood_risk, 2),
            slope_erosion_index=round(slope_erosion, 2),
            pore_water_pressure_kpa=round(pore_pressure, 2),
        )

        eq = EquipmentTelemetryInput(
            fleet_availability_pct=round(fleet_avail, 2),
            active_excavators=active_excavators,
            active_dumpers=active_dumpers,
            active_pumps=active_pumps,
            unscheduled_downtime_hours=round(downtime_hours, 2),
            dumper_cycle_time_min=round(dumper_cycle, 2),
            dewatering_pump_capacity_m3hr=round(pump_capacity, 2),
            haul_road_friction_coeff=round(friction_coeff, 2),
            maintenance_backlog_score=round(maint_backlog, 2),
        )

        geo = GeologicalDataInput(
            mine_id=mine["mine_id"],
            mine_name=mine["name"],
            sector_id="North-Pit-B1" if "Opencast" in mine["type"] else "Underground-L4",
            planned_tonnage=round(planned_tonnage, 2),
            current_extraction=round(planned_tonnage * float(self.rng.uniform(0.7, 0.95)), 2),
            target_grade_mn_pct=round(target_grade, 2),
            estimated_block_grade_mn_pct=round(estimated_grade, 2),
            stripping_ratio=round(stripping_ratio, 2),
            ore_moisture_pct=round(ore_moisture, 2),
        )

        return SimulatedTelemetryResponse(
            mine_id=mine["mine_id"],
            mine_name=mine["name"],
            sector_id=geo.sector_id,
            scenario=scenario,
            satellite=sat,
            equipment=eq,
            geology=geo,
        )

    def generate_training_dataset(
        self,
        n_samples: int = 2500
    ) -> Tuple[pd.DataFrame, pd.Series, pd.Series, pd.Series]:
        """
        Generates synthetic historical mining dataset for model training.
        Returns:
            X: DataFrame with 21 features (raw + interaction)
            y_shortfall_binary: Series (1 for shortfall, 0 for nominal)
            y_shortfall_tonnes: Series (magnitude in metric tonnes)
            y_grade_degradation: Series (grade drop in % Mn)
        """
        rows: List[Dict[str, float]] = []
        y_binary: List[int] = []
        y_tonnes: List[float] = []
        y_grade: List[float] = []

        scenarios = ["normal_dry", "monsoon_heavy", "pre_monsoon_storm", "equipment_breakdown", "grade_dilution"]
        scenario_probs = [0.40, 0.25, 0.15, 0.10, 0.10]

        for _ in range(n_samples):
            scenario = self.rng.choice(scenarios, p=scenario_probs)
            telemetry_resp = self.generate_single_telemetry(scenario=scenario)
            
            # Form prediction request and transform to feature dict
            req = ShortfallPredictionRequest(
                satellite=telemetry_resp.satellite,
                equipment=telemetry_resp.equipment,
                geology=telemetry_resp.geology,
                forecast_days=7
            )
            feat = FeatureEngineeringPipeline.transform_request(req)
            rows.append(feat)

            # Realistic physical simulation for ground-truth targets
            weather_stress = (feat["pmsi"] / 100.0) * 0.45 + feat["ddr"] * 0.55
            equip_stress = (1.0 - min(1.0, feat["eeti"])) * 0.60 + feat["ehp"] * 0.40
            geo_stress = feat["gdrf"] * 0.65 + min(1.0, feat["sbp"]) * 0.35

            composite_risk = (
                weather_stress * 0.45 +
                equip_stress * 0.35 +
                geo_stress * 0.20 +
                float(self.rng.normal(0.0, 0.05))
            )
            prob = max(0.01, min(0.99, composite_risk))

            # Threshold for shortfall occurrence (deficit >= 10%)
            shortfall_flag = 1 if prob >= 0.38 else 0
            
            tonnage_deficit = max(0.0, feat["planned_tonnage"] * prob * float(self.rng.uniform(0.70, 0.95)))
            grade_drop = max(0.0, feat["target_grade_mn_pct"] * geo_stress * float(self.rng.uniform(0.15, 0.30)))

            y_binary.append(shortfall_flag)
            y_tonnes.append(round(tonnage_deficit, 2))
            y_grade.append(round(grade_drop, 2))

        df_X = pd.DataFrame(rows)[FEATURE_NAMES]
        s_binary = pd.Series(y_binary, name="shortfall_binary")
        s_tonnes = pd.Series(y_tonnes, name="shortfall_tonnes")
        s_grade = pd.Series(y_grade, name="grade_degradation_pct")

        return df_X, s_binary, s_tonnes, s_grade
