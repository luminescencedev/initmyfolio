"use client";

import { useState, useEffect } from "react";
import { X } from "@phosphor-icons/react/dist/ssr";

interface ModalTileProps {
  trigger: React.ReactNode;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function ModalTile({
  trigger,
  title,
  children,
  className,
}: ModalTileProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {trigger}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/25 backdrop-blur-md"
            onClick={() => setOpen(false)}
          />
          {/* modal card */}
          <div className="pf-glass-card relative z-10 w-full max-w-sm p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">
                {title}
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X weight="bold" className="w-3.5 h-3.5" />
              </button>
            </div>
            {children}
          </div>
        </div>
      )}
    </>
  );
}
