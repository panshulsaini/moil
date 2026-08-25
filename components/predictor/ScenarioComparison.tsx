"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PredictResultData } from "@/lib/types";
import { formatIndianCurrency } from "@/lib/utils";
import { ArrowRight, Scale, TrendingDown, TrendingUp } from "lucide-react";

export interface ScenarioComparisonProps {
  currentPrediction: PredictResultData;
}

export function ScenarioComparison({
  currentPrediction,
}: ScenarioComparisonProps) {
  // Nominal baseline
  const baselineTarget = currentPrediction.target_yield_mt;
  const baselineYield = Math.round(baselineTarget * 0.94);
  const baselineShortfall = baselineTarget - baselineYield;

  const simYield = currentPrediction.predicted_yield_mt;
  const simShortfall = currentPrediction.shortfall_tonnage;
  const deltaTonnage = simShortfall - baselineShortfall;
  const deltaFinancial = deltaTonnage * 12500;

  return (
    <Card className="border-slate-800/80 bg-[#0C1220]/90">
      <CardHeader className="p-4 pb-2 border-b border-slate-800/80 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-purple-400" />
          <CardTitle className="text-sm font-semibold text-white">
            Scenario Delta: Nominal Baseline vs Simulation
          </CardTitle>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          What-If Comparative Analysis
        </span>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Baseline Scenario */}
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-400 uppercase font-mono font-semibold">
              Scenario A: Dry Baseline
            </div>
            <div className="text-xl font-bold font-mono text-emerald-400">
              {baselineYield} MT
            </div>
            <div className="text-[11px] text-slate-400">
              Shortfall: {baselineShortfall} MT (6.0%)
            </div>
            <div className="text-[10px] text-slate-500 font-mono pt-1">
              Clear weather • 100% fleet
            </div>
          </div>

          {/* Active Simulated Scenario */}
          <div className="p-3 bg-purple-950/20 rounded-xl border border-purple-800/40 space-y-1">
            <div className="text-[10px] text-purple-300 uppercase font-mono font-semibold">
              Scenario B: Active Sandbox
            </div>
            <div className="text-xl font-bold font-mono text-white">
              {simYield} MT
            </div>
            <div className="text-[11px] text-red-400 font-semibold">
              Shortfall: {simShortfall} MT ({currentPrediction.shortfall_percentage.toFixed(1)}%)
            </div>
            <div className="text-[10px] text-slate-400 font-mono pt-1">
              Active precipitation & soil parameters
            </div>
          </div>

          {/* Net Variance */}
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
            <div className="text-[10px] text-amber-400 uppercase font-mono font-semibold">
              Net Impact Variance
            </div>
            <div className="text-xl font-bold font-mono text-red-400 flex items-center gap-1">
              <TrendingDown className="h-4 w-4 text-red-500" />
              -{Math.abs(deltaTonnage)} MT
            </div>
            <div className="text-[11px] text-amber-300 font-mono font-semibold">
              {formatIndianCurrency(deltaFinancial)}
            </div>
            <div className="text-[10px] text-slate-500 font-mono pt-1">
              Potential revenue variance
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
