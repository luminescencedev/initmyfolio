"use client";

import { useTheme } from "@/components/theme-provider";
import { Sun, Moon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-8 h-8" />;

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
      className="w-8 h-8 flex items-center justify-center rounded-lg bg-secondary border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all duration-200 active:scale-[0.92]"
    >
      {theme === "dark" ? (
        <Sun weight="regular" className="w-3.5 h-3.5" />
      ) : (
        <Moon weight="regular" className="w-3.5 h-3.5" />
      )}
    </button>
  );
}
