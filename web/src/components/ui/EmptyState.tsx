import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-line text-ink-mute">
        <Icon size={20} strokeWidth={1.5} />
      </div>
      <p className="font-display text-display-sm text-ink">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-ink-mute">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
