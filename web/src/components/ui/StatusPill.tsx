import { cn } from "@/lib/format";

type Tone = "neutral" | "accent" | "ok" | "warn" | "danger" | "info";

const dot: Record<Tone, string> = {
  neutral: "bg-ink-mute",
  accent: "bg-accent",
  ok: "bg-ok",
  warn: "bg-warn",
  danger: "bg-danger",
  info: "bg-info",
};

const text: Record<Tone, string> = {
  neutral: "text-ink-soft",
  accent: "text-accent-ink",
  ok: "text-ok",
  warn: "text-warn",
  danger: "text-danger",
  info: "text-info",
};

interface StatusPillProps {
  tone?: Tone;
  label: string;
  pulse?: boolean;
  className?: string;
}

// Status dot + label. The dot carries the colour; the label stays legible.
export function StatusPill({ tone = "neutral", label, pulse, className }: StatusPillProps) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-sm", text[tone], className)}>
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping",
              dot[tone],
            )}
          />
        )}
        <span className={cn("relative inline-flex h-2 w-2 rounded-full", dot[tone])} />
      </span>
      {label}
    </span>
  );
}
