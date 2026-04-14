"use client";

import { useState, useEffect, useRef, useId } from "react";
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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  function handleClose() {
    setOpen(false);
    // Return focus to the trigger element after modal closes
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  useEffect(() => {
    if (!open) return;
    // Auto-focus the close button when the dialog opens
    closeButtonRef.current?.focus();

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className={className}
      >
        {trigger}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* backdrop — decorative, keyboard users dismiss via Escape */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-black/25 backdrop-blur-md"
            onClick={handleClose}
          />
          {/* modal card */}
          <div className="pf-glass-card relative z-10 w-full max-w-sm p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span
                id={titleId}
                className="text-sm font-semibold text-foreground"
              >
                {title}
              </span>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={handleClose}
                aria-label="Close dialog"
                className="w-7 h-7 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X weight="bold" className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
            {children}
          </div>
        </div>
      )}
    </>
  );
}
