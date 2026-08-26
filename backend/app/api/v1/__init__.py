"""
API v1 router aggregations.
"""

from fastapi import APIRouter

from app.api.v1.health import router as health_router
from app.api.v1.mines import router as mines_router
from app.api.v1.telemetry import router as telemetry_router
from app.api.v1.predict import router as predict_router
from app.api.v1.prospectivity import router as prospectivity_router

api_v1_router = APIRouter()
api_v1_router.include_router(health_router)
api_v1_router.include_router(mines_router)
api_v1_router.include_router(telemetry_router)
api_v1_router.include_router(predict_router)
api_v1_router.include_router(prospectivity_router)

__all__ = ["api_v1_router"]
