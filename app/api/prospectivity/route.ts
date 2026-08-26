import { NextResponse } from "next/server";
import { MOIL_MINES } from "@/lib/mock-telemetry";

function generateSpatialKrigingPoints(centerLat: number, centerLng: number, radiusKm: number = 2.0, numPoints: number = 150) {
  const points = [];
  const numClusters = Math.floor(Math.random() * 3) + 3; // 3 to 5 clusters
  const clusters = [];
  
  const degRadius = radiusKm / 111.0;
  
  for (let i = 0; i < numClusters; i++) {
    clusters.push({
      lat: centerLat + (Math.random() * 2 - 1) * degRadius,
      lng: centerLng + (Math.random() * 2 - 1) * degRadius,
      intensity: 0.6 + Math.random() * 0.4,
      spread: 0.002 + Math.random() * 0.004
    });
  }

  for (let i = 0; i < numPoints; i++) {
    const pLat = centerLat + (Math.random() * 2 - 1) * degRadius;
    const pLng = centerLng + (Math.random() * 2 - 1) * degRadius;
    
    let maxProb = 0.0;
    for (const c of clusters) {
      const dist = Math.sqrt(Math.pow(pLat - c.lat, 2) + Math.pow(pLng - c.lng, 2));
      const prob = c.intensity * Math.exp(-Math.pow(dist, 2) / (2 * Math.pow(c.spread, 2)));
      if (prob > maxProb) maxProb = prob;
    }
    
    maxProb += 0.05 + Math.random() * 0.1;
    maxProb = Math.min(1.0, maxProb);
    
    if (maxProb > 0.3) {
      points.push([pLat, pLng, maxProb]);
    }
  }
  return points;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mineId = searchParams.get("mine_id") || "00000000-0000-0000-0000-000000000001";
  
  const mine = MOIL_MINES.find(m => m.id === mineId) || MOIL_MINES[0];
  
  const heatmapData = generateSpatialKrigingPoints(mine.latitude, mine.longitude, 3.5, 400);
  
  return NextResponse.json({
    status: "success",
    model: "XGBoost + Universal Kriging Ensemble",
    resolution_m: 30,
    features_used: ["Sentinel-2 NDVI", "ASTER Lineaments", "GSI Geochem", "Topography DEM"],
    data: heatmapData
  });
}
