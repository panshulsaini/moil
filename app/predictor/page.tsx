"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  SimulationSliders,
  SimulationParams,
} from "@/components/predictor/SimulationSliders";
import { ShortfallGauge } from "@/components/predictor/ShortfallGauge";
import { FeatureContributionChart } from "@/components/predictor/FeatureContributionChart";
import { CorrectiveActionList } from "@/components/predictor/CorrectiveActionList";
import { ScenarioComparison } from "@/components/predictor/ScenarioComparison";
import { MOIL_MINES } from "@/lib/mock-telemetry";
import { calculatePredictionFallback } from "@/lib/fallback-predictor";
import { store, useGlobalStore } from "@/lib/store";
import { PredictResultData } from "@/lib/types";
import { Sliders, Sparkles, Zap, ShieldAlert, Cpu, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

function PredictorContent() {
  const searchParams = useSearchParams();
  const mineParam = searchParams.get("mine");

  const { activeMineId, isPlaying, seriesData } = useGlobalStore();
  const latestPoint = seriesData[seriesData.length - 1];

  React.useEffect(() => {
    if (mineParam && mineParam !== activeMineId) {
      store.setActiveMine(mineParam);
    }
  }, [mineParam, activeMineId]);

  const activeMine =
    MOIL_MINES.find((m) => m.id === activeMineId || m.code === activeMineId) ||
    MOIL_MINES[0];

  const [params, setParams] = React.useState<SimulationParams>({
    rainfall_mm_per_hr: latestPoint.rainfall_mm_hr,
    soil_moisture_percent: latestPoint.soil_moisture_pct,
    pore_water_pressure_kpa: latestPoint.pore_pressure_kpa,
    active_dumpers: 12,
    active_excavators: 4,
    active_pumps: 6,
    pump_capacity_gpm: activeMine.pump_capacity_gpm,
    dumper_cycle_time_min: 32.0,
    unscheduled_downtime_hours: 2.0,
    manganese_grade_percent: latestPoint.manganese_grade_pct,
    target_tonnage: activeMine.target_daily_tonnage,
  });

  const [prediction, setPrediction] = React.useState<PredictResultData>(() =>
    calculatePredictionFallback({
      mine_id: activeMine.id,
      target_override_mt: activeMine.target_daily_tonnage,
      current_extraction_override_mt: activeMine.current_daily_tonnage,
      weather_overrides: {
        rainfall_mm: latestPoint.rainfall_mm_hr,
        soil_moisture_pct: latestPoint.soil_moisture_pct,
      },
    })
  );

  const [isCalculating, setIsCalculating] = React.useState(false);
  // isSynced = true means: sliders auto-follow live telemetry
  // isSynced = false means: user manually moved a slider — freeze until Reset is clicked
  const [isSynced, setIsSynced] = React.useState(true);

  // When playing AND synced: keep sliders in step with live telemetry
  React.useEffect(() => {
    if (isPlaying && isSynced) {
      setParams((prev) => ({
        ...prev,
        rainfall_mm_per_hr: latestPoint.rainfall_mm_hr,
        soil_moisture_percent: latestPoint.soil_moisture_pct,
        pore_water_pressure_kpa: latestPoint.pore_pressure_kpa,
        manganese_grade_percent: latestPoint.manganese_grade_pct,
      }));
    }
  }, [latestPoint, isPlaying, isSynced]);

  React.useEffect(() => {
    setParams((prev) => ({
      ...prev,
      pump_capacity_gpm: activeMine.pump_capacity_gpm,
      target_tonnage: activeMine.target_daily_tonnage,
    }));
  }, [activeMine]);

  // Recalculate prediction via API with instant client heuristic fallback
  React.useEffect(() => {
    let isMounted = true;
    setIsCalculating(true);

    const runInference = async () => {
      try {
        const response = await fetch("/api/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mine_id: activeMine.id,
            target_override_mt: params.target_tonnage,
            weather_overrides: {
              rainfall_mm: params.rainfall_mm_per_hr,
              soil_moisture_pct: params.soil_moisture_percent,
              surface_temp_c: 28.5,
            },
          }),
        });

        if (response.ok) {
          const json = await response.json();
          if (json.success && isMounted) {
            setPrediction(json.data);
            setIsCalculating(false);
            return;
          }
        }
      } catch (err) {
        // Fallback gracefully
      }

      if (isMounted) {
        const fallback = calculatePredictionFallback({
          mine_id: activeMine.id,
          target_override_mt: params.target_tonnage,
          weather_overrides: {
            rainfall_mm: params.rainfall_mm_per_hr,
            soil_moisture_pct: params.soil_moisture_percent,
          },
        });
        setPrediction(fallback);
        setIsCalculating(false);
      }
    };

    const timer = setTimeout(runInference, 150);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [params, activeMine]);

  const handlePresetSelect = (
    preset: "CLEAR" | "DRIZZLE" | "MONSOON" | "CLOUDBURST"
  ) => {
    switch (preset) {
      case "CLEAR":
        setIsSynced(false);
        setParams((prev) => ({
          ...prev,
          rainfall_mm_per_hr: 0,
          soil_moisture_percent: 18,
          pore_water_pressure_kpa: 12,
          unscheduled_downtime_hours: 0.5,
        }));
        break;
      case "DRIZZLE":
        setIsSynced(false);
        setParams((prev) => ({
          ...prev,
          rainfall_mm_per_hr: 15,
          soil_moisture_percent: 42,
          pore_water_pressure_kpa: 22,
          unscheduled_downtime_hours: 1.5,
        }));
        break;
      case "MONSOON":
        setIsSynced(false);
        setParams((prev) => ({
          ...prev,
          rainfall_mm_per_hr: 48,
          soil_moisture_percent: 72,
          pore_water_pressure_kpa: 45,
          unscheduled_downtime_hours: 3.5,
        }));
        break;
      case "CLOUDBURST":
        setIsSynced(false);
        setParams((prev) => ({
          ...prev,
          rainfall_mm_per_hr: 95,
          soil_moisture_percent: 92,
          pore_water_pressure_kpa: 78,
          unscheduled_downtime_hours: 6.0,
        }));
        break;
    }
  };

  const handleReset = () => {
    // Snap sliders back to current live telemetry AND re-enable auto-sync
    setIsSynced(true);
    setParams({
      rainfall_mm_per_hr: latestPoint.rainfall_mm_hr,
      soil_moisture_percent: latestPoint.soil_moisture_pct,
      pore_water_pressure_kpa: latestPoint.pore_pressure_kpa,
      active_dumpers: 12,
      active_excavators: 4,
      active_pumps: 6,
      pump_capacity_gpm: activeMine.pump_capacity_gpm,
      dumper_cycle_time_min: 32.0,
      unscheduled_downtime_hours: 2.0,
      manganese_grade_percent: latestPoint.manganese_grade_pct,
      target_tonnage: activeMine.target_daily_tonnage,
    });
  };

  const handleExportReport = () => {
    const headers = ["Timestamp", "Mine", "Risk Level", "Predicted Yield (MT)", "Shortfall (MT)", "Accuracy"];
    const rows = [
      [
        new Date().toISOString(),
        activeMine.name,
        prediction.shortfall_risk_level,
        prediction.predicted_yield_mt,
        prediction.shortfall_tonnage,
        `${((prediction.model_accuracy ?? 0.912) * 100).toFixed(1)}%`
      ].join(",")
    ];
    
    rows.push("");
    rows.push("Priority,Action,Cost (INR),Recovery (MT)");
    prediction.corrective_actions.forEach(a => {
      rows.push(`${a.priority},"${a.title}",${a.cost_estimate_inr},${a.estimated_yield_recovery_mt}`);
    });

    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `MOIL_Shortfall_Report_${activeMine.code}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0E1528] p-5 rounded-2xl border border-slate-800/80 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-purple-400" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              Real-Time Shortfall Simulation Sandbox
            </h1>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Interactively model weather extremes, pump failure dynamics, and haul road degradation to evaluate AI-predicted reserve shortfalls.
          </p>
        </div>

        {/* Mine Selector Bar & Live Mode Toggle */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportReport}
            className="h-8 text-xs font-bold border-slate-700 bg-[#1A2235] hover:bg-slate-800"
          >
            <Download className="h-3 w-3 mr-2" />
            Export Report
          </Button>
          <Button
            size="sm"
            variant={isPlaying ? "destructive" : "default"}
            onClick={() => store.setPlaying(!isPlaying)}
            className="h-8 text-xs font-bold animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.3)]"
          >
            {isPlaying ? "⏹ Stop Live Telemetry" : "▶ Start Live Telemetry"}
          </Button>
          <div className="w-px h-6 bg-slate-700/50 mx-1"></div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {MOIL_MINES.map((mine) => (
              <Button
                key={mine.id}
                size="sm"
                variant={activeMineId === mine.id ? "moil" : "outline"}
                onClick={() => store.setActiveMine(mine.id)}
                className="h-7 text-xs border-slate-700"
              >
                {mine.name.replace(" Mine", "")}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Left Sliders, Right Inference Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Simulation Sliders (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <SimulationSliders
            params={params}
            onChange={(newParams) => { setIsSynced(false); setParams(newParams); }}
            onPresetSelect={handlePresetSelect}
            onReset={handleReset}
          />
        </div>

        {/* Right Column: Inference Gauges & Breakdown (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <ShortfallGauge prediction={prediction} />
          <FeatureContributionChart factors={prediction.contributing_factors} />
        </div>
      </div>

      {/* Scenario Delta Comparative Analysis */}
      <ScenarioComparison currentPrediction={prediction} />

      {/* Prescriptive Corrective Actions */}
      <CorrectiveActionList actions={prediction.corrective_actions} />
    </div>
  );
}

export default function ShortfallPredictorPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-400 font-mono text-xs">
          Loading MOIL Simulation Sandbox...
        </div>
      }
    >
      <PredictorContent />
    </Suspense>
  );
}



