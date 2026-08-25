"""
Master data endpoints for MOIL manganese mining operations.
"""

from typing import Any, Dict, List
from fastapi import APIRouter, HTTPException

from app.models.data_generator import MOIL_MINES_METADATA, MINES_BY_ID

router = APIRouter(prefix="/mines", tags=["Mines Master Data"])


@router.get("", response_model=List[Dict[str, Any]])
async def get_all_mines() -> List[Dict[str, Any]]:
    """Returns master metadata for all 8 MOIL manganese mines."""
    return MOIL_MINES_METADATA


@router.get("/{mine_id}", response_model=Dict[str, Any])
async def get_mine_by_id(mine_id: str) -> Dict[str, Any]:
    """Returns detailed operational metadata for a specific MOIL mine."""
    normalized_id = mine_id.upper()
    if normalized_id in MINES_BY_ID:
        return MINES_BY_ID[normalized_id]

    # Substring search fallback
    for m_id, data in MINES_BY_ID.items():
        if normalized_id in m_id or normalized_id in data["name"].upper():
            return data

    raise HTTPException(
        status_code=404,
        detail=f"MOIL Mine with ID or name '{mine_id}' not found. Available IDs: {list(MINES_BY_ID.keys())}"
    )
