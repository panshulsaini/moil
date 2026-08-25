"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { CorrectiveAction } from "@/lib/types";
import { MOIL_MINES } from "@/lib/mock-telemetry";
import {
  Download,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  FileText,
  ShieldCheck,
} from "lucide-react";

export interface ShiftHandoverExportProps {
  actions: CorrectiveAction[];
}

export function ShiftHandoverExport({ actions }: ShiftHandoverExportProps) {
  const [downloadSuccess, setDownloadSuccess] = React.useState(false);

  const handleDownloadCsv = () => {
    const headers = [
      "Action ID",
      "Mine Code",
      "Category",
      "Priority",
      "Title",
      "Description",
      "Estimated Recovery (MT)",
      "Estimated Cost (INR)",
      "Status",
      "Created At",
      "DGMS Safety Regulation",
    ];

    const rows = actions.map((a) => [
      `"${a.id}"`,
      `"${a.mine_id}"`,
      `"${a.action_type}"`,
      `"${a.priority}"`,
      `"${a.title.replace(/"/g, '""')}"`,
      `"${a.description.replace(/"/g, '""')}"`,
      a.estimated_yield_recovery_mt,
      a.cost_estimate_inr,
      `"${a.status}"`,
      `"${a.created_at}"`,
      '"DGMS Coal & Metal Mines Reg 106/112"',
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `MOIL_DGMS_Shift_Handover_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0A0F1D] p-4 rounded-xl border border-slate-800/90 shadow-md">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/40 text-purple-400">
          <FileSpreadsheet className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            DGMS Shift Handover & Production Assurance Report
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </h4>
          <p className="text-xs text-slate-400">
            Export verified operational dispatches and recovery metrics for Directorate General of Mines Safety records.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          className="h-8 text-xs gap-1.5 border-slate-700 bg-slate-900 text-slate-200"
        >
          <Printer className="h-3.5 w-3.5" />
          <span>Print / PDF</span>
        </Button>

        <Button
          variant="moil"
          size="sm"
          onClick={handleDownloadCsv}
          className="h-8 text-xs gap-1.5"
        >
          {downloadSuccess ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
              <span>Exported CSV!</span>
            </>
          ) : (
            <>
              <Download className="h-3.5 w-3.5" />
              <span>Download CSV</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
