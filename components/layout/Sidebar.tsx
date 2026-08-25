"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Radio,
  Sliders,
  Map as MapIcon,
  ClipboardCheck,
  Zap,
  Activity,
  Layers,
  ChevronRight,
  ShieldCheck,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export interface SidebarProps {
  className?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const NAV_ITEMS = [
  {
    label: "Executive Center",
    href: "/",
    icon: LayoutDashboard,
    badge: "Live",
    description: "Regional reserve & KPI cockpit",
  },
  {
    label: "Telemetry Fusion",
    href: "/telemetry",
    icon: Radio,
    badge: "148 Nodes",
    description: "Satellite rainfall & sensor analytics",
  },
  {
    label: "Shortfall Sandbox",
    href: "/predictor",
    icon: Sliders,
    badge: "AI Sim",
    description: "Real-time what-if ML modeling",
  },
  {
    label: "Interactive GIS Map",
    href: "/map",
    icon: MapIcon,
    badge: "8 Mines",
    description: "Spatial hazards & fleet GPS",
  },
  {
    label: "Corrective Planner",
    href: "/planner",
    icon: ClipboardCheck,
    badge: "DGMS Ready",
    description: "Action dispatch & shift handover",
  },
];

export function Sidebar({ className, isCollapsed = false }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex flex-col h-screen border-r border-slate-800/80 bg-[#0A0F1D]/95 text-slate-200 transition-all duration-300 select-none z-30",
        isCollapsed ? "w-20" : "w-64",
        className
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-800/80">
        <div className="relative flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-800 shadow-lg shadow-purple-900/40 text-white shrink-0 font-bold text-lg tracking-wider">
          <span>M</span>
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-[#0A0F1D] animate-ping" />
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-[#0A0F1D]" />
        </div>
        {!isCollapsed && (
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-white tracking-wide">
                MOIL LIMITED
              </span>
              <Badge variant="purple" className="text-[9px] px-1.5 py-0">
                GOI
              </Badge>
            </div>
            <span className="text-[10px] text-slate-400 font-mono truncate">
              Predictive Intelligence v2.4
            </span>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-2 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          {!isCollapsed && "Operational Command"}
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all relative",
                isActive
                  ? "bg-gradient-to-r from-purple-600/30 via-purple-600/15 to-transparent text-white font-semibold border-l-2 border-purple-500 shadow-sm"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform group-hover:scale-110",
                  isActive ? "text-purple-400" : "text-slate-400"
                )}
              />
              {!isCollapsed && (
                <div className="flex items-center justify-between flex-1 min-w-0">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded font-mono font-normal",
                        isActive
                          ? "bg-purple-500/30 text-purple-300 border border-purple-500/40"
                          : "bg-slate-800 text-slate-400"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Corridor Telemetry Mini Card */}
      {!isCollapsed && (
        <div className="p-3 m-3 rounded-xl border border-slate-800/90 bg-[#0E1628]/80 text-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-300">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              Vidarbha Corridor
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">Shift 1 (Day)</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
            <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
              <div className="text-slate-500 text-[9px]">TODAY TARGET</div>
              <div className="text-white font-semibold">6,900 MT</div>
            </div>
            <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
              <div className="text-slate-500 text-[9px]">EXTRACTED</div>
              <div className="text-emerald-400 font-semibold">5,420 MT</div>
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
            <span className="flex items-center gap-1 text-slate-400">
              <ShieldCheck className="h-3 w-3 text-cyan-400" /> DGMS Active
            </span>
            <span className="text-purple-400 font-mono">FastAPI 200 OK</span>
          </div>
        </div>
      )}

      {/* User / Operator Session Footer */}
      <div className="p-3 border-t border-slate-800/80 flex items-center justify-between bg-slate-950/50">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-7 w-7 rounded-full bg-purple-900/60 border border-purple-600/50 flex items-center justify-center text-[11px] font-bold text-purple-300 shrink-0">
            SO
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <div className="text-xs font-medium text-slate-200 truncate">
                Shift Operations In-Charge
              </div>
              <div className="text-[10px] text-slate-500 truncate">
                MOIL Central Control Room
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
