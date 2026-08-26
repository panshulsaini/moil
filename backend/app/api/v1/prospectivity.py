"""
Prospectivity Mapping Route using simulated Kriging / XGBoost spatial inference.
"""
from fastapi import APIRouter, HTTPException
import math
import random
from typing import Any, Dict, List
from app.models.data_generator import MOIL_MINES_METADATA

router = APIRouter(prefix="/prospectivity", tags=["Geospatial Exploration"])

def generate_spatial_kriging_points(center_lat: float, center_lng: float, radius_km: float = 2.0, num_points: int = 150) -> List[List[float]]:
    """
    Generates synthetic 2D spatial heatmap points simulating an ML Mineral Prospectivity Model.
    Uses Perlin-like 2D Gaussian clusters.
    """
    points = []
    # Create 3-5 high-probability "ore body" clusters
    num_clusters = random.randint(3, 5)
    clusters = []
    
    # 1 km is roughly 0.009 degrees
    deg_radius = (radius_km / 111.0)
    
    for _ in range(num_clusters):
        clusters.append({
            "lat": center_lat + (random.uniform(-1, 1) * deg_radius),
            "lng": center_lng + (random.uniform(-1, 1) * deg_radius),
            "intensity": random.uniform(0.6, 1.0),
            "spread": random.uniform(0.002, 0.006)
        })

    for _ in range(num_points):
        lat_offset = random.uniform(-deg_radius, deg_radius)
        lng_offset = random.uniform(-deg_radius, deg_radius)
        
        p_lat = center_lat + lat_offset
        p_lng = center_lng + lng_offset
        
        # Calculate Kriging-like probability based on distance to clusters
        max_prob = 0.0
        for c in clusters:
            dist = math.sqrt((p_lat - c["lat"])**2 + (p_lng - c["lng"])**2)
            prob = c["intensity"] * math.exp(-(dist**2) / (2 * c["spread"]**2))
            if prob > max_prob:
                max_prob = prob
                
        # Add baseline noise for XGBoost uncertainty
        max_prob += random.uniform(0.05, 0.15)
        max_prob = min(1.0, max_prob)
        
        # Only keep points with decent probability to make heatmap look focused
        if max_prob > 0.3:
            points.append([p_lat, p_lng, max_prob])
            
    return points

@router.get("/")
async def get_mineral_prospectivity(mine_id: str) -> Dict[str, Any]:
    """
    Returns spatial probability heatmap data (lat, lng, intensity).
    Simulates output from an XGBoost + Kriging model analyzing satellite covariates.
    """
    mine = next((m for m in MOIL_MINES_METADATA if m["mine_id"] == mine_id), None)
    
    if not mine:
        raise HTTPException(status_code=404, detail="Mine not found for prospectivity mapping")
        
    heatmap_data = generate_spatial_kriging_points(
        center_lat=mine["latitude"],
        center_lng=mine["longitude"],
        radius_km=3.5,  # Scan area
        num_points=400  # Resolution
    )
    
    return {
        "status": "success",
        "model": "XGBoost + Universal Kriging Ensemble",
        "resolution_m": 30,
        "features_used": ["Sentinel-2 NDVI", "ASTER Lineaments", "GSI Geochem", "Topography DEM"],
        "data": heatmap_data
    }

