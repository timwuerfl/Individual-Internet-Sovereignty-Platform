import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/format";

// Structure via hairline + surface, never shadow.
interface CardProps extends HTMLAttributes<HTMLDivElement> {
  inset?: boolean;
}

export function Card({ className, inset, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-line bg-surface",
        inset && "bg-sunken",
        className,
      )}
      {...props}
    />
  );
}

interface CardHeaderProps {
  title: ReactNode;
  caption?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function CardHeader({ title, caption, action, className }: CardHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 px-5 py-4 border-b border-line",
        className,
      )}
    >
      <div className="min-w-0">
        <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-soft font-sans">
          {title}
        </h3>
        {caption && <p className="mt-1 text-sm text-ink-mute">{caption}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}
