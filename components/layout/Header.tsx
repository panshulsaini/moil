"use client";

import * as React from "react";
import {
  Bell,
  Clock,
  Radio,
  Sparkles,
  Zap,
  Activity,
  AlertTriangle,
  Menu,
  UserCircle2,
  Shield,
  LogOut,
} from "lucide-react";
import { MineSelector } from "./MineSelector";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface HeaderProps {
  selectedMineId: string;
  onSelectMine: (mineId: string) => void;
  onOpenQuickSim?: () => void;
  onToggleMobileSidebar?: () => void;
}

export function Header({
  selectedMineId,
  onSelectMine,
  onOpenQuickSim,
  onToggleMobileSidebar,
}: HeaderProps) {
  const [time, setTime] = React.useState<string>("");

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
          timeZone: "Asia/Kolkata",
        }) + " IST"
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-[#080D1A]/90 px-4 md:px-6 backdrop-blur-md">
      {/* Left: Mobile Toggle + Live Status Beacon */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Sidebar</span>
        </button>

        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-300 font-mono text-[11px]">
            TELEMETRY STREAM: <strong className="text-emerald-400 font-bold">148/148 NODES ACTIVE</strong>
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-950/40 border border-purple-800/40 text-[11px] font-mono text-purple-300">
          <Zap className="h-3 w-3 text-purple-400" />
          <span>FASTAPI ML ENGINE: ONLINE</span>
        </div>
      </div>

      {/* Right: Mine Selector + Time + Quick Actions */}
      <div className="flex items-center gap-2.5">
        <MineSelector
          selectedMineId={selectedMineId}
          onSelectMine={onSelectMine}
        />

        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <span>{time || "14:30:00 IST"}</span>
        </div>

        {onOpenQuickSim && (
          <Button
            size="sm"
            variant="moil"
            onClick={onOpenQuickSim}
            className="h-8 gap-1.5 text-xs hidden sm:inline-flex"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Fast ML Sim</span>
          </Button>
        )}

        <ThemeToggle />

        {/* Auth / Role Switcher for Demo */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full border border-slate-700 bg-slate-900/50">
              <UserCircle2 className="h-4 w-4 text-slate-300" />
              <span className="sr-only">Toggle role</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-[#0C1220] border-slate-800">
            <DropdownMenuLabel className="text-xs text-slate-400">Current Role</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-800" />
            <DropdownMenuItem className="text-sm text-slate-200 focus:bg-slate-800 cursor-pointer">
              <Shield className="h-4 w-4 mr-2 text-emerald-400" />
              HQ Admin
            </DropdownMenuItem>
            <DropdownMenuItem className="text-sm text-slate-200 focus:bg-slate-800 cursor-pointer">
              <UserCircle2 className="h-4 w-4 mr-2 text-purple-400" />
              Mine Manager
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-800" />
            <DropdownMenuItem className="text-sm text-red-400 focus:bg-red-950/50 cursor-pointer">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </header>
  );
}
