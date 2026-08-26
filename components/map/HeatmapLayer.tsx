"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat"; // Ensure this is imported

export function HeatmapLayer({ points }: { points: [number, number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (!points || points.length === 0) return;

    // @ts-ignore - leaflet.heat adds L.heatLayer
    const heat = L.heatLayer(points, {
      radius: 25,
      blur: 15,
      maxZoom: 14,
      max: 1.0,
      gradient: {
        0.4: "blue",
        0.6: "cyan",
        0.7: "lime",
        0.8: "yellow",
        1.0: "red"
      }
    }).addTo(map);

    return () => {
      map.removeLayer(heat);
    };
  }, [map, points]);

  return null;
}
