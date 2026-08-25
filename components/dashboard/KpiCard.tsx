import * as React from "react";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface KpiCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  delta?: string;
  deltaType?: "positive" | "negative" | "neutral" | "warning";
  icon: LucideIcon;
  iconColor?: string;
  progress?: number; // 0 - 100
  progressColor?: string;
  className?: string;
}

export function KpiCard({
  title,
  value,
  unit,
  subtitle,
  delta,
  deltaType = "neutral",
  icon: Icon,
  iconColor = "text-purple-400",
  progress,
  progressColor = "bg-purple-500",
  className,
}: KpiCardProps) {
  const getDeltaBadge = () => {
    if (!delta) return null;
    switch (deltaType) {
      case "positive":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/40 font-mono">
            <TrendingUp className="h-3 w-3" /> {delta}
          </span>
        );
      case "negative":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-400 bg-red-950/40 px-1.5 py-0.5 rounded border border-red-800/40 font-mono">
            <TrendingDown className="h-3 w-3" /> {delta}
          </span>
        );
      case "warning":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/40 font-mono">
            <TrendingUp className="h-3 w-3" /> {delta}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-800/60 px-1.5 py-0.5 rounded font-mono">
            <Minus className="h-3 w-3" /> {delta}
          </span>
        );
    }
  };

  return (
    <Card
      className={cn(
        "relative overflow-hidden border-slate-800/90 bg-[#0C1322]/90 hover:border-slate-700/90 transition-all shadow-md group",
        className
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
            {title}
          </span>
          <div className={cn("p-2 rounded-lg bg-slate-900/90 border border-slate-800", iconColor)}>
            <Icon className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tracking-tight text-white">
            {value}
          </span>
          {unit && (
            <span className="text-xs font-medium text-slate-400 font-mono">{unit}</span>
          )}
        </div>

        {(delta || subtitle) && (
          <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400">
            {subtitle && <span className="truncate">{subtitle}</span>}
            {getDeltaBadge()}
          </div>
        )}

        {progress !== undefined && (
          <div className="mt-3 space-y-1">
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-500", progressColor)}
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>Progress</span>
              <span>{progress.toFixed(1)}%</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
