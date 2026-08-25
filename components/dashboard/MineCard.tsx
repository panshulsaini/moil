import * as React from "react";
import Link from "next/link";
import {
  CloudRain,
  Droplets,
  Gauge,
  Truck,
  TrendingDown,
  ArrowUpRight,
  Sliders,
  Radio,
  AlertTriangle,
  Layers,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getRiskColor, formatTonnage } from "@/lib/utils";
import { MOIL_MINES } from "@/lib/mock-telemetry";

export interface MineCardProps {
  mine: (typeof MOIL_MINES)[0];
  onQuickSim?: (mineId: string) => void;
}

export function MineCard({ mine, onQuickSim }: MineCardProps) {
  const risk = getRiskColor(mine.risk_level);
  const yieldPct = (mine.current_daily_tonnage / mine.target_daily_tonnage) * 100;
  const shortfallMT = Math.max(0, mine.target_daily_tonnage - mine.current_daily_tonnage);

  return (
    <Card className="relative overflow-hidden border-slate-800/80 bg-[#0C1220]/90 hover:border-purple-500/40 transition-all duration-200 hover:shadow-xl hover:shadow-purple-950/20 group flex flex-col justify-between">
      {/* Top Status Header */}
      <div>
        <CardHeader className="p-4 pb-3 border-b border-slate-800/60">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white group-hover:text-purple-300 transition-colors">
                  {mine.name}
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-800/60 px-1.5 py-0.5 rounded">
                  {mine.code}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                <span>{mine.district}, {mine.state}</span>
                <span>•</span>
                <span className="text-slate-300">{mine.mine_type} ({mine.depth_m}m)</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant={mine.risk_level === "CRITICAL" ? "critical" : mine.risk_level === "HIGH" ? "warning" : mine.risk_level === "MODERATE" ? "secondary" : "success"}>
                {mine.risk_level}
              </Badge>
              {mine.active_alerts > 0 && (
                <span className="text-[10px] text-amber-400 flex items-center gap-1 font-mono">
                  <AlertTriangle className="h-3 w-3" /> {mine.active_alerts} Alerts
                </span>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-3.5">
          {/* Target vs Actual Daily Run-rate */}
          <div className="space-y-1.5 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
            <div className="flex justify-between items-baseline text-xs">
              <span className="text-slate-400 text-[11px]">Daily Extraction Rate</span>
              <span className="font-mono text-xs">
                <strong className="text-white font-bold">{mine.current_daily_tonnage}</strong>
                <span className="text-slate-500"> / {mine.target_daily_tonnage} MT</span>
              </span>
            </div>
            <Progress
              value={yieldPct}
              className="h-2 bg-slate-800"
              indicatorClassName={
                yieldPct < 70 ? "bg-red-500" : yieldPct < 85 ? "bg-amber-500" : "bg-emerald-500"
              }
            />
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
              <span className={yieldPct < 80 ? "text-amber-400 font-semibold" : "text-emerald-400"}>
                {yieldPct.toFixed(1)}% of Target
              </span>
              {shortfallMT > 0 ? (
                <span className="text-red-400 font-semibold flex items-center gap-0.5">
                  <TrendingDown className="h-3 w-3" /> -{shortfallMT} MT Shortfall
                </span>
              ) : (
                <span className="text-emerald-400">On Schedule</span>
              )}
            </div>
          </div>

          {/* Environmental Telemetry Grid */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-slate-900/80 p-2 rounded border border-slate-800/80">
              <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mb-0.5">
                <CloudRain className="h-3 w-3 text-cyan-400" /> Rain
              </div>
              <div className="font-mono font-bold text-white text-xs">
                {mine.current_rainfall_mm_hr} <span className="text-[9px] text-slate-500 font-normal">mm/h</span>
              </div>
            </div>

            <div className="bg-slate-900/80 p-2 rounded border border-slate-800/80">
              <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mb-0.5">
                <Droplets className="h-3 w-3 text-blue-400" /> Moisture
              </div>
              <div className="font-mono font-bold text-white text-xs">
                {mine.current_soil_moisture_pct}%
              </div>
            </div>

            <div className="bg-slate-900/80 p-2 rounded border border-slate-800/80">
              <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mb-0.5">
                <Truck className="h-3 w-3 text-purple-400" /> Fleet
              </div>
              <div className="font-mono font-bold text-white text-xs">
                {mine.fleet_uptime_pct}%
              </div>
            </div>
          </div>

          {/* Grade & Ore Description */}
          <div className="flex justify-between items-center text-[11px] px-1 text-slate-400">
            <span className="text-slate-500">Grade:</span>
            <span className="text-purple-300 font-mono font-medium truncate max-w-[170px]">
              {mine.primary_grade}
            </span>
          </div>
        </CardContent>
      </div>

      {/* Card Footer Actions */}
      <CardFooter className="p-3 border-t border-slate-800/60 bg-slate-950/40 flex items-center justify-between gap-2 mt-0">
        <Link href={`/telemetry?mine=${mine.id}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full text-xs h-7 gap-1 border-slate-700">
            <Radio className="h-3 w-3 text-cyan-400" />
            <span>Telemetry</span>
          </Button>
        </Link>
        <Link href={`/predictor?mine=${mine.id}`} className="flex-1">
          <Button variant="moil" size="sm" className="w-full text-xs h-7 gap-1">
            <Sliders className="h-3 w-3" />
            <span>Simulate</span>
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
