import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-purple-600 text-white shadow hover:bg-purple-700",
        secondary:
          "border-transparent bg-slate-800 text-slate-300 hover:bg-slate-700",
        destructive:
          "border-transparent bg-red-600/20 text-red-400 border-red-500/40",
        outline: "text-slate-300 border-slate-700",
        success:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-medium",
        warning:
          "border-amber-500/30 bg-amber-500/10 text-amber-400 font-medium",
        critical:
          "border-red-500/40 bg-red-500/20 text-red-300 font-bold animate-pulse",
        purple:
          "border-purple-500/30 bg-purple-500/10 text-purple-300 font-medium",
        cyan:
          "border-cyan-500/30 bg-cyan-500/10 text-cyan-300 font-medium",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
