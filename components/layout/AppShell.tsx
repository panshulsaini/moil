"use client";

import * as React from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SimulationSliders } from "@/components/predictor/SimulationSliders";
import { ShortfallGauge } from "@/components/predictor/ShortfallGauge";
import { FeatureContributionChart } from "@/components/predictor/FeatureContributionChart";
import { Button } from "@/components/ui/button";
import { MOIL_MINES } from "@/lib/mock-telemetry";
import { calculatePredictionFallback } from "@/lib/fallback-predictor";
import { PredictResultData } from "@/lib/types";
import { Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useGlobalStore, store } from "@/lib/store";

export interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { activeMineId } = useGlobalStore();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);
  const [isQuickSimOpen, setIsQuickSimOpen] = React.useState(false);

  // Quick simulation sandbox state
  const [rainfall, setRainfall] = React.useState(45);
  const [soilMoisture, setSoilMoisture] = React.useState(70);
  const [downtime, setDowntime] = React.useState(3.5);
  const [prediction, setPrediction] = React.useState<PredictResultData | null>(null);

  // Trigger fast prediction whenever quick sim opens or sliders change
  React.useEffect(() => {
    if (isQuickSimOpen) {
      const activeMine = MOIL_MINES.find((m) => m.id === activeMineId) || MOIL_MINES[0];
      const result = calculatePredictionFallback({
        mine_id: activeMine.id,
        target_override_mt: activeMine.target_daily_tonnage,
        current_extraction_override_mt: activeMine.current_daily_tonnage,
        weather_overrides: {
          rainfall_mm: rainfall,
          soil_moisture_pct: soilMoisture,
        },
      });
      setPrediction(result);
    }
  }, [isQuickSimOpen, activeMineId, rainfall, soilMoisture, downtime]);

  return (
    <div className="flex min-h-screen bg-[#070B14] text-slate-100 antialiased font-sans">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="relative z-50 flex w-64 flex-col">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main App Container */}
      <div className="flex flex-1 flex-col min-w-0 overflow-x-hidden">
        <Header
          selectedMineId={activeMineId || "ALL"}
          onSelectMine={(id) => store.setActiveMine(id === "ALL" ? null : id)}
          onOpenQuickSim={() => setIsQuickSimOpen(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />
        <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>

      {/* Quick Simulation Modal */}
      <Dialog open={isQuickSimOpen} onOpenChange={setIsQuickSimOpen}>
        <DialogContent className="max-w-2xl bg-[#0C1220] border-slate-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-purple-300">
              <Sparkles className="h-5 w-5 text-purple-400" />
              Rapid ML Shortfall Simulation
            </DialogTitle>
            <DialogDescription>
              Instantly simulate precipitation surges and slope moisture impacts for{" "}
              <strong className="text-slate-200">
                {!activeMineId
                  ? "All Regional MOIL Assets"
                  : MOIL_MINES.find((m) => m.id === activeMineId)?.name || "Balaghat Mine"}
              </strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-300">
                  Precipitation & Geological Sliders
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Rainfall Rate</span>
                    <span className="font-mono text-purple-400">{rainfall} mm/hr</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={150}
                    value={rainfall}
                    onChange={(e) => setRainfall(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg accent-purple-500 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Overburden Soil Moisture</span>
                    <span className="font-mono text-blue-400">{soilMoisture}%</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={95}
                    value={soilMoisture}
                    onChange={(e) => setSoilMoisture(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg accent-blue-500 cursor-pointer"
                  />
                </div>
              </div>

              {prediction && (
                <div className="flex flex-col justify-center items-center bg-[#070B14] p-3 rounded-lg border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">
                    Predicted Shortfall
                  </div>
                  <div className="text-2xl font-bold font-mono text-red-400 mt-0.5">
                    {prediction.shortfall_tonnage} MT
                  </div>
                  <div className="text-xs text-slate-400">
                    Risk Level:{" "}
                    <strong className="text-amber-400 font-bold">
                      {prediction.shortfall_risk_level}
                    </strong>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Confidence: {(prediction.confidence_score * 100).toFixed(0)}% • Mode:{" "}
                    {prediction.service_mode}
                  </div>
                </div>
              )}
            </div>

            {prediction?.corrective_actions && prediction.corrective_actions.length > 0 && (
              <div className="bg-purple-950/20 border border-purple-800/40 rounded-lg p-3">
                <div className="text-xs font-semibold text-purple-300 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-purple-400" />
                  Prescribed Mitigation Action
                </div>
                <div className="text-xs text-slate-300">
                  {prediction.corrective_actions[0].title} —{" "}
                  <span className="text-emerald-400 font-mono">
                    +{prediction.corrective_actions[0].estimated_yield_recovery_mt} MT Recovery
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-2">
            <Link
              href="/predictor"
              onClick={() => setIsQuickSimOpen(false)}
              className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium"
            >
              Open Full Simulation Sandbox <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsQuickSimOpen(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
