"use client";

import { useEffect, useId, useRef, type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-primary text-primary-fg hover:opacity-90",
  secondary: "bg-soft text-fg hover:opacity-80 border border-line",
  ghost: "text-fg hover:bg-soft",
  danger: "bg-danger text-white hover:opacity-90",
};

export function Button({
  variant = "secondary",
  className = "",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      {...rest}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
    />
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-3xl border border-line bg-card p-4 shadow-sm sm:p-5 ${className}`}>{children}</section>;
}

export function EmptyState({ emoji, title, children }: { emoji: string; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-line px-6 py-10 text-center">
      <span className="text-5xl" aria-hidden>{emoji}</span>
      <h3 className="text-lg font-semibold">{title}</h3>
      {children && <div className="max-w-sm text-sm text-muted">{children}</div>}
    </div>
  );
}

export const inputCls =
  "min-h-11 w-full rounded-2xl border border-line bg-bg px-3 py-2 text-sm text-fg placeholder:text-muted";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function Modal({
  open, title, onClose, children,
}: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      prev?.focus?.();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center" onMouseDown={onClose}>
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(e) => e.stopPropagation()}
        className="pop-in max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl border border-line bg-card p-5 shadow-xl outline-none"
      >
        <h2 id={titleId} className="mb-3 text-lg font-bold">{title}</h2>
        {children}
      </div>
    </div>
  );
}
