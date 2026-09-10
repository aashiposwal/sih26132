import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "ok" | "warn" | "danger" | "accent";
}) {
  const tones = {
    neutral: "bg-surface-2 text-ink border-line",
    ok: "bg-accent text-accent-fg border-accent",
    warn: "bg-warn text-ink border-soil",
    danger: "bg-danger text-accent-fg border-danger",
    accent: "bg-accent text-accent-fg border-accent",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[var(--radius-sm)] border-2 px-2.5 py-1 text-sm font-bold",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
