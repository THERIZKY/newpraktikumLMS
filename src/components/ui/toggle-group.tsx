"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ToggleGroupContextValue {
  value: string;
  onValueChange: (val: string) => void;
}

const ToggleGroupContext = React.createContext<ToggleGroupContextValue | null>(null);

export function ToggleGroup({
  value,
  onValueChange,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  value: string;
  onValueChange: (val: string) => void;
}) {
  return (
    <ToggleGroupContext.Provider value={{ value, onValueChange }}>
      <div
        className={cn("inline-flex items-center gap-1 rounded bg-muted/40 p-0.5 border border-border/50", className)}
        {...props}
      >
        {children}
      </div>
    </ToggleGroupContext.Provider>
  );
}

export function ToggleGroupItem({
  value,
  statusVariant,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  value: string;
  statusVariant?: "present" | "late" | "excused" | "absent" | "default";
}) {
  const ctx = React.useContext(ToggleGroupContext);
  if (!ctx) throw new Error("ToggleGroupItem must be used within ToggleGroup");

  const isSelected = ctx.value === value;

  return (
    <button
      type="button"
      onClick={() => ctx.onValueChange(value)}
      className={cn(
        "inline-flex items-center justify-center rounded px-2.5 py-1 text-xs font-mono font-medium transition-all cursor-pointer select-none",
        !isSelected && "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        isSelected && statusVariant === "present" && "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 shadow-xs font-semibold",
        isSelected && statusVariant === "late" && "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 shadow-xs font-semibold",
        isSelected && statusVariant === "excused" && "bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/40 shadow-xs font-semibold",
        isSelected && statusVariant === "absent" && "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/40 shadow-xs font-semibold",
        isSelected && (!statusVariant || statusVariant === "default") && "bg-primary text-primary-foreground shadow-xs font-semibold",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
