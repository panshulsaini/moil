"use client";

import * as React from "react";
import {
  Layers,
  Activity,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Truck,
  CloudRain,
  Radio,
  Sliders,
  Sparkles,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { MineOverviewGrid } from "@/components/dashboard/MineOverviewGrid";
import { AlertFeed } from "@/components/dashboard/AlertFeed";
import { ShortfallRiskMatrix } from "@/components/dashboard/ShortfallRiskMatrix";
import { Button } from "@/components/ui/button";
import { MOIL_MINES } from "@/lib/mock-telemetry";
import { store, useGlobalStore } from "@/lib/store";
import Link from "next/link";

export default function ExecutiveOverviewPage() {
  const { seriesData, activeMineId, isPlaying } = useGlobalStore();
  const latestPoint = seriesData[seriesData.length - 1];

  // Start telemetry on mount
  React.useEffect(() => {
    if (!isPlaying) store.setPlaying(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Static targets from mine definitions
  const totalTargetDaily = MOIL_MINES.reduce((acc, m) => acc + m.target_daily_tonnage, 0);
  const totalEstimatedShortfall = MOIL_MINES.reduce((acc, m) => acc + m.shortfall_tonnage_est, 0);
  const averageRiskIndex = (
    MOIL_MINES.reduce((acc, m) => acc + m.shortfall_risk_score, 0) / MOIL_MINES.length
  ).toFixed(1);
  const averageFleetUptime = (
    MOIL_MINES.reduce((acc, m) => acc + m.fleet_uptime_pct, 0) / MOIL_MINES.length
  ).toFixed(1);

  // Live: sum hourly extraction across all mines from the latest store tick
  // Each mine produces proportionally; active mine has direct latestPoint, others scale
  const activeMine = MOIL_MINES.find(m => m.id === activeMineId) || MOIL_MINES[0];
  const activeMineHourlyTarget = activeMine.target_daily_tonnage / 24;
  const activeMineExtractionRatio = activeMineHourlyTarget > 0
    ? latestPoint.extraction_tonnes / activeMineHourlyTarget
    : 1;
  // Project this ratio across all mines to get total live daily extraction estimate
  const totalActualDaily = Math.round(
    MOIL_MINES.reduce((acc, m) => acc + (m.target_daily_tonnage * activeMineExtractionRatio), 0)
  );
  const extractionRatePct = ((totalActualDaily / totalTargetDaily) * 100).toFixed(1);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Executive Hero Banner */}
      <div className="relative rounded-2xl border border-slate-800/80 bg-gradient-to-r from-[#0E1528] via-[#101932] to-[#0A0F1D] p-6 shadow-2xl overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-purple-900/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold tracking-wider text-purple-400 bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-800/40">
                MOIL CENTRAL COMMAND
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Vidarbha-Balaghat Manganese Concession Belt
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Executive Operations & Predictive Shortfall Intelligence
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Real-time multi-sensor telemetry fusion modeling precipitation surges, deep shaft pore pressures, and heavy machinery uptime across India's largest manganese mining enterprise.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link href="/predictor">
              <Button variant="moil" className="gap-2 text-xs shadow-lg shadow-purple-900/40">
                <Sparkles className="h-4 w-4" />
                <span>Simulate Shortfall Sandbox</span>
              </Button>
            </Link>
            <Link href="/telemetry">
              <Button variant="outline" className="gap-2 text-xs border-slate-700 bg-slate-900">
                <Radio className="h-4 w-4 text-cyan-400" />
                <span>Telemetry Streams</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Core KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Daily Manganese Extraction"
          value={totalActualDaily.toLocaleString()}
          unit={`/ ${totalTargetDaily.toLocaleString()} MT`}
          subtitle={`${extractionRatePct}% of daily run-rate target`}
          delta={`-${totalEstimatedShortfall} MT Shortfall`}
          deltaType="negative"
          icon={Layers}
          iconColor="text-emerald-400"
          progress={parseFloat(extractionRatePct)}
          progressColor={parseFloat(extractionRatePct) < 80 ? "bg-amber-500" : "bg-emerald-500"}
        />

        <KpiCard
          title="Regional Shortfall Risk Index"
          value={`${averageRiskIndex}%`}
          subtitle="Elevated at Balaghat & Dongri Buzurg"
          delta="+8.4% vs Yesterday"
          deltaType="warning"
          icon={AlertTriangle}
          iconColor="text-amber-400"
          progress={parseFloat(averageRiskIndex)}
          progressColor="bg-amber-500"
        />

        <KpiCard
          title="Satellite Weather Risk"
          value="42.0"
          unit="mm/hr max"
          subtitle="Bhandara-Balaghat monsoon front"
          delta="Rainfall Surge Active"
          deltaType="warning"
          icon={CloudRain}
          iconColor="text-cyan-400"
        />

        <KpiCard
          title="Fleet Telematics Uptime"
          value={`${averageFleetUptime}%`}
          subtitle="124 / 142 dumpers & shovels active"
          delta="+3.2% vs Last Shift"
          deltaType="positive"
          icon={Truck}
          iconColor="text-purple-400"
          progress={parseFloat(averageFleetUptime)}
          progressColor="bg-purple-500"
        />
      </div>

      {/* 8 MOIL Mine Assets Status Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-400" />
              MOIL Mining Asset Operations Grid (8 Concessions)
            </h2>
            <p className="text-xs text-slate-400">
              Live extraction run-rates, telemetry thresholds, and AI shortfall risk indices.
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
            8 / 8 Mines Reporting
          </span>
        </div>

        <MineOverviewGrid />
      </div>

      {/* Lower Dual Grid: Risk Heat Matrix & Alert Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ShortfallRiskMatrix />
        <AlertFeed />
      </div>
    </div>
  );
}
