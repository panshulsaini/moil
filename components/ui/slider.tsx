import * as React from "react";
import { cn } from "@/lib/utils";

export interface SliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
  unit?: string;
  label?: string;
  showValue?: boolean;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      value,
      min = 0,
      max = 100,
      step = 1,
      onChange,
      disabled = false,
      className,
      unit = "",
      label,
      showValue = true,
    },
    ref
  ) => {
    const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

    return (
      <div className={cn("w-full space-y-1.5", className)}>
        {(label || showValue) && (
          <div className="flex justify-between items-center text-xs font-medium text-slate-300">
            {label && <span>{label}</span>}
            {showValue && (
              <span className="font-mono text-purple-400 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-800/40">
                {value} {unit}
              </span>
            )}
          </div>
        )}
        <div className="relative flex items-center select-none touch-none w-full">
          <input
            ref={ref}
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className={cn(
              "w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed",
              className
            )}
            style={{
              background: `linear-gradient(to right, #8B5CF6 0%, #8B5CF6 ${percentage}%, #1E293B ${percentage}%, #1E293B 100%)`,
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
          <span>{min} {unit}</span>
          <span>{max} {unit}</span>
        </div>
      </div>
    );
  }
);

Slider.displayName = "Slider";

export { Slider };
