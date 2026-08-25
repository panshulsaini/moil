"""
Health check and microservice status endpoint.
"""

import time
from typing import Dict, Any
from fastapi import APIRouter
from pydantic import BaseModel

from app.config import settings
from app.models.predictor import PredictorManager

router = APIRouter(tags=["Health"])

START_TIME = time.time()


class HealthCheckResponse(BaseModel):
    status: str
    service: str
    version: str
    model_loaded: bool
    model_type: str
    uptime_seconds: float


@router.get("/health", response_model=HealthCheckResponse)
async def health_check() -> Dict[str, Any]:
    """Returns microservice health status and model readiness."""
    manager = PredictorManager.get_instance(artifact_path=settings.MODEL_ARTIFACT_PATH)
    is_ml_loaded = manager.ml_predictor.is_trained
    
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "model_loaded": is_ml_loaded,
        "model_type": "RandomForestEnsemble" if is_ml_loaded else "HeuristicFallback",
        "uptime_seconds": round(time.time() - START_TIME, 2),
    }
