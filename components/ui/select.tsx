import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options?: { value: string; label: string; disabled?: boolean }[];
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, label, options, ...props }, ref) => {
    return (
      <div className="w-full space-y-1">
        {label && (
          <label className="text-xs font-medium text-slate-300 block">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              "flex h-9 w-full items-center justify-between rounded-md border border-slate-700 bg-slate-900/90 px-3 py-2 text-sm text-slate-200 shadow-sm focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:cursor-not-allowed disabled:opacity-50 appearance-none pr-8 cursor-pointer",
              className
            )}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.disabled}
                    className="bg-slate-900 text-slate-200 py-1"
                  >
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
            <svg
              className="h-4 w-4 fill-current"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>
      </div>
    );
  }
);

Select.displayName = "Select";

export { Select };
