"""
Real-world dataset telemetry generator for MOIL manganese mines.
Integrates Kaggle AI4I 2020 Predictive Maintenance Dataset and Open-Meteo Historical Weather.
"""

import os
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
        "mine_id": "00000000-0000-0000-0000-000000000001",
        "name": "Balaghat Mine",
        "state": "Madhya Pradesh",
        "district": "Balaghat",
        "type": "Underground",
        "latitude": 21.8124,
        "longitude": 80.1832,
        "annual_capacity_tonnes": 450000.0,
        "average_mn_grade_pct": 48.0,
        "primary_ore_type": "Pyrolusite",
        "active_benches_or_levels": 12,
        "default_daily_target_tonnes": 1200.0,
        "default_stripping_ratio": 4.5,
    },
    {
        "mine_id": "00000000-0000-0000-0000-000000000002",
        "name": "Dongri Buzurg Mine",
        "state": "Maharashtra",
        "district": "Bhandara",
        "type": "Opencast",
        "latitude": 21.5638,
        "longitude": 79.7121,
        "annual_capacity_tonnes": 520000.0,
        "average_mn_grade_pct": 78.0,
        "primary_ore_type": "MnO2 Battery Grade",
        "active_benches_or_levels": 8,
        "default_daily_target_tonnes": 1450.0,
        "default_stripping_ratio": 5.8,
    },
    {
        "mine_id": "00000000-0000-0000-0000-000000000003",
        "name": "Mansar Mine",
        "state": "Maharashtra",
        "district": "Nagpur",
        "type": "Mixed",
        "latitude": 21.3982,
        "longitude": 79.2847,
        "annual_capacity_tonnes": 240000.0,
        "average_mn_grade_pct": 40.0,
        "primary_ore_type": "Ferro Grade Mn",
        "active_benches_or_levels": 6,
        "default_daily_target_tonnes": 650.0,
        "default_stripping_ratio": 3.0,
    },
    {
        "mine_id": "00000000-0000-0000-0000-000000000004",
        "name": "Chikla Mine",
        "state": "Maharashtra",
        "district": "Bhandara",
        "type": "Underground",
        "latitude": 21.5542,
        "longitude": 79.7523,
        "annual_capacity_tonnes": 220000.0,
        "average_mn_grade_pct": 44.0,
        "primary_ore_type": "Mn Ore",
        "active_benches_or_levels": 5,
        "default_daily_target_tonnes": 600.0,
        "default_stripping_ratio": 0.0,
    },
    {
        "mine_id": "00000000-0000-0000-0000-000000000005",
        "name": "Kandri Mine",
        "state": "Maharashtra",
        "district": "Nagpur",
        "type": "Mixed",
        "latitude": 21.4231,
        "longitude": 79.2715,
        "annual_capacity_tonnes": 290000.0,
        "average_mn_grade_pct": 43.0,
        "primary_ore_type": "Mn Ore",
        "active_benches_or_levels": 7,
        "default_daily_target_tonnes": 800.0,
        "default_stripping_ratio": 3.2,
    },
    {
        "mine_id": "00000000-0000-0000-0000-000000000006",
        "name": "Gumgaon Mine",
        "state": "Maharashtra",
        "district": "Nagpur",
        "type": "Underground",
        "latitude": 21.3812,
        "longitude": 78.9842,
        "annual_capacity_tonnes": 275000.0,
        "average_mn_grade_pct": 46.0,
        "primary_ore_type": "High Grade Mn",
        "active_benches_or_levels": 8,
        "default_daily_target_tonnes": 750.0,
        "default_stripping_ratio": 0.0,
    },
    {
        "mine_id": "00000000-0000-0000-0000-000000000007",
        "name": "Tirodi Mine",
        "state": "Madhya Pradesh",
        "district": "Balaghat",
        "type": "Opencast",
        "latitude": 21.6842,
        "longitude": 79.7214,
        "annual_capacity_tonnes": 330000.0,
        "average_mn_grade_pct": 44.0,
        "primary_ore_type": "Pyrolusite",
        "active_benches_or_levels": 5,
        "default_daily_target_tonnes": 900.0,
        "default_stripping_ratio": 4.1,
    },
    {
        "mine_id": "00000000-0000-0000-0000-000000000008",
        "name": "Ukwa Mine",
        "state": "Madhya Pradesh",
        "district": "Balaghat",
        "type": "Underground",
        "latitude": 21.9612,
        "longitude": 80.4721,
        "annual_capacity_tonnes": 200000.0,
        "average_mn_grade_pct": 45.0,
        "primary_ore_type": "Low Phosphorus Mn",
        "active_benches_or_levels": 6,
        "default_daily_target_tonnes": 550.0,
        "default_stripping_ratio": 0.0,
    }
]

MINES_BY_ID = {m["mine_id"]: m for m in MOIL_MINES_METADATA}

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data", "raw")

