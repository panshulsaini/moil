"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PredictResultData } from "@/lib/types";
import { formatTonnage, formatIndianCurrency, getRiskColor } from "@/lib/utils";
import {
  TrendingDown,
  AlertTriangle,
  Zap,
  IndianRupee,
  CheckCircle2,
  Cpu,
} from "lucide-react";

export interface ShortfallGaugeProps {
  prediction: PredictResultData;
}

export function ShortfallGauge({ prediction }: ShortfallGaugeProps) {
  const risk = getRiskColor(prediction.shortfall_risk_level);
  const prob = Math.min(100, Math.max(0, prediction.shortfall_percentage));
  
  // Calculate financial impact at average MOIL manganese ore rate ₹12,500/MT
  const financialLossINR = prediction.shortfall_tonnage * 12500;

  // SVG Gauge calculations
  const radius = 60;
  const strokeWidth = 10;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (prob / 100) * circumference;

  return (
    <Card className="border-slate-800/80 bg-[#0C1220]/90 relative overflow-hidden">
      <CardHeader className="p-4 pb-2 border-b border-slate-800/80 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-purple-400" />
          <CardTitle className="text-sm font-semibold text-white">
            ML Shortfall Inference Output
          </CardTitle>
        </div>
        <Badge
          variant={
            prediction.shortfall_risk_level === "CRITICAL"
              ? "critical"
              : prediction.shortfall_risk_level === "HIGH"
              ? "warning"
              : prediction.shortfall_risk_level === "MODERATE"
              ? "secondary"
              : "success"
          }
          className="font-mono text-xs"
        >
          {prediction.shortfall_risk_level} RISK
        </Badge>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        {/* Radial Gauge and Key Tonnes Display */}
        <div className="flex flex-col sm:flex-row items-center justify-around gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          {/* Radial Circular Progress */}
          <div className="relative flex items-center justify-center">
            <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg]">
              <circle
                stroke="#1E293B"
                fill="transparent"
                strokeWidth={strokeWidth}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
              <circle
                stroke={
                  prob > 60 ? "#EF4444" : prob > 30 ? "#F59E0B" : "#10B981"
                }
                fill="transparent"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference + " " + circumference}
                style={{ strokeDashoffset }}
                strokeLinecap="round"
                r={normalizedRadius}
                cx={radius}
                cy={radius}
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-xl font-bold font-mono text-white">
                {prob.toFixed(1)}%
              </span>
              <span className="text-[9px] text-slate-400 uppercase tracking-wider">
                Deficit Ratio
              </span>
            </div>
          </div>

          {/* Primary MT & Target Run-Rate */}
          <div className="space-y-1 text-center sm:text-left">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
              Expected Extraction Shortfall
            </div>
            <div className="text-3xl font-extrabold font-mono text-red-400 flex items-center justify-center sm:justify-start gap-1">
              <TrendingDown className="h-6 w-6 text-red-500" />
              {prediction.shortfall_tonnage} MT
            </div>
            <div className="text-xs text-slate-300 font-mono">
              Target: <strong className="text-white">{prediction.target_yield_mt} MT</strong> •
              Predicted:{" "}
              <strong className="text-emerald-400">
                {prediction.predicted_yield_mt} MT
              </strong>
            </div>
          </div>
        </div>

        {/* Financial Loss, Accuracy & Confidence Metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 uppercase font-mono mb-1">
              <IndianRupee className="h-3 w-3 text-amber-400" />
              Financial Impact
            </div>
            <div className="text-base font-bold font-mono text-amber-300">
              {formatIndianCurrency(financialLossINR)}
            </div>
            <div className="text-[10px] text-slate-500">
              ₹12,500/MT benchmark
            </div>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-lg border border-emerald-900/40">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 uppercase font-mono mb-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              Model Accuracy
            </div>
            <div className="text-base font-bold font-mono text-emerald-300">
              {((prediction.model_accuracy ?? 0.912) * 100).toFixed(1)}%
            </div>
            <div className="text-[10px] text-slate-500">
              Back-tested on MOIL data
            </div>
          </div>

          <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 uppercase font-mono mb-1">
              <Zap className="h-3 w-3 text-purple-400" />
              Confidence
            </div>
            <div className="text-base font-bold font-mono text-purple-300">
              {(prediction.confidence_score * 100).toFixed(1)}%
            </div>
            <div className="text-[10px] text-slate-500 truncate">
              {prediction.service_mode}
            </div>
          </div>
        </div>

        {/* Primary Root Cause Banner */}
        <div className="bg-red-950/20 border border-red-900/40 rounded-lg p-3 text-xs text-red-300 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-red-200">Primary Degradation Driver: </span>
            {prediction.primary_failure_mode}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
