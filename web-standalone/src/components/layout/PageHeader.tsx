import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

// Editorial page masthead — serif title, generous space, hairline below.
export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <header className="mb-8 border-b border-line pb-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          {eyebrow && (
            <div className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-ink-mute">
              {eyebrow}
            </div>
          )}
          <h1 className="font-display text-display-lg text-ink">{title}</h1>
          {description && (
            <p className="mt-2.5 text-[15px] leading-relaxed text-ink-soft">{description}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
