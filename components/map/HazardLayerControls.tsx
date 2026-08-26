"use client";

import * as React from "react";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Layers, CloudRain, ShieldAlert, Truck, Radio } from "lucide-react";

export interface MapLayerState {
  showRainRadar: boolean;
  showSlopeHazards: boolean;
  showFleetGps: boolean;
  showSensors: boolean;
  showProspectivity: boolean;
}

export interface HazardLayerControlsProps {
  layers: MapLayerState;
  onChange: (layers: MapLayerState) => void;
}

export function HazardLayerControls({
  layers,
  onChange,
}: HazardLayerControlsProps) {
  const toggleLayer = (key: keyof MapLayerState) => {
    onChange({
      ...layers,
      [key]: !layers[key],
    });
  };

  return (
    <Card className="border-slate-800/90 bg-[#0B101D]/90 shadow-xl backdrop-blur-md">
      <CardContent className="p-3 space-y-2.5">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
          <Layers className="h-3.5 w-3.5 text-purple-400" /> GIS Spatial Overlays
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-300">
              <CloudRain className="h-3.5 w-3.5 text-cyan-400" />
              Precipitation Radar
            </span>
            <Switch
              checked={layers.showRainRadar}
              onCheckedChange={() => toggleLayer("showRainRadar")}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-300">
              <ShieldAlert className="h-3.5 w-3.5 text-red-400" />
              Slope Hazard Buffers
            </span>
            <Switch
              checked={layers.showSlopeHazards}
              onCheckedChange={() => toggleLayer("showSlopeHazards")}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-300">
              <Truck className="h-3.5 w-3.5 text-amber-400" />
              Live Fleet GPS Pins
            </span>
            <Switch
              checked={layers.showFleetGps}
              onCheckedChange={() => toggleLayer("showFleetGps")}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-300">
              <Radio className="h-3.5 w-3.5 text-purple-400" />
              IoT Sensor Beacons
            </span>
            <Switch
              checked={layers.showSensors}
              onCheckedChange={() => toggleLayer("showSensors")}
            />
          </div>

          <div className="flex items-center justify-between border-t border-slate-700/50 pt-2 mt-2">
            <span className="flex items-center gap-2 text-emerald-400 font-medium">
              <Layers className="h-3.5 w-3.5 text-emerald-400" />
              AI Prospectivity (Reserves)
            </span>
            <Switch
              checked={layers.showProspectivity}
              onCheckedChange={() => toggleLayer("showProspectivity")}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
