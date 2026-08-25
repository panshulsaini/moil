"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CorrectiveAction } from "@/lib/types";
import { formatIndianCurrency } from "@/lib/utils";
import { TrendingUp, Scale, CheckCircle2, IndianRupee, ShieldCheck } from "lucide-react";

export interface TonnageRecoveryCalculatorProps {
  actions: CorrectiveAction[];
}

export function TonnageRecoveryCalculator({
  actions,
}: TonnageRecoveryCalculatorProps) {
  // Compute totals
  const totalProposedRecovery = actions.reduce(
    (acc, act) => acc + act.estimated_yield_recovery_mt,
    0
  );

  const executedActions = actions.filter((a) => a.status === "EXECUTED");
  const acknowledgedActions = actions.filter((a) => a.status === "ACKNOWLEDGED");

  const realizedRecoveryMT = executedActions.reduce(
    (acc, a) => acc + a.estimated_yield_recovery_mt,
    0
  );

  const pendingRecoveryMT = acknowledgedActions.reduce(
    (acc, a) => acc + a.estimated_yield_recovery_mt,
    0
  );

  const totalCostINR = actions
    .filter((a) => a.status === "EXECUTED" || a.status === "ACKNOWLEDGED")
    .reduce((acc, a) => acc + a.cost_estimate_inr, 0);

  const recoveredRevenueINR = realizedRecoveryMT * 12500;
  const roiMultiplier =
    totalCostINR > 0 ? (recoveredRevenueINR / totalCostINR).toFixed(1) : "N/A";

  return (
    <Card className="border-slate-800/80 bg-[#0C1220]/90">
      <CardHeader className="p-4 pb-2 border-b border-slate-800/80 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-400" />
          <CardTitle className="text-sm font-semibold text-white">
            Cumulative Tonnage Recovery & ROI Calculator
          </CardTitle>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          Cost-Benefit Mitigation Model
        </span>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Total Realized Recovery */}
          <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/40 space-y-1">
            <div className="text-[10px] text-emerald-400 uppercase font-mono font-semibold">
              Realized Yield Recovery
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-300">
              +{realizedRecoveryMT} MT
            </div>
            <div className="text-[10px] text-slate-400">
              {executedActions.length} Actions Verified in Shift
            </div>
          </div>

          {/* Pipeline Pending Recovery */}
          <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/40 space-y-1">
            <div className="text-[10px] text-amber-400 uppercase font-mono font-semibold">
              Acknowledged In-Flight
            </div>
            <div className="text-2xl font-bold font-mono text-amber-300">
              +{pendingRecoveryMT} MT
            </div>
            <div className="text-[10px] text-slate-400">
              {acknowledgedActions.length} Dispatches in Progress
            </div>
          </div>

          {/* Recovered Value */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-400 uppercase font-mono font-semibold">
              Gross Value Preserved
            </div>
            <div className="text-2xl font-bold font-mono text-white">
              {formatIndianCurrency(recoveredRevenueINR)}
            </div>
            <div className="text-[10px] text-slate-500">
              At ₹12,500/MT benchmark
            </div>
          </div>

          {/* Cost-Benefit ROI */}
          <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-800/40 space-y-1">
            <div className="text-[10px] text-purple-300 uppercase font-mono font-semibold">
              Mitigation Cost ROI
            </div>
            <div className="text-2xl font-bold font-mono text-purple-300">
              {roiMultiplier}x
            </div>
            <div className="text-[10px] text-slate-400">
              Cost: {formatIndianCurrency(totalCostINR)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
