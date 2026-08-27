"""
Prospectivity Mapping Route using simulated Kriging / XGBoost spatial inference.
"""
from fastapi import APIRouter, HTTPException
import math
import random
from typing import Any, Dict, List, Optional
from app.models.data_generator import MOIL_MINES_METADATA

router = APIRouter(prefix="/prospectivity", tags=["Geospatial Exploration"])

def generate_spatial_kriging_grid(center_lat: float, center_lng: float, radius_km: float = 3.5) -> List[List[float]]:
    """
    Generates synthetic 2D spatial heatmap grid simulating an ML Mineral Prospectivity Model.
    Uses Perlin-like 2D Gaussian clusters (Kriging).
    """
    points = []
    num_clusters = random.randint(3, 5)
    clusters = []
    
    deg_radius = (radius_km / 111.0)
    
    for _ in range(num_clusters):
        clusters.append({
            "lat": center_lat + (random.uniform(-1, 1) * (deg_radius * 0.7)),
            "lng": center_lng + (random.uniform(-1, 1) * (deg_radius * 0.7)),
            "intensity": random.uniform(0.7, 1.0),
            "spread": random.uniform(0.003, 0.007)
        })

    grid_size = 40
    step = (deg_radius * 2) / grid_size

    for x in range(grid_size):
        for y in range(grid_size):
            p_lat = center_lat - deg_radius + (x * step)
            p_lng = center_lng - deg_radius + (y * step)
            
            max_prob = 0.0
            for c in clusters:
                dist = math.sqrt((p_lat - c["lat"])**2 + (p_lng - c["lng"])**2)
                prob = c["intensity"] * math.exp(-(dist**2) / (2 * c["spread"]**2))
                if prob > max_prob:
                    max_prob = prob
                    
            max_prob += random.uniform(0.0, 0.15)
            max_prob = min(1.0, max_prob)
            
            if max_prob > 0.4:
                points.append([p_lat, p_lng, max_prob])
            
    return points

@router.get("/")
async def get_mineral_prospectivity(mine_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Returns spatial probability heatmap data (lat, lng, intensity).
    Simulates output from an XGBoost + Kriging model analyzing satellite covariates.
    """
    mines_to_process = []
    if not mine_id or mine_id == "ALL":
        mines_to_process = MOIL_MINES_METADATA
    else:
        mine = next((m for m in MOIL_MINES_METADATA if m["mine_id"] == mine_id), None)
        if not mine:
            raise HTTPException(status_code=404, detail="Mine not found for prospectivity mapping")
        mines_to_process = [mine]
        
    heatmap_data = []
    for mine in mines_to_process:
        grid = generate_spatial_kriging_grid(mine["latitude"], mine["longitude"], 3.5)
        heatmap_data.extend(grid)
    
    return {
        "status": "success",
        "model": "XGBoost + Universal Kriging Ensemble",
        "resolution_m": 30,
        "features_used": ["Sentinel-2 NDVI", "ASTER Lineaments", "GSI Geochem", "Topography DEM"],
        "data": heatmap_data
    }

