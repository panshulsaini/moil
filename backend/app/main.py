"""
FastAPI Application Entrypoint for MOIL Limited Predictive Intelligence ML Microservice.
"""

from contextlib import asynccontextmanager
import logging
from typing import Any, Dict
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.api.v1 import api_v1_router
from app.models.predictor import PredictorManager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("moil_ml_service")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for model initialization and training on boot."""
    logger.info("Initializing MOIL ML Microservice...")
    try:
        manager = PredictorManager.get_instance(artifact_path=settings.MODEL_ARTIFACT_PATH)
        if not manager.ml_predictor.is_trained and settings.AUTO_TRAIN_ON_STARTUP:
            logger.info("Training initial baseline Random Forest ML model on synthetic dataset...")
            res = manager.train_and_persist(
                n_samples=settings.TRAIN_SAMPLES,
                random_state=settings.DATA_GENERATOR_SEED
            )
            logger.info(f"Baseline ML model trained successfully: Acc={res.accuracy}, F1={res.f1_score}, R2={res.r2_tonnage}")
        else:
            logger.info(f"Model status: trained={manager.ml_predictor.is_trained}")
    except Exception as e:
        logger.warning(f"ML model auto-training on startup encountered an issue: {e}. Heuristic fallback is active.")
    
    yield
    logger.info("Shutting down MOIL ML Microservice.")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "Production AI/ML microservice for MOIL Limited. "
        "Fuses multi-modal satellite weather telemetry, heavy equipment telematics, "
        "and geological ore body models to predict manganese reserve shortfalls and generate "
        "prescriptive operational mitigation actions."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API v1 Routers
app.include_router(api_v1_router, prefix=settings.API_V1_PREFIX)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Transforms Pydantic validation errors into structured 422 JSON response."""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "status": "error",
            "error_type": "ValidationError",
            "message": "Input validation failed. Please check field types and range constraints.",
            "details": exc.errors(),
        },
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """Global handler for unhandled internal server exceptions."""
    logger.error(f"Unhandled exception on {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "status": "error",
            "error_type": "InternalServerError",
            "message": "An unexpected error occurred during prediction processing.",
            "detail": str(exc) if settings.DEBUG else None,
        },
    )


@app.get("/", tags=["Root"])
async def root() -> Dict[str, Any]:
    """Root metadata and microservice discovery endpoint."""
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "online",
        "docs_url": "/docs",
        "health_check_url": f"{settings.API_V1_PREFIX}/health",
        "mines_catalog_url": f"{settings.API_V1_PREFIX}/mines",
        "simulated_telemetry_url": f"{settings.API_V1_PREFIX}/telemetry/simulated",
        "predict_shortfall_url": f"{settings.API_V1_PREFIX}/predict/shortfall",
        "predict_batch_url": f"{settings.API_V1_PREFIX}/predict/batch",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
