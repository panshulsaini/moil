"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [isDark, setIsDark] = React.useState(true);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-8 w-8 text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 rounded-lg"
      title={isDark ? "Switch to Control Room High-Contrast" : "Switch to Slate Dark"}
    >
      {isDark ? (
        <Moon className="h-4 w-4 text-purple-400" />
      ) : (
        <Sun className="h-4 w-4 text-amber-400" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
