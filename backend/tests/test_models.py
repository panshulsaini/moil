"""
Unit tests for Machine Learning and Heuristic predictors, synthetic data generator,
and prescriptive corrective action engine.
"""

import os
import tempfile
import pytest

from app.schemas.prediction import RiskLevel, ShortfallPredictionRequest
from app.models.feature_engineering import FeatureEngineeringPipeline
from app.models.data_generator import SyntheticMineDataGenerator, MOIL_MINES_METADATA
from app.models.predictor import (
    HeuristicShortfallPredictor,
    MLShortfallPredictor,
    PredictorManager,
)
from app.models.corrective_engine import PrescriptiveCorrectiveEngine
from app.schemas.corrective_action import ActionCategory, PriorityLevel


def test_synthetic_data_generator_mines_metadata():
    """Verify generator has accurate MOIL mines data."""
    gen = SyntheticMineDataGenerator(seed=42)
    assert len(MOIL_MINES_METADATA) == 8
    
    balaghat = gen.get_mine_metadata("MOIL-BAL-01")
    assert balaghat["name"] == "Balaghat Mine"
    assert balaghat["state"] == "Madhya Pradesh"
    assert balaghat["average_mn_grade_pct"] > 40.0

    dongri = gen.get_mine_metadata("MOIL-DBZ-02")
    assert dongri["name"] == "Dongri Buzurg Mine"
    assert "Opencast" in dongri["type"]


def test_synthetic_data_generator_scenarios():
    """Verify synthetic telemetry generation across scenarios."""
    gen = SyntheticMineDataGenerator(seed=123)

    # Monsoon Heavy scenario
    tel_monsoon = gen.generate_single_telemetry(mine_id="MOIL-BAL-01", scenario="monsoon_heavy")
    assert tel_monsoon.satellite.rainfall_24h_mm >= 50.0
    assert tel_monsoon.satellite.soil_moisture_pct >= 70.0

    # Normal Dry scenario
    tel_dry = gen.generate_single_telemetry(mine_id="MOIL-BAL-01", scenario="normal_dry")
    assert tel_dry.satellite.rainfall_24h_mm <= 15.0
    assert tel_dry.satellite.soil_moisture_pct <= 40.0


def test_synthetic_data_generator_training_dataset():
    """Verify training dataset generator produces non-empty, well-formed matrices."""
    gen = SyntheticMineDataGenerator(seed=42)
    X, y_bin, y_tonnes, y_grade = gen.generate_training_dataset(n_samples=200)

    assert len(X) == 200
    assert len(y_bin) == 200
    assert len(y_tonnes) == 200
    assert len(y_grade) == 200
    assert not X.isnull().any().any()
    assert set(y_bin.unique()).issubset({0, 1})


def test_heuristic_predictor_dry_vs_monsoon(dry_optimal_payload, monsoon_heavy_payload):
    """Verify deterministic heuristic predictor distinguishes risk regimes correctly."""
    req_dry = ShortfallPredictionRequest.model_validate(dry_optimal_payload)
    feat_dry = FeatureEngineeringPipeline.transform_request(req_dry)
    res_dry = HeuristicShortfallPredictor.predict(req_dry, feat_dry)

    assert res_dry["risk_level"] == RiskLevel.LOW
    assert res_dry["shortfall_probability"] < 0.30
    assert res_dry["expected_shortfall_tonnes"] == 0.0

    req_monsoon = ShortfallPredictionRequest.model_validate(monsoon_heavy_payload)
    feat_monsoon = FeatureEngineeringPipeline.transform_request(req_monsoon)
    res_monsoon = HeuristicShortfallPredictor.predict(req_monsoon, feat_monsoon)

    assert res_monsoon["risk_level"] in [RiskLevel.HIGH, RiskLevel.CRITICAL]
    assert res_monsoon["shortfall_probability"] >= 0.65
    assert res_monsoon["shortfall_predicted"] is True
    assert res_monsoon["expected_shortfall_tonnes"] > 1000.0


def test_ml_predictor_train_save_load_predict(valid_nested_payload):
    """Verify ML ensemble training, artifact serialization, loading, and inference."""
    gen = SyntheticMineDataGenerator(seed=42)
    X, y_bin, y_tonnes, y_grade = gen.generate_training_dataset(n_samples=300)

    predictor = MLShortfallPredictor()
    metrics = predictor.train(X, y_bin, y_tonnes, y_grade, random_state=42)

    assert metrics["accuracy"] >= 0.80
    assert metrics["f1_score"] >= 0.70
    assert predictor.is_trained is True

    # Test serialization to temp file
    with tempfile.TemporaryDirectory() as tmpdir:
        art_path = os.path.join(tmpdir, "test_model.joblib")
        predictor.save(art_path)
        assert os.path.exists(art_path)

        loaded_predictor = MLShortfallPredictor()
        success = loaded_predictor.load(art_path)
        assert success is True
        assert loaded_predictor.is_trained is True

        req = ShortfallPredictionRequest.model_validate(valid_nested_payload)
        features = FeatureEngineeringPipeline.transform_request(req)
        res = loaded_predictor.predict(req, features)

        assert 0.0 <= res["shortfall_probability"] <= 1.0
        assert res["risk_level"] in [RiskLevel.LOW, RiskLevel.MEDIUM, RiskLevel.HIGH, RiskLevel.CRITICAL]
        assert 0.50 <= res["confidence_score"] <= 1.0
        assert res["engine_used"] == "scikit_learn_random_forest_v1"


def test_corrective_engine_recommendations(monsoon_heavy_payload, dry_optimal_payload):
    """Verify prescriptive mitigation generator outputs prioritized actions for severe conditions."""
    req_monsoon = ShortfallPredictionRequest.model_validate(monsoon_heavy_payload)
    feat_monsoon = FeatureEngineeringPipeline.transform_request(req_monsoon)
    actions_monsoon = PrescriptiveCorrectiveEngine.generate_recommendations(
        req=req_monsoon,
        features=feat_monsoon,
        shortfall_prob=0.85,
        shortfall_tonnes=5000.0
    )

    categories = [a.category for a in actions_monsoon]
    assert ActionCategory.PUMPING_DRAINAGE in categories or ActionCategory.DEWATERING in categories
    assert ActionCategory.HAULAGE_LOGISTICS in categories or ActionCategory.HAULAGE in categories
    assert any(a.priority in [PriorityLevel.CRITICAL, PriorityLevel.HIGH] for a in actions_monsoon)

    # Dry optimal conditions should produce nominal monitoring action
    req_dry = ShortfallPredictionRequest.model_validate(dry_optimal_payload)
    feat_dry = FeatureEngineeringPipeline.transform_request(req_dry)
    actions_dry = PrescriptiveCorrectiveEngine.generate_recommendations(
        req=req_dry,
        features=feat_dry,
        shortfall_prob=0.10,
        shortfall_tonnes=0.0
    )
    assert len(actions_dry) >= 1
    assert actions_dry[0].priority == PriorityLevel.LOW


def test_predictor_manager_end_to_end(valid_nested_payload):
    """Verify PredictorManager coordinates complete prediction cycle."""
    manager = PredictorManager.get_instance()
    req = ShortfallPredictionRequest.model_validate(valid_nested_payload)
    response = manager.predict(req)

    assert response.status == "success"
    assert response.mine_id == "MOIL-BAL-01"
    assert 0.0 <= response.shortfall_probability <= 1.0
    assert len(response.corrective_actions) >= 1
    assert len(response.contributing_factors) >= 1
