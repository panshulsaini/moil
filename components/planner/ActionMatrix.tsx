"use client";

import * as React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  CorrectiveAction,
  ActionStatus,
  ActionPriority,
} from "@/lib/types";
import { MOCK_CORRECTIVE_ACTIONS, MOIL_MINES } from "@/lib/mock-telemetry";
import { formatIndianCurrency, getPriorityBadge } from "@/lib/utils";
import {
  CheckCircle2,
  Clock,
  Send,
  XCircle,
  Filter,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

export interface ActionMatrixProps {
  actions: CorrectiveAction[];
  onStatusChange: (actionId: string, newStatus: ActionStatus) => void;
}

export function ActionMatrix({ actions, onStatusChange }: ActionMatrixProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("ALL");

  const filteredActions = actions.filter((act) => {
    if (selectedCategory !== "ALL" && act.action_type !== selectedCategory)
      return false;
    if (selectedStatus !== "ALL" && act.status !== selectedStatus) return false;
    return true;
  });

  const getMineName = (mineId: string) => {
    const mine = MOIL_MINES.find((m) => m.id === mineId);
    return mine ? mine.name : "Regional Facility";
  };

  return (
    <Card className="border-slate-800/80 bg-[#0C1220]/90">
      <CardHeader className="p-4 pb-3 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-purple-400" />
          <div>
            <CardTitle className="text-sm font-semibold text-white">
              DGMS-Compliant Corrective Action & Dispatch Matrix
            </CardTitle>
            <p className="text-xs text-slate-400">
              Operational mitigation workflows prioritized by tonnage recovery and safety regulations.
            </p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-8 rounded-md border border-slate-700 bg-slate-900 px-2 text-xs text-slate-200 focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="DEWATERING_BOOST">Dewatering</option>
            <option value="FLEET_REROUTING">Fleet Rerouting</option>
            <option value="GRADE_BLENDING">Grade Blending</option>
            <option value="HAUL_ROAD_MAINTENANCE">Haul Road</option>
            <option value="SLOPE_STABILIZATION">Slope Stabilization</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-8 rounded-md border border-slate-700 bg-slate-900 px-2 text-xs text-slate-200 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="PROPOSED">Proposed</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="EXECUTED">Executed</option>
            <option value="DISMISSED">Dismissed</option>
          </select>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Priority & Type</TableHead>
              <TableHead>Action Title & Scope</TableHead>
              <TableHead>Mining Site</TableHead>
              <TableHead>Tonnage Recovery</TableHead>
              <TableHead>Status Workflow</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredActions.map((act) => {
              const isExecuted = act.status === "EXECUTED";
              const isAcknowledged = act.status === "ACKNOWLEDGED";
              const isProposed = act.status === "PROPOSED";
              const isDismissed = act.status === "DISMISSED";

              return (
                <TableRow key={act.id} className="hover:bg-slate-850/50">
                  {/* Priority & Type */}
                  <TableCell>
                    <div className="space-y-1">
                      <Badge className={getPriorityBadge(act.priority)}>
                        {act.priority}
                      </Badge>
                      <div className="text-[10px] font-mono text-purple-300">
                        {act.action_type}
                      </div>
                    </div>
                  </TableCell>

                  {/* Title & Description */}
                  <TableCell className="max-w-md">
                    <div className="font-semibold text-white text-xs">{act.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      {act.description}
                    </div>
                    {act.notes && (
                      <div className="text-[10px] text-amber-400 mt-1 font-mono flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> {act.notes}
                      </div>
                    )}
                  </TableCell>

                  {/* Mine Site */}
                  <TableCell>
                    <span className="font-medium text-slate-300 text-xs">
                      {getMineName(act.mine_id)}
                    </span>
                  </TableCell>

                  {/* Recovery */}
                  <TableCell>
                    <div className="font-bold font-mono text-emerald-400 text-xs">
                      +{act.estimated_yield_recovery_mt} MT
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Est. {formatIndianCurrency(act.cost_estimate_inr)}
                    </div>
                  </TableCell>

                  {/* Status Badge */}
                  <TableCell>
                    <Badge
                      variant={
                        isExecuted
                          ? "success"
                          : isAcknowledged
                          ? "warning"
                          : isDismissed
                          ? "secondary"
                          : "purple"
                      }
                      className="font-mono text-[10px]"
                    >
                      {act.status}
                    </Badge>
                  </TableCell>

                  {/* Status Action Buttons */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {isProposed && (
                        <Button
                          size="sm"
                          variant="warning"
                          onClick={() => onStatusChange(act.id, "ACKNOWLEDGED")}
                          className="h-7 text-[11px] px-2"
                        >
                          Acknowledge
                        </Button>
                      )}

                      {isAcknowledged && (
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => onStatusChange(act.id, "EXECUTED")}
                          className="h-7 text-[11px] px-2 gap-1"
                        >
                          <CheckCircle2 className="h-3 w-3" /> Execute
                        </Button>
                      )}

                      {isExecuted && (
                        <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Shift Verified
                        </span>
                      )}

                      {!isExecuted && !isDismissed && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onStatusChange(act.id, "DISMISSED")}
                          className="h-7 text-[11px] text-slate-400 hover:text-red-400 px-1.5"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {filteredActions.length === 0 && (
          <div className="p-8 text-center text-xs text-slate-400">
            No corrective actions matching the selected filter criteria.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
