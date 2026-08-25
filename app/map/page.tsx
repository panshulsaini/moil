"use client";

import * as React from "react";
import { GisMiningMap } from "@/components/map/GisMiningMap";
import { MOIL_MINES, MOCK_GPS_FLEET } from "@/lib/mock-telemetry";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Map, Navigation, Truck, ShieldAlert, Radio, Compass } from "lucide-react";

export default function GisMiningMapPage() {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0E1528] p-5 rounded-2xl border border-slate-800/80 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Map className="h-5 w-5 text-purple-400" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              Interactive GIS Mining Map & Corridor Telemetry
            </h1>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Geospatial tracking of 8 MOIL manganese mine concessions across the Maharashtra-Madhya Pradesh border with live pit hazard zones, slope stability alerts, and heavy machinery GPS beacons.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
            <Truck className="h-3.5 w-3.5 text-amber-400" />
            <span>Fleet: 8 GPS Trackers Active</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
            <Radio className="h-3.5 w-3.5 text-cyan-400" />
            <span>GIS Sync: 100%</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Map Component */}
      <GisMiningMap />

      {/* Quick Corridor Asset Directory */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {MOIL_MINES.map((mine) => (
          <Card
            key={mine.id}
            className="p-3.5 border-slate-800/80 bg-[#0C1220]/90 space-y-2 hover:border-purple-500/40 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-white">{mine.name}</span>
              <Badge
                variant={
                  mine.risk_level === "CRITICAL"
                    ? "critical"
                    : mine.risk_level === "HIGH"
                    ? "warning"
                    : "success"
                }
                className="text-[9px] font-mono"
              >
                {mine.risk_level}
              </Badge>
            </div>
            <div className="text-[11px] text-slate-400">
              Coordinates:{" "}
              <span className="font-mono text-slate-300">
                {mine.latitude.toFixed(2)}°N, {mine.longitude.toFixed(2)}°E
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1 border-t border-slate-800/60">
              <span>{mine.mine_type}</span>
              <span className="text-purple-300">{mine.target_daily_tonnage} MT/d</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
