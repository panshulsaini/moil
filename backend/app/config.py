"""
Application configuration settings using Pydantic Settings.
"""

from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Microservice application settings."""
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    APP_NAME: str = "MOIL Limited Predictive Intelligence ML Microservice"
    APP_VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = False
    CORS_ORIGINS: List[str] = ["*"]
    
    # Model Artifact Configuration
    MODEL_ARTIFACT_PATH: str = "model_artifacts/moil_shortfall_model.joblib"
    AUTO_TRAIN_ON_STARTUP: bool = True
    TRAIN_SAMPLES: int = 2500
    DATA_GENERATOR_SEED: int = 42


settings = Settings()
