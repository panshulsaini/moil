"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const DropdownMenuContext = React.createContext<{
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
} | null>(null);

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  
  // Close when clicking outside
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block text-left" ref={ref}>
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
}

export function DropdownMenuTrigger({ asChild, children }: { asChild?: boolean, children: React.ReactNode }) {
  const context = React.useContext(DropdownMenuContext);
  if (!context) throw new Error("DropdownMenuTrigger must be inside DropdownMenu");

  return React.cloneElement(children as React.ReactElement, {
    onClick: () => context.setOpen((prev) => !prev),
  });
}

export function DropdownMenuContent({ children, className, align = "end" }: { children: React.ReactNode, className?: string, align?: "start" | "end" }) {
  const context = React.useContext(DropdownMenuContext);
  if (!context) throw new Error("DropdownMenuContent must be inside DropdownMenu");

  if (!context.open) return null;

  return (
    <div
      className={cn(
        "absolute z-50 mt-2 min-w-[8rem] rounded-md border border-slate-800 bg-slate-950 p-1 text-slate-200 shadow-md animate-in fade-in-80 zoom-in-95",
        align === "end" ? "right-0" : "left-0",
        className
      )}
    >
      {children}
    </div>
  );
}

export function DropdownMenuLabel({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("px-2 py-1.5 text-sm font-semibold text-slate-400", className)}>
      {children}
    </div>
  );
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return <div className={cn("-mx-1 my-1 h-px bg-slate-800", className)} />;
}

export function DropdownMenuItem({ children, className, onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) {
  const context = React.useContext(DropdownMenuContext);
  
  return (
    <div
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-slate-800 focus:bg-slate-800 focus:text-slate-50",
        className
      )}
      onClick={(e) => {
        if (onClick) onClick();
        context?.setOpen(false);
      }}
    >
      {children}
    </div>
  );
}
