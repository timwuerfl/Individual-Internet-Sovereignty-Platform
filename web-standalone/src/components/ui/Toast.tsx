import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Check, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/format";

type ToastTone = "ok" | "danger";
interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
}

interface ToastCtx {
  toast: (message: string, tone?: ToastTone) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

export function useToast(): ToastCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast outside provider");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, tone: ToastTone = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, tone, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  const dismiss = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex w-80 flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-3 rounded-md border border-line bg-surface px-4 py-3 text-sm shadow-sm animate-slide-in"
          >
            {t.tone === "ok" ? (
              <Check size={16} className="mt-0.5 shrink-0 text-ok" />
            ) : (
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-danger" />
            )}
            <span className={cn("flex-1", t.tone === "danger" ? "text-ink" : "text-ink-soft")}>
              {t.message}
            </span>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 text-ink-mute hover:text-ink"
              aria-label="Schließen"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
