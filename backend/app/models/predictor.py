"""
Predictive Engine implementation combining Scikit-Learn Machine Learning Ensemble
(RandomForest Classifier & Regressors) with a deterministic Heuristic Fallback
for zero-cold-start resilience.
"""

from datetime import datetime, timezone
import os
from typing import Any, Dict, List, Optional, Tuple
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import accuracy_score, f1_score, r2_score

from app.schemas.prediction import (
    FeatureContribution,
    RiskLevel,
    ShortfallPredictionRequest,
    ShortfallPredictionResponse,
    TrainingResponse,
)
from app.models.feature_engineering import (
    FeatureEngineeringPipeline,
    FEATURE_NAMES,
)
from app.models.corrective_engine import PrescriptiveCorrectiveEngine


class HeuristicShortfallPredictor:
    """
    Deterministic rule-based baseline shortfall predictor.
    Guarantees 100% service uptime with zero cold-start latency.
    """

    @staticmethod
    def classify_risk(prob: float) -> RiskLevel:
        if prob < 0.30:
            return RiskLevel.LOW
        elif prob < 0.65:
            return RiskLevel.MEDIUM
        elif prob < 0.85:
            return RiskLevel.HIGH
        else:
            return RiskLevel.CRITICAL

    @classmethod
    def predict(
        cls,
        req: ShortfallPredictionRequest,
        features: Dict[str, float]
    ) -> Dict[str, Any]:
        """Performs deterministic heuristic inference."""
        pmsi = features["pmsi"]
        ddr = features["ddr"]
        eeti = features["eeti"]
        ehp = features["ehp"]
        gdrf = features["gdrf"]
        sbp = features["sbp"]
        hrrm = features["hrrm"]

        # 1. Weather Impact Score [0.0 - 1.0]
        weather_score = (pmsi / 100.0) * 0.40 + ddr * 0.60

        # 2. Equipment Impact Score [0.0 - 1.0]
        equip_score = (1.0 - min(1.0, eeti)) * 0.55 + ehp * 0.45

        # 3. Geological & Stripping Impact [0.0 - 1.0]
        geo_score = gdrf * 0.65 + min(1.0, sbp) * 0.35

        # Composite Probability
        raw_prob = (weather_score * 0.45) + (equip_score * 0.35) + (geo_score * 0.20)
        prob = max(0.02, min(0.98, raw_prob))
        risk_lvl = cls.classify_risk(prob)
        shortfall_flag = prob >= 0.35

        # Predicted Shortfall Magnitude
        planned_tonnage = req.geology.planned_tonnage
        tonnage_shortfall = max(0.0, planned_tonnage * prob * 0.85) if shortfall_flag else 0.0

        # Predicted Grade Degradation
        target_grade = req.geology.target_grade_mn_pct
        grade_degradation = max(0.0, target_grade * geo_score * 0.25) if (geo_score > 0.10) else 0.0

        # Confidence Score Formulation
        confidence = 0.88 if (0.15 <= prob <= 0.85) else 0.94

        # Risk attribution contributions
        total_risk_mass = max(0.01, weather_score + equip_score + geo_score + (hrrm - 1.0))
        c_weather = round(weather_score / total_risk_mass, 3)
        c_equip = round(equip_score / total_risk_mass, 3)
        c_geo = round(geo_score / total_risk_mass, 3)
        c_haul = round(max(0.0, (hrrm - 1.0) * 0.5) / total_risk_mass, 3)

        contributions_dict = {
            "excess_rainfall_telemetry_index": c_weather,
            "pump_moisture_saturation_index": round(ddr, 3),
            "haul_road_resistance_multiplier": c_haul,
            "equipment_health_penalty": round(ehp, 3),
            "grade_dilution_risk_factor": round(gdrf, 3),
        }

        contributing_factors = [
            FeatureContribution(
                factor_name="Precipitation & Dewatering Stress",
                contribution_pct=round(c_weather * 100, 1),
                description=f"Rainfall: {req.satellite.rainfall_24h_mm}mm, Soil Saturation: {req.satellite.soil_moisture_pct}%, Deficit: {round(ddr*100, 1)}%",
                severity="HIGH" if weather_score > 0.5 else "LOW",
            ),
            FeatureContribution(
                factor_name="Equipment & Haulage Resistance",
                contribution_pct=round((c_equip + c_haul) * 100, 1),
                description=f"Fleet Availability: {req.equipment.fleet_availability_pct}%, Cycle Time: {req.equipment.dumper_cycle_time_min}m",
                severity="HIGH" if (equip_score > 0.5 or hrrm > 1.3) else "MEDIUM" if (equip_score > 0.3) else "LOW",
            ),
            FeatureContribution(
                factor_name="Geological Ore Purity & Stripping",
                contribution_pct=round(c_geo * 100, 1),
                description=f"Target: {target_grade}% Mn vs Block: {req.geology.estimated_block_grade_mn_pct}% Mn, Stripping: {req.geology.stripping_ratio}:1",
                severity="HIGH" if geo_score > 0.5 else "LOW",
            ),
        ]

        return {
            "shortfall_predicted": shortfall_flag,
            "shortfall_probability": round(prob, 4),
            "risk_level": risk_lvl,
            "confidence_score": round(confidence, 4),
            "expected_shortfall_tonnes": round(tonnage_shortfall, 2),
            "expected_grade_degradation_pct": round(grade_degradation, 2),
            "contributing_factors": contributing_factors,
            "feature_contributions": contributions_dict,
            "engine_used": "deterministic_heuristic_v1",
        }


