"use client";

import * as React from "react";
import { Search, Filter, Layers, AlertTriangle } from "lucide-react";
import { MineCard } from "./MineCard";
import { MOIL_MINES } from "@/lib/mock-telemetry";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function MineOverviewGrid() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filterType, setFilterType] = React.useState<"ALL" | "CRITICAL" | "OPENCAST" | "UNDERGROUND">("ALL");

  const filteredMines = MOIL_MINES.filter((mine) => {
    const matchesSearch =
      mine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mine.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mine.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mine.primary_grade.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === "CRITICAL") {
      return mine.risk_level === "CRITICAL" || mine.risk_level === "HIGH";
    }
    if (filterType === "OPENCAST") {
      return mine.mine_type === "OPENCAST" || mine.mine_type === "MIXED";
    }
    if (filterType === "UNDERGROUND") {
      return mine.mine_type === "UNDERGROUND" || mine.mine_type === "MIXED";
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0A0F1C]/80 p-3 rounded-xl border border-slate-800/80">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mr-2">
            <Filter className="h-3.5 w-3.5 text-purple-400" /> Filter Assets:
          </span>
          <Button
            variant={filterType === "ALL" ? "moil" : "outline"}
            size="sm"
            onClick={() => setFilterType("ALL")}
            className="h-7 text-xs"
          >
            All Concessions ({MOIL_MINES.length})
          </Button>
          <Button
            variant={filterType === "CRITICAL" ? "destructive" : "outline"}
            size="sm"
            onClick={() => setFilterType("CRITICAL")}
            className="h-7 text-xs gap-1"
          >
            <AlertTriangle className="h-3 w-3" /> High Risk (3)
          </Button>
          <Button
            variant={filterType === "UNDERGROUND" ? "secondary" : "outline"}
            size="sm"
            onClick={() => setFilterType("UNDERGROUND")}
            className="h-7 text-xs"
          >
            Underground (5)
          </Button>
          <Button
            variant={filterType === "OPENCAST" ? "secondary" : "outline"}
            size="sm"
            onClick={() => setFilterType("OPENCAST")}
            className="h-7 text-xs"
          >
            Opencast (3)
          </Button>
        </div>

        <div className="w-full sm:w-64">
          <Input
            placeholder="Search Balaghat, Bhandara, Grade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 text-xs bg-slate-900 border-slate-700"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredMines.map((mine) => (
          <MineCard key={mine.id} mine={mine} />
        ))}
      </div>

      {filteredMines.length === 0 && (
        <div className="p-8 text-center bg-slate-900/40 rounded-xl border border-slate-800 text-slate-400 text-sm">
          No MOIL mining concessions found matching "{searchTerm}".
        </div>
      )}
    </div>
  );
}
