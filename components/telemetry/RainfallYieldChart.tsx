"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TelemetryTimeSeriesPoint } from "@/lib/mock-telemetry";
import { CloudRain, Activity } from "lucide-react";

export interface RainfallYieldChartProps {
  data: TelemetryTimeSeriesPoint[];
  mineName: string;
}

export function RainfallYieldChart({ data, mineName }: RainfallYieldChartProps) {
  return (
    <Card className="border-slate-800/80 bg-[#0C1220]/90">
      <CardHeader className="p-4 pb-2 border-b border-slate-800/80 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CloudRain className="h-4 w-4 text-cyan-400" />
          <CardTitle className="text-sm font-semibold text-white">
            Dual-Axis Fusion: Satellite Rainfall vs Extraction Run-Rate
          </CardTitle>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          {mineName} • 24-Hour Telemetry Correlation
        </span>
      </CardHeader>
      <CardContent className="p-4 pt-3">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="rainGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis
                dataKey="time"
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                stroke="#06B6D4"
                fontSize={11}
                tickLine={false}
                unit=" mm"
                domain={[0, "auto"]}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#10B981"
                fontSize={11}
                tickLine={false}
                unit=" MT"
                domain={[0, "auto"]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0F172A",
                  borderColor: "#334155",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#F8FAFC",
                }}
                formatter={(value: any, name: string) => {
                  if (name === "Rainfall (mm/hr)") return [`${value} mm/hr`, name];
                  if (name === "Hourly Extraction (MT)") return [`${value} MT`, name];
                  if (name === "Target Run-Rate (MT)") return [`${value} MT`, name];
                  return [value, name];
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="rainfall_mm_hr"
                name="Rainfall (mm/hr)"
                stroke="#06B6D4"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#rainGradient)"
              />
              <Bar
                yAxisId="right"
                dataKey="extraction_tonnes"
                name="Hourly Extraction (MT)"
                fill="#10B981"
                radius={[4, 4, 0, 0]}
                barSize={12}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="target_tonnes"
                name="Target Run-Rate (MT)"
                stroke="#F59E0B"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/60 pt-2 font-mono">
          <span>Observation: Precipitation spikes &gt;25 mm/hr induce ~35% immediate haulage throughput drops.</span>
          <span className="text-purple-400">R² = 0.87 Correlation</span>
        </div>
      </CardContent>
    </Card>
  );
}
