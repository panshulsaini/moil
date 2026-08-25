"use client";

import * as React from "react";
import { MOIL_MINES, MOCK_GPS_FLEET } from "@/lib/mock-telemetry";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getRiskColor, formatTonnage } from "@/lib/utils";
import {
  X,
  MapPin,
  CloudRain,
  Droplets,
  Truck,
  Gauge,
  Sliders,
  Radio,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

export interface MineDetailDrawerProps {
  mineId: string | null;
  onClose: () => void;
}

export function MineDetailDrawer({ mineId, onClose }: MineDetailDrawerProps) {
  if (!mineId) return null;

  const mine = MOIL_MINES.find((m) => m.id === mineId || m.code === mineId) || MOIL_MINES[0];
  const fleet = MOCK_GPS_FLEET.filter((f) => f.mine_id === mine.id);
  const risk = getRiskColor(mine.risk_level);

  return (
    <div className="absolute right-4 top-4 bottom-4 w-80 md:w-96 rounded-xl border border-slate-700/80 bg-[#0C1220]/95 shadow-2xl backdrop-blur-md p-4 flex flex-col justify-between z-30 overflow-y-auto animate-in slide-in-from-right-10 duration-200">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-white">{mine.name}</span>
              <span className="text-[10px] font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                {mine.code}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
              <MapPin className="h-3 w-3 text-purple-400" />
              <span>{mine.district}, {mine.state}</span>
              <span>•</span>
              <span className="text-slate-300">{mine.mine_type} ({mine.depth_m}m)</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Risk & Yield Snapshot */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-mono">
              Shortfall Risk
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge variant={mine.risk_level === "CRITICAL" ? "critical" : "warning"}>
                {mine.risk_level}
              </Badge>
              <span className="text-xs font-mono font-bold text-white">
                {mine.shortfall_risk_score}%
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-mono">
              Extraction Rate
            </div>
            <div className="text-xs font-mono font-bold text-white mt-1">
              {mine.current_daily_tonnage} / {mine.target_daily_tonnage} MT
            </div>
          </div>
        </div>

        {/* Live Telemetry Sensor Readouts */}
        <div className="space-y-2 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
          <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
            Pit Telemetry & Atmosphere
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-300">
              <CloudRain className="h-3.5 w-3.5 text-cyan-400" />
              <span>Rain: {mine.current_rainfall_mm_hr} mm/h</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Droplets className="h-3.5 w-3.5 text-blue-400" />
              <span>Moist: {mine.current_soil_moisture_pct}%</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Gauge className="h-3.5 w-3.5 text-purple-400" />
              <span>Pore: {mine.current_pore_pressure_kpa} kPa</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Truck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Fleet: {mine.fleet_uptime_pct}%</span>
            </div>
          </div>
        </div>

        {/* Fleet on Site */}
        <div className="space-y-2">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Machinery Telematics ({fleet.length})</span>
            <span className="text-emerald-400 font-mono text-[10px]">GPS Sync</span>
          </div>
          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {fleet.map((item) => (
              <div
                key={item.id}
                className="p-2 rounded bg-slate-900/90 border border-slate-800 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">{item.code}</span>
                  <span className="text-[10px] text-purple-300 font-mono">
                    Health: {item.health_score}%
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 truncate">{item.name}</div>
                {item.hazard_alert && (
                  <div className="text-[10px] text-amber-400 flex items-center gap-1 font-mono">
                    <AlertTriangle className="h-3 w-3" /> {item.hazard_alert}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Links */}
      <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
        <Link href={`/telemetry?mine=${mine.id}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full text-xs h-8 border-slate-700">
            <Radio className="h-3.5 w-3.5 mr-1 text-cyan-400" /> Telemetry
          </Button>
        </Link>
        <Link href={`/predictor?mine=${mine.id}`} className="flex-1">
          <Button variant="moil" size="sm" className="w-full text-xs h-8">
            <Sliders className="h-3.5 w-3.5 mr-1" /> Simulate
          </Button>
        </Link>
      </div>
    </div>
  );
}
