"use client";

import * as React from "react";
import {
  AlertTriangle,
  Droplets,
  CloudRain,
  Radio,
  Zap,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface AlertItem {
  id: string;
  time: string;
  mine: string;
  type: "CRITICAL" | "WARNING" | "INFO";
  title: string;
  description: string;
  metric: string;
  actionUrl: string;
}

const INITIAL_ALERTS: AlertItem[] = [
  {
    id: "ALT-01",
    time: "14:28:10 IST",
    mine: "Dongri Buzurg Mine",
    type: "CRITICAL",
    title: "Overburden Slope Moisture Saturation (74.5%)",
    description: "TDR sensor NODE-DON-01 exceeds safety threshold (60%). Factor of Safety decreased to 1.18.",
    metric: "FOS: 1.18 (Critical)",
    actionUrl: "/planner",
  },
  {
    id: "ALT-02",
    time: "14:15:22 IST",
    mine: "Balaghat Mine",
    type: "CRITICAL",
    title: "Shaft 2 Deep Sump Inflow Surge (+45%)",
    description: "Pore water pressure reached 48.2 kPa at -410m level. Submersible pump duty cycle at 98%.",
    metric: "3,180 GPM Inflow",
    actionUrl: "/predictor?mine=00000000-0000-0000-0000-000000000001",
  },
  {
    id: "ALT-03",
    time: "13:52:00 IST",
    mine: "Tirodi Mine",
    type: "WARNING",
    title: "North Ramp Haul Road Friction Loss",
    description: "Surface traction coefficient dropped to 0.38 following 29 mm/hr rainfall burst. Dumper cycle time extended to 34 min.",
    metric: "+8.5 min Cycle",
    actionUrl: "/planner",
  },
  {
    id: "ALT-04",
    time: "13:10:45 IST",
    mine: "Mansar Mine",
    type: "INFO",
    title: "Crusher Grade Blending Optimisation Executed",
    description: "Feed ratio tuned to 35% dry stockpile to maintain 42% Mn grade and prevent chute clogging.",
    metric: "Grade: 41.8% Mn",
    actionUrl: "/telemetry?mine=00000000-0000-0000-0000-000000000003",
  },
];

export function AlertFeed() {
  const [alerts] = React.useState<AlertItem[]>(INITIAL_ALERTS);

  return (
    <Card className="border-slate-800/80 bg-[#0C1220]/90">
      <CardHeader className="p-4 pb-3 border-b border-slate-800/80 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          <CardTitle className="text-sm font-semibold text-white">
            Live Telemetry Anomaly Feed
          </CardTitle>
        </div>
        <Badge variant="destructive" className="text-[10px] font-mono">
          {alerts.length} Active Triggers
        </Badge>
      </CardHeader>
      <CardContent className="p-4 divide-y divide-slate-800/60 max-h-96 overflow-y-auto space-y-3">
        {alerts.map((alt) => (
          <div key={alt.id} className="pt-3 first:pt-0 space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    alt.type === "CRITICAL"
                      ? "bg-red-500 animate-ping"
                      : alt.type === "WARNING"
                      ? "bg-amber-400"
                      : "bg-cyan-400"
                  }`}
                />
                <span className="text-xs font-semibold text-white">
                  {alt.title}
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 shrink-0">
                {alt.time}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed pl-4">
              {alt.description}
            </p>

            <div className="flex items-center justify-between pl-4 pt-1">
              <div className="flex items-center gap-2 text-[11px] font-mono">
                <span className="text-purple-300 font-medium">{alt.mine}</span>
                <span className="text-slate-600">•</span>
                <span className="text-amber-400 font-bold bg-amber-950/40 px-1.5 py-0.2 rounded border border-amber-900/40">
                  {alt.metric}
                </span>
              </div>
              <Link href={alt.actionUrl}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[10px] gap-1 text-purple-400 hover:text-purple-300 p-1 px-2"
                >
                  <span>Resolve</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
