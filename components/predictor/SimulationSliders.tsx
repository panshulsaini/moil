"use client";

import * as React from "react";
import { Slider } from "@/components/ui/slider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CloudRain,
  Droplets,
  Gauge,
  Truck,
  RotateCcw,
  Zap,
  Flame,
  Shield,
  Layers,
} from "lucide-react";

export interface SimulationParams {
  rainfall_mm_per_hr: number;
  soil_moisture_percent: number;
  pore_water_pressure_kpa: number;
  active_dumpers: number;
  active_excavators: number;
  active_pumps: number;
  pump_capacity_gpm: number;
  dumper_cycle_time_min: number;
  unscheduled_downtime_hours: number;
  manganese_grade_percent: number;
  target_tonnage: number;
}

export interface SimulationSlidersProps {
  params: SimulationParams;
  onChange: (params: SimulationParams) => void;
  onPresetSelect: (presetName: "CLEAR" | "DRIZZLE" | "MONSOON" | "CLOUDBURST") => void;
  onReset: () => void;
}

export function SimulationSliders({
  params,
  onChange,
  onPresetSelect,
  onReset,
}: SimulationSlidersProps) {
  const updateParam = <K extends keyof SimulationParams>(
    key: K,
    value: SimulationParams[K]
  ) => {
    onChange({
      ...params,
      [key]: value,
    });
  };

  return (
    <div className="space-y-4">
      {/* Weather Storm Presets */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#0C1220] p-3 rounded-xl border border-slate-800">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-amber-400" /> Storm Presets:
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onPresetSelect("CLEAR")}
            className="h-7 text-xs bg-slate-900 border-slate-700"
          >
            ☀️ Clear Dry (0mm)
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onPresetSelect("DRIZZLE")}
            className="h-7 text-xs bg-slate-900 border-slate-700"
          >
            🌦️ Light Rain (15mm)
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onPresetSelect("MONSOON")}
            className="h-7 text-xs border-cyan-800/80 bg-cyan-950/30 text-cyan-300"
          >
            🌧️ Monsoon Surge (45mm)
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onPresetSelect("CLOUDBURST")}
            className="h-7 text-xs border-red-800/80 bg-red-950/30 text-red-300"
          >
            ⛈️ Cloudburst (95mm)
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onReset}
            className="h-7 text-xs text-slate-400 hover:text-white gap-1"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </Button>
        </div>
      </div>

      {/* Two Column Control Groups */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Environmental & Weather Telemetry */}
        <Card className="border-slate-800/80 bg-[#0C1220]/90">
          <CardHeader className="p-4 pb-2 border-b border-slate-800/80">
            <CardTitle className="text-xs font-semibold text-cyan-400 flex items-center gap-2">
              <CloudRain className="h-4 w-4" />
              1. Satellite & Geotechnical Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <Slider
              label="Satellite Precipitation Rate"
              value={params.rainfall_mm_per_hr}
              min={0}
              max={150}
              step={1}
              unit="mm/hr"
              onChange={(val) => updateParam("rainfall_mm_per_hr", val)}
            />

            <Slider
              label="Overburden Soil Moisture Saturation"
              value={params.soil_moisture_percent}
              min={5}
              max={95}
              step={0.5}
              unit="%"
              onChange={(val) => updateParam("soil_moisture_percent", val)}
            />

            <Slider
              label="Pore Water Pressure (Piezometer)"
              value={params.pore_water_pressure_kpa}
              min={0}
              max={100}
              step={1}
              unit="kPa"
              onChange={(val) => updateParam("pore_water_pressure_kpa", val)}
            />

            <Slider
              label="Target Daily Manganese Yield"
              value={params.target_tonnage}
              min={300}
              max={2500}
              step={50}
              unit="MT"
              onChange={(val) => updateParam("target_tonnage", val)}
            />
          </CardContent>
        </Card>

        {/* Heavy Machinery & Haulage Fleet */}
        <Card className="border-slate-800/80 bg-[#0C1220]/90">
          <CardHeader className="p-4 pb-2 border-b border-slate-800/80">
            <CardTitle className="text-xs font-semibold text-purple-400 flex items-center gap-2">
              <Truck className="h-4 w-4" />
              2. Machinery & Haulage Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Slider
                label="Active Dumpers"
                value={params.active_dumpers}
                min={2}
                max={25}
                step={1}
                unit="Units"
                onChange={(val) => updateParam("active_dumpers", val)}
              />

              <Slider
                label="Active Excavators"
                value={params.active_excavators}
                min={1}
                max={10}
                step={1}
                unit="Units"
                onChange={(val) => updateParam("active_excavators", val)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Slider
                label="Active Pumps"
                value={params.active_pumps}
                min={1}
                max={12}
                step={1}
                unit="Pumps"
                onChange={(val) => updateParam("active_pumps", val)}
              />

              <Slider
                label="Pump Capacity"
                value={params.pump_capacity_gpm}
                min={500}
                max={6000}
                step={250}
                unit="GPM"
                onChange={(val) => updateParam("pump_capacity_gpm", val)}
              />
            </div>

            <Slider
              label="Haul Truck Round-Trip Cycle Time"
              value={params.dumper_cycle_time_min}
              min={15}
              max={65}
              step={1}
              unit="min"
              onChange={(val) => updateParam("dumper_cycle_time_min", val)}
            />

            <Slider
              label="Unscheduled Equipment Downtime"
              value={params.unscheduled_downtime_hours}
              min={0}
              max={12}
              step={0.5}
              unit="hours"
              onChange={(val) => updateParam("unscheduled_downtime_hours", val)}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