class MLShortfallPredictor:
    """
    Production-grade Scikit-Learn ML Ensemble Predictor.
    Uses RandomForestClassifier for probability and RandomForestRegressors for magnitude.
    """

    def __init__(self):
        self.clf: Optional[RandomForestClassifier] = None
        self.reg_tonnes: Optional[RandomForestRegressor] = None
        self.reg_grade: Optional[RandomForestRegressor] = None
        self.is_trained: bool = False
        self.feature_names: List[str] = FEATURE_NAMES
        self.feature_importances_: Optional[np.ndarray] = None

    def train(
        self,
        X: pd.DataFrame,
        y_binary: pd.Series,
        y_tonnes: pd.Series,
        y_grade: pd.Series,
        random_state: int = 42
    ) -> Dict[str, float]:
        """Trains the classification and regression models on provided dataset."""
        # 1. Classification model
        self.clf = RandomForestClassifier(
            n_estimators=150,
            max_depth=7,
            min_samples_split=4,
            class_weight="balanced",
            random_state=random_state,
            n_jobs=-1
        )
        self.clf.fit(X, y_binary)
        pred_bin = self.clf.predict(X)
        acc = float(accuracy_score(y_binary, pred_bin))
        f1 = float(f1_score(y_binary, pred_bin, zero_division=0))

        # 2. Shortfall tonnage regression model
        self.reg_tonnes = RandomForestRegressor(
            n_estimators=100,
            max_depth=6,
            random_state=random_state,
            n_jobs=-1
        )
        self.reg_tonnes.fit(X, y_tonnes)
        pred_tonnes = self.reg_tonnes.predict(X)
        r2_tonnes = float(r2_score(y_tonnes, pred_tonnes))

        # 3. Grade degradation regression model
        self.reg_grade = RandomForestRegressor(
            n_estimators=100,
            max_depth=5,
            random_state=random_state,
            n_jobs=-1
        )
        self.reg_grade.fit(X, y_grade)

        self.feature_importances_ = self.clf.feature_importances_
        self.is_trained = True

        return {
            "accuracy": round(acc, 4),
            "f1_score": round(f1, 4),
            "r2_tonnage": round(r2_tonnes, 4),
        }

    def save(self, filepath: str) -> None:
        """Serializes trained model artifact to disk."""
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        artifact = {
            "clf": self.clf,
            "reg_tonnes": self.reg_tonnes,
            "reg_grade": self.reg_grade,
            "feature_names": self.feature_names,
            "feature_importances_": self.feature_importances_,
            "saved_at": datetime.now(timezone.utc).isoformat(),
        }
        joblib.dump(artifact, filepath)

    def load(self, filepath: str) -> bool:
        """Loads serialized model artifact from disk."""
        if not os.path.exists(filepath):
            return False
        try:
            artifact = joblib.load(filepath)
            self.clf = artifact["clf"]
            self.reg_tonnes = artifact["reg_tonnes"]
            self.reg_grade = artifact["reg_grade"]
            self.feature_names = artifact.get("feature_names", FEATURE_NAMES)
            self.feature_importances_ = artifact.get("feature_importances_")
            self.is_trained = True
            return True
        except Exception:
            self.is_trained = False
            return False

    def predict(
        self,
        req: ShortfallPredictionRequest,
        features: Dict[str, float]
    ) -> Dict[str, Any]:
        """Performs ML inference using trained ensemble."""
        if not self.is_trained or self.clf is None or self.reg_tonnes is None:
            # Automatic fallback to heuristic
            return HeuristicShortfallPredictor.predict(req, features)

        X_vec = FeatureEngineeringPipeline.to_vector(features)
        
        # Shortfall probability & tree variance for confidence
        prob_classes = self.clf.predict_proba(X_vec)[0]
        prob = float(prob_classes[1]) if len(prob_classes) > 1 else float(prob_classes[0])
        
        # Calculate tree variance across estimators for confidence estimation
        tree_preds = np.array([tree.predict_proba(X_vec)[0][1] for tree in self.clf.estimators_])
        tree_std = float(np.std(tree_preds))
        confidence = max(0.55, min(0.99, 1.0 - (1.5 * tree_std)))

        risk_lvl = HeuristicShortfallPredictor.classify_risk(prob)
        shortfall_flag = prob >= 0.35

        # Predict quantitative tonnage shortfall
        raw_tonnes = float(self.reg_tonnes.predict(X_vec)[0])
        tonnage_shortfall = max(0.0, raw_tonnes) if shortfall_flag else 0.0

        # Predict grade degradation
        raw_grade = float(self.reg_grade.predict(X_vec)[0]) if self.reg_grade else 0.0
        grade_degradation = max(0.0, raw_grade) if (prob >= 0.30) else 0.0

        # Feature Attribution based on model weights
        importances = self.feature_importances_ if self.feature_importances_ is not None else np.ones(len(FEATURE_NAMES))
        feat_vals = X_vec.flatten()
        attributions = np.abs(feat_vals * importances)
        tot_attr = max(1e-6, np.sum(attributions))
        norm_attr = attributions / tot_attr

        # Group into top categories
        weather_pct = float(np.sum(norm_attr[[0, 1, 2, 3, 4, 18, 20]])) * 100
        equip_pct = float(np.sum(norm_attr[[5, 6, 7, 8, 9, 10, 11, 17, 19, 23 if len(norm_attr)>23 else 20]])) * 100
        geo_pct = max(0.0, 100.0 - weather_pct - equip_pct)

        contributions_dict = {
            "excess_rainfall_telemetry_index": round(float(features.get("pmsi", 0.0)) / 100.0, 3),
            "pump_moisture_saturation_index": round(float(features.get("ddr", 0.0)), 3),
            "haul_road_resistance_multiplier": round(float(features.get("hrrm", 1.0) - 1.0), 3),
            "equipment_health_penalty": round(float(features.get("ehp", 0.0)), 3),
            "grade_dilution_risk_factor": round(float(features.get("gdrf", 0.0)), 3),
        }

        contributing_factors = [
            FeatureContribution(
                factor_name="Precipitation & Dewatering Stress",
                contribution_pct=round(weather_pct, 1),
                description=f"Rainfall: {req.satellite.rainfall_24h_mm}mm, Soil Saturation: {req.satellite.soil_moisture_pct}%, Deficit: {round(features['ddr']*100, 1)}%",
                severity="HIGH" if features["pmsi"] > 50 else "LOW",
            ),
            FeatureContribution(
                factor_name="Equipment & Haulage Logistics",
                contribution_pct=round(equip_pct, 1),
                description=f"Fleet Availability: {req.equipment.fleet_availability_pct}%, Cycle Time: {req.equipment.dumper_cycle_time_min}m, Downtime: {req.equipment.unscheduled_downtime_hours}h",
                severity="HIGH" if (features["eeti"] < 0.7 or features["ehp"] > 0.4) else "MEDIUM" if (features["eeti"] < 0.85) else "LOW",
            ),
            FeatureContribution(
                factor_name="Geological Block Model & Stripping",
                contribution_pct=round(geo_pct, 1),
                description=f"Target: {req.geology.target_grade_mn_pct}% Mn vs Block: {req.geology.estimated_block_grade_mn_pct}% Mn, Stripping: {req.geology.stripping_ratio}:1",
                severity="HIGH" if features["gdrf"] > 0.25 else "LOW",
            ),
        ]

        return {
            "shortfall_predicted": shortfall_flag,
            "shortfall_probability": round(prob, 4),
            "risk_level": risk_lvl,
            "confidence_score": round(confidence, 4),
            "expected_shortfall_tonnes": round(tonnage_shortfall, 2),
            "expected_grade_degradation_pct": round(grade_degradation, 2),
            "contributing_factors": contributing_factors,
            "feature_contributions": contributions_dict,
            "engine_used": "scikit_learn_random_forest_v1",
        }


