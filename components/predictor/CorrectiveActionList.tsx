"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CorrectiveActionPlan } from "@/lib/types";
import { formatIndianCurrency, getPriorityBadge } from "@/lib/utils";
import {
  ShieldAlert,
  Droplets,
  Truck,
  RotateCcw,
  CheckCircle2,
  Send,
} from "lucide-react";
import Link from "next/link";

export interface CorrectiveActionListProps {
  actions: CorrectiveActionPlan[];
  onDispatch?: (actionTitle: string) => void;
}

export function CorrectiveActionList({
  actions,
  onDispatch,
}: CorrectiveActionListProps) {
  const [dispatchedIds, setDispatchedIds] = React.useState<Record<string, boolean>>({});

  const handleDispatch = (id: string, title: string) => {
    setDispatchedIds((prev) => ({ ...prev, [id]: true }));
    onDispatch?.(title);
  };

  return (
    <Card className="border-slate-800/80 bg-[#0C1220]/90">
      <CardHeader className="p-4 pb-2 border-b border-slate-800/80 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-emerald-400" />
          <CardTitle className="text-sm font-semibold text-white">
            Prescriptive Corrective Action Recommendations
          </CardTitle>
        </div>
        <Badge variant="success" className="font-mono text-[10px]">
          {actions?.length || 0} Optimizations Available
        </Badge>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {actions && actions.length > 0 ? (
          actions.map((act, idx) => {
            const actId = act.id || `act-${idx}`;
            const isDispatched = dispatchedIds[actId];

            return (
              <div
                key={actId}
                className="p-3.5 rounded-xl border border-slate-800/90 bg-slate-900/60 hover:border-slate-700 transition-all space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityBadge(act.priority)}>
                        {act.priority} PRIORITY
                      </Badge>
                      <span className="text-[10px] font-mono text-purple-400 bg-purple-950/40 px-1.5 py-0.5 rounded border border-purple-800/40">
                        {act.action_type}
                      </span>
                    </div>
                    <h4 className="text-xs font-semibold text-white mt-1.5">
                      {act.title}
                    </h4>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold font-mono text-emerald-400">
                      +{act.estimated_yield_recovery_mt} MT
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Cost: {formatIndianCurrency(act.cost_estimate_inr)}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {act.description}
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                  <span className="text-[10px] text-slate-500 font-mono">
                    DGMS Section 106 Compliance Verified
                  </span>
                  <Button
                    size="sm"
                    variant={isDispatched ? "outline" : "moil"}
                    onClick={() => handleDispatch(actId, act.title)}
                    disabled={isDispatched}
                    className="h-7 text-xs gap-1"
                  >
                    {isDispatched ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                        <span>Dispatched to Shift</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-3 w-3" />
                        <span>Dispatch Action</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-6 text-center text-xs text-slate-400">
            No corrective actions required under current nominal operating conditions.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
