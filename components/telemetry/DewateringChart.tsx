"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TelemetryTimeSeriesPoint } from "@/lib/mock-telemetry";
import { Zap, Gauge } from "lucide-react";

export interface DewateringChartProps {
  data: TelemetryTimeSeriesPoint[];
  mineName: string;
}

export function DewateringChart({ data, mineName }: DewateringChartProps) {
  return (
    <Card className="border-slate-800/80 bg-[#0C1220]/90">
      <CardHeader className="p-4 pb-2 border-b border-slate-800/80 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-purple-400" />
          <CardTitle className="text-sm font-semibold text-white">
            Deep Shaft Dewatering & Sump Dynamics
          </CardTitle>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          Pump Discharge vs Inflow Head (GPM)
        </span>
      </CardHeader>
      <CardContent className="p-4 pt-3">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="inflowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="dischargeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="time" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis
                yAxisId="left"
                stroke="#8B5CF6"
                fontSize={11}
                tickLine={false}
                unit=" GPM"
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#06B6D4"
                fontSize={11}
                tickLine={false}
                unit=" kPa"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0F172A",
                  borderColor: "#334155",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#F8FAFC",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="sump_inflow_gpm"
                name="Sump Inflow (GPM)"
                stroke="#EF4444"
                fill="url(#inflowGrad)"
                strokeWidth={2}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="pump_discharge_gpm"
                name="Pump Discharge (GPM)"
                stroke="#8B5CF6"
                fill="url(#dischargeGrad)"
                strokeWidth={2}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="pore_pressure_kpa"
                name="Pore Pressure (kPa)"
                stroke="#06B6D4"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/60 pt-2 font-mono">
          <span>Shaft dewatering margin: +220 GPM surplus capacity active.</span>
          <span className="text-emerald-400">Head Pressure: Nominal</span>
        </div>
      </CardContent>
    </Card>
  );
}
