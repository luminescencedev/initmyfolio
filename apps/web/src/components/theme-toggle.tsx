"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-9 h-9" />;

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
      className="w-9 h-9 flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted transition-colors duration-200 active:scale-[0.95]"
    >
      {theme === "dark"
        ? <Sun weight="regular" className="w-4 h-4 text-foreground" />
        : <Moon weight="regular" className="w-4 h-4 text-foreground" />
      }
    </button>
  );
}
