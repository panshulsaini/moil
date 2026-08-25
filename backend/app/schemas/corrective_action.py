"""
Pydantic v2 schemas and enums for prescriptive operational corrective actions.
"""

from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, model_validator


class ActionCategory(str, Enum):
    """Operational categories for corrective actions."""
    PUMPING_DRAINAGE = "PUMPING_DRAINAGE"
    DEWATERING = "DEWATERING"
    HAULAGE_LOGISTICS = "HAULAGE_LOGISTICS"
    HAULAGE = "HAULAGE"
    FLEET_MANAGEMENT = "FLEET_MANAGEMENT"
    EQUIPMENT = "EQUIPMENT"
    GRADE_BLENDING = "GRADE_BLENDING"
    BLENDING = "BLENDING"
    MINE_PLANNING = "MINE_PLANNING"
    PLANNING = "PLANNING"


class PriorityLevel(str, Enum):
    """Priority level for executing corrective actions."""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class CorrectiveActionItem(BaseModel):
    """Operational corrective action recommendation item."""
    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    id: str = Field(..., description="Unique recommendation ID, e.g. ACT-DEWATER-01")
    category: ActionCategory = Field(..., description="Operational domain of the action")
    title: str = Field(..., description="Concise summary title of the corrective intervention")
    description: str = Field(..., description="Detailed actionable operational instructions")
    priority: PriorityLevel = Field(default=PriorityLevel.MEDIUM, description="Urgency priority level")
    estimated_recovery_tonnes: float = Field(
        default=0.0,
        ge=0.0,
        description="Estimated recoverable or safeguarded manganese ore in metric tonnes"
    )
    estimated_time_hours: float = Field(
        default=2.0,
        ge=0.1,
        le=72.0,
        description="Estimated lead time to deploy the intervention in hours"
    )
    impact_score: float = Field(
        default=5.0,
        ge=0.0,
        le=10.0,
        description="Expected effectiveness and risk reduction score (0-10)"
    )
    cost_estimate_inr: Optional[float] = Field(
        default=0.0,
        ge=0.0,
        description="Estimated operational cost in INR"
    )

    @model_validator(mode="before")
    @classmethod
    def handle_aliases(cls, data: any) -> any:
        if isinstance(data, dict):
            # Support alias fields from alternative specs
            if "estimated_tonnage_recovery" in data and "estimated_recovery_tonnes" not in data:
                data["estimated_recovery_tonnes"] = data["estimated_tonnage_recovery"]
            if "action_lead_time_hours" in data and "estimated_time_hours" not in data:
                data["estimated_time_hours"] = data["action_lead_time_hours"]
        return data
