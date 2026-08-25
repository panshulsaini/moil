"""
Prediction and ML model training endpoints.
"""

from typing import List
from fastapi import APIRouter, HTTPException

from app.config import settings
from app.schemas.prediction import (
    BatchPredictionRequest,
    BatchPredictionResponse,
    RiskLevel,
    ShortfallPredictionRequest,
    ShortfallPredictionResponse,
    TrainingRequest,
    TrainingResponse,
)
from app.models.predictor import PredictorManager

router = APIRouter(tags=["Prediction"])


@router.post("/predict/shortfall", response_model=ShortfallPredictionResponse)
async def predict_shortfall(request: ShortfallPredictionRequest) -> ShortfallPredictionResponse:
    """
    Performs real-time shortfall prediction for a single mine sector.
    Fuses satellite rainfall, soil saturation, equipment telemetry, and geological block models.
    """
    try:
        manager = PredictorManager.get_instance(artifact_path=settings.MODEL_ARTIFACT_PATH)
        return manager.predict(request)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Inference error during shortfall prediction: {str(e)}"
        )


@router.post("/predict/batch", response_model=BatchPredictionResponse)
async def predict_batch(request: BatchPredictionRequest) -> BatchPredictionResponse:
    """
    Performs batch shortfall predictions across up to 50 mine sectors simultaneously.
    """
    manager = PredictorManager.get_instance(artifact_path=settings.MODEL_ARTIFACT_PATH)
    predictions: List[ShortfallPredictionResponse] = []
    high_risk_count = 0
    total_shortfall = 0.0

    for item in request.items:
        try:
            pred = manager.predict(item)
            predictions.append(pred)
            if pred.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]:
                high_risk_count += 1
            total_shortfall += pred.expected_shortfall_tonnes
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to process batch item for mine {item.geology.mine_id}: {str(e)}"
            )

    return BatchPredictionResponse(
        status="success",
        total_processed=len(predictions),
        predictions=predictions,
        summary_high_risk_count=high_risk_count,
        summary_total_shortfall_tonnes=round(total_shortfall, 2),
    )


@router.post("/train", response_model=TrainingResponse)
@router.post("/predict/train", response_model=TrainingResponse)
async def train_model(request: TrainingRequest) -> TrainingResponse:
    """
    Triggers model retraining on synthetic historical mining dataset.
    Serializes trained artifact to disk.
    """
    try:
        manager = PredictorManager.get_instance(artifact_path=settings.MODEL_ARTIFACT_PATH)
        response = manager.train_and_persist(
            n_samples=request.n_samples,
            random_state=request.random_state
        )
        return response
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Model training failed: {str(e)}"
        )
