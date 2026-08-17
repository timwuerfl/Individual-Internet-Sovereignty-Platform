import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/format";

interface DemoNoticeProps {
  // "preview" = whole module is backend-pending; "demo" = data is illustrative.
  variant?: "preview" | "demo";
  className?: string;
  children?: React.ReactNode;
}

// Dezenter Hinweis: trennt klar (B) UI-only von (A) interaktiv.
export function DemoNotice({ variant = "preview", className, children }: DemoNoticeProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-md border border-dashed border-line-strong bg-sunken/60 px-4 py-3 text-sm text-ink-soft",
        className,
      )}
    >
      <FlaskConical size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-ink-mute" />
      <p className="leading-relaxed">
        {children ??
          (variant === "preview" ? (
            <>
              <span className="font-medium text-ink">Vorschau · Backend in Entwicklung.</span>{" "}
              Dieses Modul zeigt das geplante Interface mit Demo-Daten. Aktionen sind
              deaktiviert.
            </>
          ) : (
            <>
              <span className="font-medium text-ink">Demo-Daten.</span> Illustrative Werte zur
              Veranschaulichung des Flows.
            </>
          ))}
      </p>
    </div>
  );
}

// Small inline "Demo" marker for individual disabled actions.
export function DemoBadge() {
  return (
    <span className="rounded border border-line-strong bg-sunken px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-mute">
      Demo
    </span>
  );
}
