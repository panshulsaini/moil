"use client";

import * as React from "react";
import { ChevronDown, MapPin, Check } from "lucide-react";
import { MOIL_MINES } from "@/lib/mock-telemetry";
import { cn, getRiskColor } from "@/lib/utils";

export interface MineSelectorProps {
  selectedMineId: string;
  onSelectMine: (mineId: string) => void;
  className?: string;
}

export function MineSelector({
  selectedMineId,
  onSelectMine,
  className,
}: MineSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedMine =
    selectedMineId === "ALL"
      ? null
      : MOIL_MINES.find((m) => m.id === selectedMineId || m.code === selectedMineId);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/80 hover:border-purple-500/50 text-xs font-medium text-slate-100 transition-all shadow-md group"
      >
        <MapPin className="h-3.5 w-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
        <span className="max-w-[140px] truncate">
          {selectedMine ? selectedMine.name : "All MOIL Concessions (8 Sites)"}
        </span>
        {selectedMine && (
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              getRiskColor(selectedMine.risk_level).indicator
            )}
          />
        )}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-slate-400 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-700/90 bg-[#0D1424] p-1.5 shadow-2xl z-50 animate-in fade-in-0 zoom-in-95">
          <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
            Select MOIL Mining Asset
          </div>
          <div className="max-h-64 overflow-y-auto py-1 space-y-0.5">
            <button
              type="button"
              onClick={() => {
                onSelectMine("ALL");
                setIsOpen(false);
              }}
              className={cn(
                "w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md text-left transition-colors",
                selectedMineId === "ALL"
                  ? "bg-purple-600/30 text-purple-300 font-semibold"
                  : "text-slate-300 hover:bg-slate-800/80"
              )}
            >
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-purple-400" />
                <div>
                  <div className="font-medium">All MOIL Concessions</div>
                  <div className="text-[10px] text-slate-500">
                    Vidarbha-Balaghat Regional Corridor
                  </div>
                </div>
              </div>
              {selectedMineId === "ALL" && <Check className="h-3.5 w-3.5" />}
            </button>

            {MOIL_MINES.map((mine) => {
              const isSelected =
                selectedMineId === mine.id || selectedMineId === mine.code;
              const risk = getRiskColor(mine.risk_level);

              return (
                <button
                  key={mine.id}
                  type="button"
                  onClick={() => {
                    onSelectMine(mine.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md text-left transition-colors",
                    isSelected
                      ? "bg-purple-600/30 text-purple-300 font-semibold"
                      : "text-slate-300 hover:bg-slate-800/80"
                  )}
                >
                  <div className="flex items-center gap-2 truncate">
                    <div
                      className={cn(
                        "h-2 w-2 rounded-full shrink-0",
                        risk.indicator
                      )}
                    />
                    <div className="truncate">
                      <div className="font-medium truncate">{mine.name}</div>
                      <div className="text-[10px] text-slate-500">
                        {mine.state} • {mine.mine_type} • {mine.target_daily_tonnage} MT/d
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
