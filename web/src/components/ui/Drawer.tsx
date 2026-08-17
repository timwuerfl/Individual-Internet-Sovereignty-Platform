import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/format";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  eyebrow?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

// Right-hand detail drawer. Scrim + slide-in, calm timing, no bounce.
export function Drawer({ open, onClose, title, eyebrow, children, footer }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-ink/20 backdrop-blur-[1px] animate-fade-in"
        onClick={onClose}
      />
      <aside
        className={cn(
          "absolute right-0 top-0 h-full w-full max-w-[480px] bg-surface border-l border-line",
          "flex flex-col animate-slide-in",
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div className="min-w-0">
            {eyebrow && (
              <div className="text-xs font-medium uppercase tracking-[0.1em] text-ink-mute">
                {eyebrow}
              </div>
            )}
            {title && (
              <h2 className="mt-1 font-display text-display-sm leading-tight">{title}</h2>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Schließen"
            className="-mr-1 shrink-0 rounded p-1.5 text-ink-mute hover:bg-sunken hover:text-ink"
          >
            <X size={18} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <footer className="border-t border-line px-6 py-4">{footer}</footer>}
      </aside>
    </div>
  );
}
