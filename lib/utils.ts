import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { RiskLevel, ActionPriority } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTonnage(tonnes: number): string {
  if (isNaN(tonnes)) return "0 MT";
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 1,
  }).format(tonnes) + " MT";
}

export function formatIndianCurrency(inr: number): string {
  if (isNaN(inr)) return "₹0";
  if (inr >= 10000000) {
    return `₹${(inr / 10000000).toFixed(2)} Cr`;
  }
  if (inr >= 100000) {
    return `₹${(inr / 100000).toFixed(2)} Lakh`;
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(inr);
}

export function formatPercent(val: number): string {
  if (isNaN(val)) return "0.0%";
  return `${val.toFixed(1)}%`;
}

export function getRiskColor(risk: RiskLevel | string): {
  bg: string;
  text: string;
  border: string;
  badge: string;
  indicator: string;
} {
  const upper = (risk || "LOW").toUpperCase();
  switch (upper) {
    case "CRITICAL":
      return {
        bg: "bg-red-950/40",
        text: "text-red-400",
        border: "border-red-600/50",
        badge: "bg-red-500/20 text-red-400 border-red-500/40",
        indicator: "bg-red-500",
      };
    case "HIGH":
      return {
        bg: "bg-amber-950/40",
        text: "text-amber-400",
        border: "border-amber-600/50",
        badge: "bg-amber-500/20 text-amber-400 border-amber-500/40",
        indicator: "bg-amber-500",
      };
    case "MODERATE":
    case "MEDIUM":
      return {
        bg: "bg-yellow-950/30",
        text: "text-yellow-300",
        border: "border-yellow-600/40",
        badge: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
        indicator: "bg-yellow-400",
      };
    case "LOW":
    default:
      return {
        bg: "bg-emerald-950/30",
        text: "text-emerald-400",
        border: "border-emerald-600/40",
        badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
        indicator: "bg-emerald-500",
      };
  }
}

export function getPriorityBadge(priority: ActionPriority | string): string {
  const upper = (priority || "LOW").toUpperCase();
  switch (upper) {
    case "URGENT":
      return "bg-red-500/20 text-red-300 border border-red-500/50";
    case "HIGH":
      return "bg-amber-500/20 text-amber-300 border border-amber-500/50";
    case "MEDIUM":
      return "bg-yellow-500/20 text-yellow-300 border border-yellow-500/50";
    case "LOW":
    default:
      return "bg-slate-700/50 text-slate-300 border border-slate-600/50";
  }
}
