"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ContributingFactor } from "@/lib/types";
import { BarChart3 } from "lucide-react";

export interface FeatureContributionChartProps {
  factors: ContributingFactor[];
}

export function FeatureContributionChart({
  factors,
}: FeatureContributionChartProps) {
  const chartData = (factors || []).map((f) => ({
    name: f.factor.replace(/_/g, " "),
    impact: Math.round(f.impact_pct),
    description: f.description,
  }));

  return (
    <Card className="border-slate-800/80 bg-[#0C1220]/90">
      <CardHeader className="p-4 pb-2 border-b border-slate-800/80 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-purple-400" />
          <CardTitle className="text-sm font-semibold text-white">
            Feature Attribution & Shapley Driver Weights
          </CardTitle>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          Relative Shortfall Contribution (%)
        </span>
      </CardHeader>
      <CardContent className="p-4 pt-3">
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={chartData}
              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
              <XAxis
                type="number"
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                unit="%"
                domain={[0, 100]}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                width={120}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0F172A",
                  borderColor: "#334155",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#F8FAFC",
                }}
                formatter={(value: any) => [`${value}% Contribution`, "Impact"]}
              />
              <Bar dataKey="impact" radius={[0, 4, 4, 0]} barSize={16}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.impact > 40
                        ? "#EF4444"
                        : entry.impact > 25
                        ? "#F59E0B"
                        : "#8B5CF6"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-2 space-y-1 text-xs text-slate-400 border-t border-slate-800/60 pt-2">
          {factors?.map((f, idx) => (
            <div key={idx} className="flex justify-between items-center text-[11px]">
              <span className="text-slate-300 font-medium">{f.factor}:</span>
              <span className="text-slate-400 truncate max-w-[280px]">{f.description}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
