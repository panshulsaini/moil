"use client";

import * as React from "react";
import { MOIL_MINES, MOCK_GPS_FLEET } from "@/lib/mock-telemetry";
import { MineDetailDrawer } from "./MineDetailDrawer";
import { HazardLayerControls, MapLayerState } from "./HazardLayerControls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Navigation,
  Compass,
  MapPin,
  Truck,
  CloudRain,
  ShieldAlert,
  Radio,
} from "lucide-react";
import { getRiskColor } from "@/lib/utils";

export function GisMiningMap() {
  const [selectedMineId, setSelectedMineId] = React.useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = React.useState<number>(1);
  const [layers, setLayers] = React.useState<MapLayerState>({
    showRainRadar: true,
    showSlopeHazards: true,
    showFleetGps: true,
    showSensors: true,
  });

  // Coordinate projection mapping for Vidarbha-Balaghat box
  // Lat: 21.2 to 22.1 (South to North) -> Y from 520 to 80
  // Lng: 78.8 to 80.6 (West to East) -> X from 80 to 820
  const projectCoords = (lat: number, lng: number) => {
    const minLat = 21.2;
    const maxLat = 22.1;
    const minLng = 78.8;
    const maxLng = 80.6;

    const x = 80 + ((lng - minLng) / (maxLng - minLng)) * 740;
    const y = 520 - ((lat - minLat) / (maxLat - minLat)) * 440;
    return { x, y };
  };

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.max(0.8, Math.min(2.2, prev + delta)));
  };

  return (
    <div className="relative w-full h-[620px] rounded-xl border border-slate-800/90 bg-[#080D18] overflow-hidden shadow-2xl select-none">
      {/* Top Map Header & Controls */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0B101D]/90 border border-slate-700/80 shadow-md backdrop-blur-md">
          <Compass className="h-4 w-4 text-purple-400 animate-spin-slow" />
          <span className="text-xs font-semibold text-white tracking-wide">
            Vidarbha-Balaghat Manganese Mining Corridor (MH / MP)
          </span>
          <Badge variant="purple" className="text-[9px] font-mono">
            8 SITES
          </Badge>
        </div>
      </div>

      {/* Layer Controls Float */}
      <div className="absolute bottom-4 left-4 z-20 w-64">
        <HazardLayerControls layers={layers} onChange={setLayers} />
      </div>

      {/* Zoom Toolbar */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5 bg-[#0B101D]/90 border border-slate-700/80 p-1 rounded-lg shadow-lg backdrop-blur-md">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleZoom(0.2)}
          className="h-7 w-7 text-slate-300 hover:text-white"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleZoom(-0.2)}
          className="h-7 w-7 text-slate-300 hover:text-white"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setZoomLevel(1)}
          className="h-7 w-7 text-slate-300 hover:text-white"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Interactive Vector GIS Canvas */}
      <div className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing">
        <svg
          viewBox="0 0 900 600"
          className="w-full h-full transition-transform duration-300"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <defs>
            {/* Topographic grid pattern */}
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="#131B2C"
                strokeWidth="0.8"
              />
            </pattern>

            {/* Precipitation storm radar radial gradient */}
            <radialGradient id="stormRadarBalaghat" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#06B6D4" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="stormRadarDongri" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.5" />
              <stop offset="70%" stopColor="#3B82F6" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background Grid */}
          <rect width="900" height="600" fill="url(#grid)" />

          {/* Regional Topographic Contour Outlines (Vidarbha Basin & Satpura Range foothills) */}
          <path
            d="M 120 480 Q 250 420 450 450 T 800 400"
            fill="none"
            stroke="#1E293B"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
          <path
            d="M 100 280 Q 350 200 600 240 T 820 180"
            fill="none"
            stroke="#1E293B"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
          <path
            d="M 220 120 Q 480 80 750 110"
            fill="none"
            stroke="#1E293B"
            strokeWidth="1.5"
          />

          {/* State Boundary Line (Maharashtra - Madhya Pradesh) */}
          <path
            d="M 80 320 Q 300 310 500 290 T 820 260"
            fill="none"
            stroke="#8B5CF6"
            strokeWidth="1.5"
            strokeDasharray="6 4"
            opacity="0.6"
          />
          <text
            x="140"
            y="295"
            fill="#A78BFA"
            fontSize="10"
            fontFamily="monospace"
            letterSpacing="2"
          >
            MADHYA PRADESH (BALAGHAT DISTRICT)
          </text>
          <text
            x="140"
            y="345"
            fill="#94A3B8"
            fontSize="10"
            fontFamily="monospace"
            letterSpacing="2"
          >
            MAHARASHTRA (NAGPUR & BHANDARA DISTRICTS)
          </text>

          {/* Layer: Precipitation Radar Heatmap Overlays */}
          {layers.showRainRadar && (
            <g className="animate-pulse-slow">
              {/* Balaghat sector rain cell */}
              <circle
                cx={projectCoords(21.8124, 80.1832).x}
                cy={projectCoords(21.8124, 80.1832).y}
                r="90"
                fill="url(#stormRadarBalaghat)"
              />
              {/* Dongri Buzurg rain cell */}
              <circle
                cx={projectCoords(21.5638, 79.7121).x}
                cy={projectCoords(21.5638, 79.7121).y}
                r="110"
                fill="url(#stormRadarDongri)"
              />
            </g>
          )}

          {/* Layer: Slope Instability Hazard Radius Buffers */}
          {layers.showSlopeHazards && (
            <g>
              {/* Dongri Buzurg highwall hazard buffer */}
              <circle
                cx={projectCoords(21.5638, 79.7121).x}
                cy={projectCoords(21.5638, 79.7121).y}
                r="45"
                fill="#EF4444"
                fillOpacity="0.15"
                stroke="#EF4444"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              {/* Balaghat shaft inundation buffer */}
              <circle
                cx={projectCoords(21.8124, 80.1832).x}
                cy={projectCoords(21.8124, 80.1832).y}
                r="40"
                fill="#EF4444"
                fillOpacity="0.12"
                stroke="#EF4444"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
            </g>
          )}

          {/* Layer: Live Fleet Machinery GPS Pins */}
          {layers.showFleetGps && (
            <g>
              {MOCK_GPS_FLEET.map((f) => {
                const pos = projectCoords(f.lat, f.lng);
                return (
                  <g key={f.id} className="cursor-pointer">
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r="4"
                      fill={f.type === "HAUL_TRUCK" ? "#F59E0B" : "#8B5CF6"}
                      stroke="#FFFFFF"
                      strokeWidth="1"
                    />
                    <text
                      x={pos.x + 6}
                      y={pos.y + 3}
                      fill="#E2E8F0"
                      fontSize="8"
                      fontFamily="monospace"
                    >
                      {f.code}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* MOIL Mining Site Pins */}
          {MOIL_MINES.map((mine) => {
            const { x, y } = projectCoords(mine.latitude, mine.longitude);
            const isSelected = selectedMineId === mine.id;
            const isCritical = mine.risk_level === "CRITICAL";
            const isHigh = mine.risk_level === "HIGH";

            const auraColor = isCritical
              ? "#EF4444"
              : isHigh
              ? "#F59E0B"
              : "#10B981";

            return (
              <g
                key={mine.id}
                onClick={() => setSelectedMineId(mine.id)}
                className="cursor-pointer group"
              >
                {/* Pulsating risk aura */}
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? "22" : "16"}
                  fill={auraColor}
                  fillOpacity="0.25"
                  className={isCritical ? "animate-ping" : ""}
                />
                <circle
                  cx={x}
                  cy={y}
                  r="10"
                  fill="#0B1220"
                  stroke={auraColor}
                  strokeWidth={isSelected ? "3" : "2"}
                />
                <circle cx={x} cy={y} r="4" fill={auraColor} />

                {/* Site Label Tag */}
                <g transform={`translate(${x}, ${y - 16})`}>
                  <rect
                    x="-45"
                    y="-16"
                    width="90"
                    height="18"
                    rx="4"
                    fill="#0F172A"
                    stroke={isSelected ? "#A855F7" : "#334155"}
                    strokeWidth="1"
                    className="shadow-lg"
                  />
                  <text
                    x="0"
                    y="-4"
                    textAnchor="middle"
                    fill="#F8FAFC"
                    fontSize="9"
                    fontWeight="bold"
                  >
                    {mine.name.replace(" Mine", "")}
                  </text>
                </g>

                {/* Subtitle yield */}
                <text
                  x={x}
                  y={y + 20}
                  textAnchor="middle"
                  fill="#94A3B8"
                  fontSize="8"
                  fontFamily="monospace"
                >
                  {mine.current_daily_tonnage} MT/d
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Detail Flyout Drawer */}
      <MineDetailDrawer
        mineId={selectedMineId}
        onClose={() => setSelectedMineId(null)}
      />
    </div>
  );
}
