import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, ...props }, ref) => {
    return (
      <div className="w-full space-y-1">
        {label && (
          <label className="text-xs font-medium text-slate-300 block">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            "flex h-9 w-full rounded-md border border-slate-700 bg-slate-900/90 px-3 py-1 text-sm text-slate-100 shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500 focus-visible:ring-red-500",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-[10px] text-red-400 font-medium">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
