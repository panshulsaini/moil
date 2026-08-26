"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useGlobalStore, store } from "@/lib/store";
import { MineDetailDrawer } from "./MineDetailDrawer";
import { HazardLayerControls, MapLayerState } from "./HazardLayerControls";

// Dynamically import the Leaflet map with SSR disabled to prevent 'window is not defined'
const LeafletMap = dynamic(() => import("./RealLeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] flex items-center justify-center bg-[#0E1528] rounded-xl border border-slate-800 shadow-2xl">
      <div className="text-slate-400 font-mono text-sm animate-pulse">Initializing GIS Satellite Layer...</div>
    </div>
  ),
});

export function GisMiningMap() {
  const { activeMineId: selectedMineId } = useGlobalStore();
  const setSelectedMineId = store.setActiveMine;

  const [layers, setLayers] = React.useState<MapLayerState>({
    showRainRadar: true,
    showSlopeHazards: true,
    showFleetGps: true,
    showSensors: true,
    showProspectivity: false,
  });

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-[#0B1220] border border-slate-800 shadow-2xl">
      {/* HUD Overlays */}
      <div className="absolute top-4 left-4 z-10 flex gap-2 pointer-events-none">
        <div className="px-3 py-1 bg-slate-900/80 backdrop-blur-md rounded-md border border-slate-700 font-mono text-[10px] text-slate-300">
          PROJECTION: WGS84 / EPSG:4326
        </div>
      </div>

      <div className="absolute bottom-4 left-4 z-20 w-64">
        <HazardLayerControls layers={layers} onChange={setLayers} />
      </div>

      <LeafletMap layers={layers} />

      {/* Detail Flyout Drawer */}
      <MineDetailDrawer
        mineId={selectedMineId}
        onClose={() => setSelectedMineId(null)}
      />
    </div>
  );
}
