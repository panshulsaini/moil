"use client";

import * as React from "react";
import { Play, Pause, Zap, CloudLightning, Droplets, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface StreamSimulatorControlsProps {
  isStreaming: boolean;
  onToggleStreaming: () => void;
  onInjectEvent: (eventType: "MONSOON_BURST" | "SUMP_SURGE" | "FLEET_DELAY") => void;
}

export function StreamSimulatorControls({
  isStreaming,
  onToggleStreaming,
  onInjectEvent,
}: StreamSimulatorControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0A0F1D] p-3.5 rounded-xl border border-slate-800/90 shadow-md">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={isStreaming ? "destructive" : "success"}
            onClick={onToggleStreaming}
            className="h-8 gap-1.5 text-xs font-semibold"
          >
            {isStreaming ? (
              <>
                <Pause className="h-3.5 w-3.5" /> Pause Stream
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" /> Resume Stream
              </>
            )}
          </Button>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                isStreaming ? "bg-emerald-400 opacity-75" : "bg-slate-500"
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isStreaming ? "bg-emerald-500" : "bg-slate-500"
              }`}
            />
          </span>
          <span className="text-xs font-mono text-slate-400">
            {isStreaming ? "Simulating 1hr / sec" : "Simulation Idle"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <Zap className="h-3 w-3 text-amber-400" /> Inject Real-Time Incident:
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onInjectEvent("MONSOON_BURST")}
          className="h-7 text-[11px] gap-1 border-cyan-800/60 bg-cyan-950/20 text-cyan-300 hover:bg-cyan-900/40"
        >
          <CloudLightning className="h-3 w-3 text-cyan-400" />
          Cloudburst (65mm/h)
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onInjectEvent("SUMP_SURGE")}
          className="h-7 text-[11px] gap-1 border-purple-800/60 bg-purple-950/20 text-purple-300 hover:bg-purple-900/40"
        >
          <Droplets className="h-3 w-3 text-purple-400" />
          Sump Inundation
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onInjectEvent("FLEET_DELAY")}
          className="h-7 text-[11px] gap-1 border-amber-800/60 bg-amber-950/20 text-amber-300 hover:bg-amber-900/40"
        >
          <Truck className="h-3 w-3 text-amber-400" />
          Ramp Jam (+15m)
        </Button>
      </div>
    </div>
  );
}
