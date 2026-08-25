"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TelemetryTimeSeriesPoint } from "@/lib/mock-telemetry";
import { Droplets, ShieldAlert } from "lucide-react";

export interface SoilMoistureChartProps {
  data: TelemetryTimeSeriesPoint[];
  mineName: string;
}

export function SoilMoistureChart({ data, mineName }: SoilMoistureChartProps) {
  return (
    <Card className="border-slate-800/80 bg-[#0C1220]/90">
      <CardHeader className="p-4 pb-2 border-b border-slate-800/80 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Droplets className="h-4 w-4 text-blue-400" />
          <CardTitle className="text-sm font-semibold text-white">
            Radar Soil Moisture vs Factor of Safety (FOS)
          </CardTitle>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          DGMS Critical Slope Threshold (FOS &lt; 1.30)
        </span>
      </CardHeader>
      <CardContent className="p-4 pt-3">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="time" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis
                yAxisId="left"
                stroke="#3B82F6"
                fontSize={11}
                tickLine={false}
                unit="%"
                domain={[0, 100]}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#EF4444"
                fontSize={11}
                tickLine={false}
                domain={[0.8, 2.5]}
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
              <ReferenceLine
                yAxisId="right"
                y={1.3}
                label={{
                  value: "DGMS Mandatory Evacuation Limit (1.3 FOS)",
                  fill: "#EF4444",
                  fontSize: 10,
                  position: "top",
                }}
                stroke="#EF4444"
                strokeDasharray="3 3"
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="soil_moisture_pct"
                name="Soil Moisture (%)"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ r: 2 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="factor_of_safety"
                name="Slope Stability (FOS)"
                stroke="#F59E0B"
                strokeWidth={2.5}
                dot={{ r: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/60 pt-2 font-mono">
          <span className="flex items-center gap-1 text-amber-400">
            <ShieldAlert className="h-3.5 w-3.5" /> Bench stability requires horizontal trench drainage when moisture exceeds 65%.
          </span>
          <span className="text-slate-500">{mineName} Overburden Analysis</span>
        </div>
      </CardContent>
    </Card>
  );
}
