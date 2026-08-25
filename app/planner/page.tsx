"use client";

import * as React from "react";
import { ActionMatrix } from "@/components/planner/ActionMatrix";
import { TonnageRecoveryCalculator } from "@/components/planner/TonnageRecoveryCalculator";
import { ShiftHandoverExport } from "@/components/planner/ShiftHandoverExport";
import { MOCK_CORRECTIVE_ACTIONS } from "@/lib/mock-telemetry";
import { CorrectiveAction, ActionStatus } from "@/lib/types";
import { ClipboardCheck, ShieldCheck, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CorrectivePlannerPage() {
  const [actions, setActions] = React.useState<CorrectiveAction[]>(MOCK_CORRECTIVE_ACTIONS);

  const handleStatusChange = (actionId: string, newStatus: ActionStatus) => {
    setActions((prev) =>
      prev.map((act) => {
        if (act.id === actionId) {
          return {
            ...act,
            status: newStatus,
            executed_at:
              newStatus === "EXECUTED" ? new Date().toISOString() : act.executed_at,
          };
        }
        return act;
      })
    );
  };

  const handleReset = () => {
    setActions(MOCK_CORRECTIVE_ACTIONS);
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0E1528] p-5 rounded-2xl border border-slate-800/80 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-purple-400" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              Corrective Action Planner & DGMS Dispatch Matrix
            </h1>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Translate ML shortfall predictions into actionable operational mitigations across dewatering pumps, haul road maintenance, and grade blending schedules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleReset}
            className="h-8 text-xs gap-1.5 border-slate-700 bg-slate-900 text-slate-300"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reset Demo Actions</span>
          </Button>
        </div>
      </div>

      {/* Tonnage Recovery & Value Metric Cards */}
      <TonnageRecoveryCalculator actions={actions} />

      {/* Main Action Management Matrix */}
      <ActionMatrix actions={actions} onStatusChange={handleStatusChange} />

      {/* 1-Click DGMS Shift Handover Export & Print Panel */}
      <ShiftHandoverExport actions={actions} />
    </div>
  );
}