class SyntheticMineDataGenerator:
    """
    Simulates real-time telemetry by sampling from historical Kaggle & Open-Meteo datasets.
    """
    def __init__(self, seed: int = 42):
        self.rng = np.random.default_rng(seed)
        
        # Load Kaggle AI4I Telemetry
        ai4i_path = os.path.join(DATA_DIR, "ai4i2020_telemetry.csv")
        if os.path.exists(ai4i_path):
            self.df_telemetry = pd.read_csv(ai4i_path)
            self.has_telemetry = True
        else:
            self.has_telemetry = False
            self.df_telemetry = None
            
        # Load Open-Meteo Weather
        meteo_path = os.path.join(DATA_DIR, "open_meteo_balaghat.csv")
        if os.path.exists(meteo_path):
            self.df_weather = pd.read_csv(meteo_path)
            self.has_weather = True
        else:
            self.has_weather = False
            self.df_weather = None

    def generate_single_telemetry(
        self,
        mine_id: Optional[str] = None,
        scenario: str = "random"
    ) -> SimulatedTelemetryResponse:
        
        mine = next((m for m in MOIL_MINES_METADATA if m["mine_id"] == mine_id), MOIL_MINES_METADATA[0])
        
        if scenario == "random":
            scenario = self.rng.choice([
                "normal_dry", "monsoon_heavy", "pre_monsoon_storm", "equipment_breakdown", "grade_dilution"
            ], p=[0.40, 0.25, 0.15, 0.10, 0.10])

        # 1. Fetch Real Weather Data
        if self.has_weather:
            # Filter weather based on scenario
            if scenario in ["monsoon_heavy", "pre_monsoon_storm"]:
                candidates = self.df_weather[self.df_weather['rain_mm'] > 5.0]
                if len(candidates) == 0: candidates = self.df_weather
            else:
                candidates = self.df_weather[self.df_weather['rain_mm'] <= 2.0]
                if len(candidates) == 0: candidates = self.df_weather
                
            w_row = candidates.sample(1, random_state=int(self.rng.integers(0, 100000))).iloc[0]
            rainfall_24h = float(w_row['rain_mm']) * 24.0
            soil_moisture = float(w_row['soil_moisture_pct'])
        else:
            rainfall_24h = float(self.rng.uniform(0.0, 50.0))
            soil_moisture = float(self.rng.uniform(10.0, 45.0))
            
        rainfall_7d = float(rainfall_24h * self.rng.uniform(1.2, 3.5))
        flood_risk = float(np.clip(rainfall_24h * 0.5 + soil_moisture * 0.2, 0, 100))
        slope_erosion = float(self.rng.uniform(1.0, 5.0))
        pore_pressure = float(np.clip(soil_moisture * 1.5, 0, 100))

        # 2. Fetch Real Kaggle Equipment Data
        if self.has_telemetry:
            if scenario == "equipment_breakdown":
                candidates = self.df_telemetry[self.df_telemetry['Machine failure'] == 1]
                if len(candidates) == 0: candidates = self.df_telemetry
            else:
                candidates = self.df_telemetry[self.df_telemetry['Machine failure'] == 0]
                if len(candidates) == 0: candidates = self.df_telemetry
                
            t_row = candidates.sample(1, random_state=int(self.rng.integers(0, 100000))).iloc[0]
            
            tool_wear = float(t_row['Tool wear [min]'])
            machine_failure = int(t_row['Machine failure'])
            
            fleet_avail = float(100.0 - (machine_failure * 35.0) - (tool_wear / 250.0 * 15.0))
            downtime_hours = float(machine_failure * self.rng.uniform(4.0, 12.0) + (tool_wear / 200.0))
            maint_backlog = float(tool_wear / 30.0)
        else:
            fleet_avail = float(self.rng.uniform(40.0, 95.0))
            downtime_hours = float(self.rng.uniform(0.0, 10.0))
            maint_backlog = float(self.rng.uniform(1.0, 8.0))

        # Constraints
        active_excavators = int(self.rng.integers(1, 5))
        active_dumpers = int(self.rng.integers(5, 20))
        active_pumps = int(self.rng.integers(2, 8))
        dumper_cycle = float(self.rng.uniform(20.0, 60.0)) + (rainfall_24h * 0.5)
        pump_capacity = float(self.rng.uniform(300.0, 800.0))
        friction_coeff = float(np.clip(0.6 - (soil_moisture / 100.0) * 0.4, 0.15, 0.6))

        # 3. MOIL Target Baselines (Production logs)
        target_grade = float(mine["average_mn_grade_pct"])
        planned_tonnage = float(mine["default_daily_target_tonnes"] * 7)
        
        estimated_grade = float(target_grade - self.rng.uniform(-1.0, 3.5))
        ore_moisture = float(np.clip(soil_moisture * 0.3, 2.0, 30.0))
        stripping_ratio = float(mine["default_stripping_ratio"] + self.rng.uniform(-0.5, 2.5))

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
        Generates hybrid training dataset utilizing real Kaggle and IMD/Open-Meteo distributions.
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
            
            req = ShortfallPredictionRequest(
                satellite=telemetry_resp.satellite,
                equipment=telemetry_resp.equipment,
                geology=telemetry_resp.geology,
                forecast_days=7
            )
            feat = FeatureEngineeringPipeline.transform_request(req)
            rows.append(feat)

            # Ground truth targets based on the real dataset bounds mapped into physical equations
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

