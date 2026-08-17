import type { ReactNode } from "react";
import { cn } from "@/lib/format";

type Tone = "neutral" | "accent" | "ok" | "warn" | "danger" | "info";

const tones: Record<Tone, string> = {
  neutral: "bg-sunken text-ink-soft border-line-strong",
  accent: "bg-accent-soft text-accent-ink border-accent/20",
  ok: "bg-ok-soft text-ok border-ok/20",
  warn: "bg-warn-soft text-warn border-warn/25",
  danger: "bg-danger-soft text-danger border-danger/20",
  info: "bg-info-soft text-info border-info/20",
};

interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}

// Quiet tag — hairline bordered, never a solid blob.
export function Badge({ children, tone = "neutral", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
