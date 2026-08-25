
import { TelemetryTimeSeriesPoint, MOIL_MINES, generateTelemetrySeries } from "./mock-telemetry";

type Listener = () => void;
const listeners = new Set<Listener>();

let activeMineId = MOIL_MINES[0].id;
let isPlaying = false;
let seriesData = generateTelemetrySeries(activeMineId, 24);

let backgroundTimer: any = null;

// The "true" clock that never stops.
// We just advance the state if isPlaying is true.
// Actually, to make it jump when unpaused, we need to track missed ticks.
let lastTickTime = Date.now();

let currentState = {
  activeMineId,
  isPlaying,
  seriesData
};

function emit() {
  currentState = { activeMineId, isPlaying, seriesData };
  listeners.forEach(l => l());
}

setInterval(() => {
  const now = Date.now();
  if (isPlaying) {
    const elapsed = now - lastTickTime;
    const ticks = Math.floor(elapsed / 2000);
    if (ticks > 0) {
      for (let i = 0; i < ticks; i++) {
        const last = seriesData[seriesData.length - 1];
        const mine = MOIL_MINES.find(m => m.id === activeMineId) || MOIL_MINES[0];
        const nextHour = ((parseInt(last.time.slice(0, 2), 10) % 24) + 1).toString().padStart(2, "00") + ":00";

        // Rain: random walk clamped to 0
        const rainNoise = Math.max(0, parseFloat((last.rainfall_mm_hr + (Math.random() * 8 - 3.5)).toFixed(1)));
        const cumRain = parseFloat((last.cumulative_rainfall_mm + rainNoise).toFixed(1));

        // Soil moisture: drifts with rain
        const moisture = Math.min(95, Math.max(20, parseFloat(
          (last.soil_moisture_pct + (rainNoise > 20 ? 1.8 : -0.8) + (Math.random() * 1.2 - 0.6)).toFixed(1)
        )));

        // Factor of safety
        const fos = Math.max(1.05, parseFloat((2.2 - (moisture / 100) * 1.1).toFixed(2)));

        // Sump and pump dynamics
        const sumpInflow = Math.round(1200 + rainNoise * 65 + moisture * 12);
        const pumpDischarge = Math.min(mine.pump_capacity_gpm, Math.round(sumpInflow * 0.95 + 150));

        // Extraction with realistic fluctuation (±20% noise, penalty from rain+moisture)
        const rainPenalty = Math.min(0.65, (rainNoise / 55) * 0.5 + (moisture > 65 ? 0.25 : 0.05));
        const extraction = Math.round(
          (mine.target_daily_tonnage / 24) * (1 - rainPenalty) * (0.88 + Math.random() * 0.24)
        );

        // Pore pressure and grade
        const porePressure = Math.round(15 + moisture * 0.45 + rainNoise * 0.3);
        const grade = parseFloat((42.5 + (Math.random() * 4 - 2)).toFixed(1));

        const newPoint: TelemetryTimeSeriesPoint = {
          ...last,
          time: nextHour,
          rainfall_mm_hr: rainNoise,
          cumulative_rainfall_mm: cumRain,
          soil_moisture_pct: moisture,
          factor_of_safety: fos,
          sump_inflow_gpm: sumpInflow,
          pump_discharge_gpm: pumpDischarge,
          extraction_tonnes: extraction,
          target_tonnes: Math.round(mine.target_daily_tonnage / 24),
          pore_pressure_kpa: porePressure,
          manganese_grade_pct: grade,
        };
        seriesData = [...seriesData.slice(1), newPoint];
      }
      lastTickTime = now - (elapsed % 2000);
      emit();
    }
  }
}, 500);

export const store = {
  getState: () => currentState,
  subscribe: (l: Listener) => { listeners.add(l); return () => listeners.delete(l); },
  setActiveMine: (id: string) => {
    activeMineId = id;
    seriesData = generateTelemetrySeries(id, 24);
    emit();
  },
  setPlaying: (playing: boolean) => {
    if (playing && !isPlaying) {
      const now = Date.now();
      const elapsed = now - lastTickTime;
      const ticks = Math.floor(elapsed / 2000);
      for (let i = 0; i < Math.min(ticks, 24); i++) {
        const last = seriesData[seriesData.length - 1];
        const mine = MOIL_MINES.find(m => m.id === activeMineId) || MOIL_MINES[0];
        const nextHour = ((parseInt(last.time.slice(0, 2), 10) % 24) + 1).toString().padStart(2, "00") + ":00";
        const rainNoise = Math.max(0, parseFloat((last.rainfall_mm_hr + (Math.random() * 8 - 3.5)).toFixed(1)));
        const cumRain = parseFloat((last.cumulative_rainfall_mm + rainNoise).toFixed(1));
        const moisture = Math.min(95, Math.max(20, parseFloat((last.soil_moisture_pct + (rainNoise > 20 ? 1.8 : -0.8)).toFixed(1))));
        const fos = Math.max(1.05, parseFloat((2.2 - (moisture / 100) * 1.1).toFixed(2)));
        const sumpInflow = Math.round(1200 + rainNoise * 65 + moisture * 12);
        const pumpDischarge = Math.min(mine.pump_capacity_gpm, Math.round(sumpInflow * 0.95 + 150));
        const rainPenalty = Math.min(0.65, (rainNoise / 55) * 0.5 + (moisture > 65 ? 0.25 : 0.05));
        const extraction = Math.round((mine.target_daily_tonnage / 24) * (1 - rainPenalty) * (0.88 + Math.random() * 0.24));
        const porePressure = Math.round(15 + moisture * 0.45 + rainNoise * 0.3);
        const grade = parseFloat((42.5 + (Math.random() * 4 - 2)).toFixed(1));
        const newPoint: TelemetryTimeSeriesPoint = {
          ...last, time: nextHour, rainfall_mm_hr: rainNoise, cumulative_rainfall_mm: cumRain,
          soil_moisture_pct: moisture, factor_of_safety: fos, sump_inflow_gpm: sumpInflow,
          pump_discharge_gpm: pumpDischarge, extraction_tonnes: extraction,
          target_tonnes: Math.round(mine.target_daily_tonnage / 24),
          pore_pressure_kpa: porePressure, manganese_grade_pct: grade,
        };
        seriesData = [...seriesData.slice(1), newPoint];
      }
      lastTickTime = now;
    } else if (!playing && isPlaying) {
      lastTickTime = Date.now();
    }
    isPlaying = playing;
    emit();
  },
  resetToBase: () => {
    seriesData = generateTelemetrySeries(activeMineId, 24);
    emit();
  },
  injectOverride: (overrides: Partial<TelemetryTimeSeriesPoint>) => {
    seriesData = [...seriesData];
    seriesData[seriesData.length - 1] = { ...seriesData[seriesData.length - 1], ...overrides };
    emit();
  }
};


import { useSyncExternalStore } from "react";
export function useGlobalStore() {
  return useSyncExternalStore(store.subscribe, store.getState, store.getState);
}

