"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MOIL_MINES } from "@/lib/mock-telemetry";
import { Badge } from "@/components/ui/badge";
import { Layers, Info } from "lucide-react";
import Link from "next/link";

export function ShortfallRiskMatrix() {
  return (
    <Card className="border-slate-800/80 bg-[#0C1220]/90">
      <CardHeader className="p-4 pb-3 border-b border-slate-800/80 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-purple-400" />
          <CardTitle className="text-sm font-semibold text-white">
            Regional Shortfall Risk Heat Matrix
          </CardTitle>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          Environmental vs Operational Vulnerability
        </span>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {MOIL_MINES.map((mine) => {
            const isHighRisk = mine.shortfall_risk_score >= 60;
            const isModerate = mine.shortfall_risk_score >= 30 && mine.shortfall_risk_score < 60;

            return (
              <Link
                key={mine.id}
                href={`/predictor?mine=${mine.id}`}
                className="group p-3 rounded-lg border border-slate-800/90 bg-slate-900/60 hover:border-purple-500/50 hover:bg-slate-800/60 transition-all block"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white group-hover:text-purple-300">
                    {mine.name.replace(" Mine", "")}
                  </span>
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      isHighRisk
                        ? "bg-red-500 shadow-sm shadow-red-500/50"
                        : isModerate
                        ? "bg-amber-400"
                        : "bg-emerald-500"
                    }`}
                  />
                </div>

                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">
                    Shortfall Risk:
                  </span>
                  <span
                    className={`font-mono text-xs font-bold ${
                      isHighRisk
                        ? "text-red-400"
                        : isModerate
                        ? "text-amber-400"
                        : "text-emerald-400"
                    }`}
                  >
                    {mine.shortfall_risk_score}%
                  </span>
                </div>

                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>Rain: {mine.current_rainfall_mm_hr}mm</span>
                  <span>Moist: {mine.current_soil_moisture_pct}%</span>
                </div>

                <div className="mt-2 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      isHighRisk
                        ? "bg-red-500"
                        : isModerate
                        ? "bg-amber-400"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${mine.shortfall_risk_score}%` }}
                  />
                </div>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500" /> Critical Risk (&gt;60%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400" /> Caution (30-60%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Nominal (&lt;30%)
            </span>
          </div>
          <span className="font-mono text-[10px] text-purple-400">
            Click any site to simulate
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