class PredictorManager:
    """
    High-level manager coordinating ML inference, heuristic fallback,
    and corrective action generation.
    """

    _instance: Optional["PredictorManager"] = None

    def __init__(self, artifact_path: str = "model_artifacts/moil_shortfall_model.joblib"):
        self.artifact_path = artifact_path
        self.ml_predictor = MLShortfallPredictor()
        self.heuristic_predictor = HeuristicShortfallPredictor()
        self.initialize_model()

    @classmethod
    def get_instance(cls, artifact_path: str = "model_artifacts/moil_shortfall_model.joblib") -> "PredictorManager":
        if cls._instance is None:
            cls._instance = cls(artifact_path=artifact_path)
        return cls._instance

    def initialize_model(self) -> None:
        """Attempts to load existing model from disk, or prepares heuristic."""
        if os.path.exists(self.artifact_path):
            loaded = self.ml_predictor.load(self.artifact_path)
            if loaded:
                return

    def train_and_persist(self, n_samples: int = 2500, random_state: int = 42) -> TrainingResponse:
        """Trains ML predictor on synthetic dataset and saves to artifact path."""
        from app.models.data_generator import SyntheticMineDataGenerator
        generator = SyntheticMineDataGenerator(seed=random_state)
        X, y_bin, y_tonnes, y_grade = generator.generate_training_dataset(n_samples=n_samples)
        
        metrics = self.ml_predictor.train(X, y_bin, y_tonnes, y_grade, random_state=random_state)
        self.ml_predictor.save(self.artifact_path)

        return TrainingResponse(
            status="success",
            model_type="RandomForestEnsemble (Classifier + Dual Regressors)",
            n_samples=n_samples,
            accuracy=metrics["accuracy"],
            f1_score=metrics["f1_score"],
            r2_tonnage=metrics["r2_tonnage"],
            artifact_path=self.artifact_path,
        )

    def predict(self, req: ShortfallPredictionRequest) -> ShortfallPredictionResponse:
        """
        Executes end-to-end prediction pipeline:
        Feature Engineering -> Model Scoring (ML or Heuristic) -> Corrective Actions.
        """
        features = FeatureEngineeringPipeline.transform_request(req)

        if self.ml_predictor.is_trained:
            result = self.ml_predictor.predict(req, features)
        else:
            result = self.heuristic_predictor.predict(req, features)

        # Prescriptive Corrective Actions Generation
        actions = PrescriptiveCorrectiveEngine.generate_recommendations(
            req=req,
            features=features,
            shortfall_prob=result["shortfall_probability"],
            shortfall_tonnes=result["expected_shortfall_tonnes"]
        )

        return ShortfallPredictionResponse(
            status="success",
            mine_id=req.geology.mine_id,
            mine_name=req.geology.mine_name,
            sector_id=req.geology.sector_id,
            shortfall_predicted=result["shortfall_predicted"],
            shortfall_probability=result["shortfall_probability"],
            risk_level=result["risk_level"],
            confidence_score=result["confidence_score"],
            expected_shortfall_tonnes=result["expected_shortfall_tonnes"],
            expected_grade_degradation_pct=result["expected_grade_degradation_pct"],
            contributing_factors=result["contributing_factors"],
            feature_contributions=result.get("feature_contributions"),
            corrective_actions=actions,
            engine_used=result["engine_used"],
        )
