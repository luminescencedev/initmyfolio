"use client";

import { useTheme } from "next-themes";
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
      className="w-8 h-8 flex items-center justify-center border border-border hover:border-foreground hover:bg-foreground hover:text-background transition-colors duration-200 active:scale-[0.95]"
    >
      {theme === "dark"
        ? <Sun weight="regular" className="w-3.5 h-3.5" />
        : <Moon weight="regular" className="w-3.5 h-3.5" />
      }
    </button>
  );
}
