"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { RainfallYieldChart } from "@/components/telemetry/RainfallYieldChart";
import { SoilMoistureChart } from "@/components/telemetry/SoilMoistureChart";
import { DewateringChart } from "@/components/telemetry/DewateringChart";
import { SensorHealthTable } from "@/components/telemetry/SensorHealthTable";
import { StreamSimulatorControls } from "@/components/telemetry/StreamSimulatorControls";
import { MOIL_MINES, generateTelemetrySeries, TelemetryTimeSeriesPoint } from "@/lib/mock-telemetry";
import { store, useGlobalStore } from "@/lib/store";
import { Radio, CloudRain, Droplets, Gauge, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";

function TelemetryContent() {
  const searchParams = useSearchParams();
  const mineParam = searchParams.get("mine");

  const { activeMineId, isPlaying, seriesData } = useGlobalStore();

  // Auto-start telemetry on mount
  React.useEffect(() => {
    if (!isPlaying) store.setPlaying(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (mineParam && mineParam !== activeMineId) {
      store.setActiveMine(mineParam);
    }
  }, [mineParam, activeMineId]);

  const selectedMine =
    MOIL_MINES.find((m) => m.id === activeMineId || m.code === activeMineId) ||
    MOIL_MINES[0];

  const handleInjectEvent = (type: "MONSOON_BURST" | "SUMP_SURGE" | "FLEET_DELAY") => {
    const last = seriesData[seriesData.length - 1];
    if (type === "MONSOON_BURST") {
      store.injectOverride({
        rainfall_mm_hr: 68.5,
        cumulative_rainfall_mm: last.cumulative_rainfall_mm + 68.5,
        extraction_tonnes: Math.round(last.extraction_tonnes * 0.4),
      });
    } else if (type === "SUMP_SURGE") {
      store.injectOverride({
        sump_inflow_gpm: 4800,
        pore_pressure_kpa: 65,
      });
    } else if (type === "FLEET_DELAY") {
      store.injectOverride({
        extraction_tonnes: Math.round(last.extraction_tonnes * 0.3),
      });
    }
  };

  const handleReset = () => {
    store.resetToBase();
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0E1528] p-5 rounded-2xl border border-slate-800/80 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-cyan-400" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              Satellite & In-Situ Geotechnical Telemetry Fusion
            </h1>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Multi-modal correlation of Doppler precipitation radar with slope TDR moisture, piezometric pore pressure, and pump head dynamics.
          </p>
        </div>

        {/* Mine Filter Buttons */}
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

      {/* Stream Simulation Controller */}
      <StreamSimulatorControls
        isStreaming={isPlaying}
        onToggleStreaming={() => store.setPlaying(!isPlaying)}
        onInjectEvent={handleInjectEvent}
      />

      {/* Dual Axis Charts Grid */}
      <div className="grid grid-cols-1 gap-6">
        <RainfallYieldChart data={seriesData} mineName={selectedMine.name} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SoilMoistureChart data={seriesData} mineName={selectedMine.name} />
          <DewateringChart data={seriesData} mineName={selectedMine.name} />
        </div>
      </div>

      {/* IoT Geotechnical Node Telemetry Table */}
      <SensorHealthTable />
    </div>
  );
}

export default function TelemetryFusionPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-400 font-mono text-xs">
          Loading MOIL Telemetry Fusion...
        </div>
      }
    >
      <TelemetryContent />
    </Suspense>
  );
}



