"use client";

import React, { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Polygon, Circle, Marker, Popup, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { useGlobalStore } from "@/lib/store";
import { MOIL_MINES } from "@/lib/mock-telemetry";
import { HeatmapLayer } from "./HeatmapLayer";

// ----------------------------------------------------------------------
// Custom Leaflet DivIcons (since default png icons often break in Next.js)
// ----------------------------------------------------------------------
const createTruckIcon = (color: string) =>
  L.divIcon({
    className: "bg-transparent",
    html: `<div style="
      background-color: ${color}; 
      width: 14px; 
      height: 14px; 
      border-radius: 50%; 
      border: 2px solid white; 
      box-shadow: 0 0 8px ${color};
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });

const createBoreholeIcon = () =>
  L.divIcon({
    className: "bg-transparent",
    html: `<div style="
      background-color: #10B981; 
      width: 12px; 
      height: 12px; 
      transform: rotate(45deg); 
      border: 2px solid #064E3B;
    "></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });

const mineIcon = L.divIcon({
  className: "bg-transparent",
  html: `<div style="
    background-color: #A855F7; 
    width: 20px; 
    height: 20px; 
    border-radius: 4px; 
    border: 2px solid #fff;
    box-shadow: 0 0 15px #A855F7;
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// ----------------------------------------------------------------------
// GeoJSON Mocks
// ----------------------------------------------------------------------
// Balaghat Approximate Mine Polygon
const balaghatPolygon: [number, number][] = [
  [21.8080, 80.1800],
  [21.8100, 80.1890],
  [21.8010, 80.1910],
  [21.7990, 80.1810],
];

const dongriPolygon: [number, number][] = [
  [21.5500, 79.6800],
  [21.5550, 79.7000],
  [21.5400, 79.7050],
  [21.5350, 79.6850],
];

const boreholes = [
  { id: "BH-1", lat: 21.8055, lng: 80.1855, depth: 145, grade: 46.2 },
  { id: "BH-2", lat: 21.8030, lng: 80.1830, depth: 180, grade: 44.8 },
  { id: "BH-3", lat: 21.5460, lng: 79.6920, depth: 95, grade: 41.5 },
];

const initialFleet = [
  { id: "TRK-01", lat: 21.8060, lng: 80.1820, type: "HAUL_TRUCK", color: "#F59E0B" },
  { id: "TRK-02", lat: 21.8020, lng: 80.1870, type: "HAUL_TRUCK", color: "#F59E0B" },
  { id: "EXC-01", lat: 21.8048, lng: 80.1849, type: "EXCAVATOR", color: "#8B5CF6" },
  { id: "TRK-03", lat: 21.5470, lng: 79.6950, type: "HAUL_TRUCK", color: "#F59E0B" },
];

// Helper component to auto-pan map when active mine changes
function MapFocusController({ activeMineId }: { activeMineId: string | null }) {
  const map = useMap();
  useEffect(() => {
    if (activeMineId) {
      const mine = MOIL_MINES.find((m) => m.id === activeMineId);
      if (mine) {
        map.flyTo([mine.latitude, mine.longitude], 14, { duration: 1.5 });
      }
    } else {
      // Zoom out to see Pan-India Prospectivity Hotspots
      map.flyTo([20.5937, 78.9629], 5, { duration: 1.5 });
    }
  }, [activeMineId, map]);
  return null;
}

export default function RealLeafletMap({ layers }: { layers: { showRainRadar: boolean, showSlopeHazards: boolean, showFleetGps: boolean, showSensors: boolean, showProspectivity: boolean } }) {
  const { activeMineId, isPlaying } = useGlobalStore();
  const [fleet, setFleet] = useState(initialFleet);
  const [heatmapData, setHeatmapData] = useState<[number, number, number][]>([]);

  // Fetch Prospectivity ML Data
  useEffect(() => {
    if (layers.showProspectivity) {
      const mineQuery = activeMineId ? `?mine_id=${activeMineId}` : "";
      fetch(`/api/prospectivity${mineQuery}`)
        .then(res => res.json())
        .then(data => setHeatmapData(data.data))
        .catch(err => console.error("Failed to load prospectivity model", err));
    } else {
      setHeatmapData([]);
    }
  }, [layers.showProspectivity, activeMineId]);

  // Animate fleet positions
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setFleet((prev) =>
        prev.map((v) => ({
          ...v,
          lat: v.lat + (Math.random() - 0.5) * 0.0005,
          lng: v.lng + (Math.random() - 0.5) * 0.0005,
        }))
      );
    }, 2000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const mapCenter: [number, number] = [21.68, 79.9]; // Center between Balaghat and Dongri

  return (
    <div className="w-full h-[600px] rounded-xl overflow-hidden border border-slate-800/80 shadow-2xl relative z-0">
      <MapContainer 
        center={mapCenter} 
        zoom={10} 
        style={{ height: "100%", width: "100%", backgroundColor: "#0E1528" }}
        className="z-0"
      >
        {/* Esri World Imagery Satellite Tiles */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        />
        
        <MapFocusController activeMineId={activeMineId} />

        {/* Polygons for Mining Concessions */}
        <Polygon positions={balaghatPolygon} color="#A855F7" fillColor="#A855F7" fillOpacity={0.15}>
          <Tooltip sticky>Balaghat Mining Lease Area</Tooltip>
        </Polygon>
        <Polygon positions={dongriPolygon} color="#3B82F6" fillColor="#3B82F6" fillOpacity={0.15}>
          <Tooltip sticky>Dongri Buzurg Mining Lease Area</Tooltip>
        </Polygon>

        {/* Mines Core Markers */}
        {MOIL_MINES.map((mine) => (
          <Marker key={mine.id} position={[mine.latitude, mine.longitude]} icon={mineIcon}>
            <Popup className="bg-[#0f172a] text-slate-200 border-slate-700">
              <div className="font-bold text-sm text-purple-400 mb-1">{mine.name}</div>
              <div className="text-xs">Type: {mine.mine_type}</div>
              <div className="text-xs">Target: {mine.target_daily_tonnage} MT/d</div>
            </Popup>
          </Marker>
        ))}

        {/* AI Prospectivity Heatmap (Kriging Output) */}
        {layers.showProspectivity && heatmapData.length > 0 && (
          <HeatmapLayer points={heatmapData} />
        )}

        {/* Precipitation / Soil Moisture Radar Hazard Layers */}
        {layers.showRainRadar && (
          <>
            <Circle center={[21.8048, 80.1849]} radius={4500} pathOptions={{ color: '#06B6D4', fillColor: '#06B6D4', fillOpacity: 0.2 }} />
            <Circle center={[21.5458, 79.6912]} radius={3000} pathOptions={{ color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.3 }} />
          </>
        )}

        {layers.showSlopeHazards && (
          <>
            <Circle center={[21.808, 80.187]} radius={600} pathOptions={{ color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.4, dashArray: "4 4" }}>
              <Tooltip>High Risk Inundation Zone</Tooltip>
            </Circle>
          </>
        )}

        {/* Live Fleet (Dumpers/Excavators) */}
        {layers.showFleetGps &&
          fleet.map((v) => (
            <Marker key={v.id} position={[v.lat, v.lng]} icon={createTruckIcon(v.color)}>
              <Tooltip>{v.id} ({v.type})</Tooltip>
            </Marker>
          ))
        }

        {/* Geological Boreholes (Bhukosh Simulator) */}
        {boreholes.map((bh) => (
          <Marker key={bh.id} position={[bh.lat, bh.lng]} icon={createBoreholeIcon()}>
            <Popup>
              <div className="text-xs">
                <strong className="text-emerald-500 block mb-1">GSI Borehole {bh.id}</strong>
                Depth: {bh.depth}m <br/>
                Mn Grade: {bh.grade}% <br/>
                Status: Explored
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
