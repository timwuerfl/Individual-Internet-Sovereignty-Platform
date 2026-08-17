import { useState } from "react";
import {
  Bot,
  ShieldAlert,
  Check,
  X,
  Power,
  Pause,
  Activity,
  TriangleAlert,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, Badge, Button, Drawer, StatusPill, Toggle } from "@/components/ui";
import { DemoNotice, DemoBadge } from "@/components/common/DemoNotice";
import { agents } from "@/mock/agents";
import type { MonitoredAgent } from "@/lib/types";
import { fmtDateTime, fmtRelative, cn } from "@/lib/format";

const STATUS_META: Record<
  MonitoredAgent["status"],
  { label: string; tone: "ok" | "warn" | "danger" | "neutral"; pulse?: boolean }
> = {
  active: { label: "Aktiv", tone: "ok" },
  paused: { label: "Pausiert", tone: "neutral" },
  anomaly: { label: "Anomalie", tone: "danger", pulse: true },
};

function trustTone(t: number) {
  if (t >= 75) return "ok";
  if (t >= 50) return "warn";
  return "danger";
}

export default function Agents() {
  const [selected, setSelected] = useState<MonitoredAgent | null>(null);
  const anomalies = agents.reduce((n, a) => n + a.anomalies, 0);

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Agenten-Monitoring · Vorschau"
        title="Wer in deinem Namen handelt"
        description="Wenn Agenten beginnen, für dich zu agieren, brauchst du eine Kontrollebene: welche Rechte sie haben, was sie tun, und einen Notausschalter."
        actions={
          anomalies > 0 ? (
            <StatusPill tone="danger" label={`${anomalies} Anomalien`} pulse />
          ) : (
            <StatusPill tone="ok" label="Keine Anomalien" />
          )
        }
      />

      <DemoNotice className="mb-6">
        <span className="font-medium text-ink">Kommendes Feature · Vorschau.</span> Dieses Modul
        antizipiert eine Welt, in der Agenten autonom für dich handeln. Daten und Aktionen sind
        Platzhalter.
      </DemoNotice>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {agents.map((a) => {
          const status = STATUS_META[a.status];
          return (
            <Card key={a.id} className={cn(a.status === "anomaly" && "border-danger/30")}>
              <button
                onClick={() => setSelected(a)}
                className="flex w-full gap-4 p-5 text-left transition-colors hover:bg-sunken/40"
              >
                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-md border",
                    a.status === "anomaly"
                      ? "border-danger/30 bg-danger-soft text-danger"
                      : "border-line bg-sunken text-ink-soft",
                  )}
                >
                  <Bot size={20} strokeWidth={1.6} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-ink">{a.name}</div>
                      <div className="text-xs text-ink-mute">{a.vendor}</div>
                    </div>
                    <StatusPill tone={status.tone} label={status.label} pulse={status.pulse} />
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{a.purpose}</p>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-ink-mute">Vertrauen</span>
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-line">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            trustTone(a.trust) === "ok" && "bg-ok",
                            trustTone(a.trust) === "warn" && "bg-warn",
                            trustTone(a.trust) === "danger" && "bg-danger",
                          )}
                          style={{ width: `${a.trust}%` }}
                        />
                      </div>
                      <span className="tnum text-xs font-medium text-ink-soft">{a.trust}</span>
                    </div>
                    {a.anomalies > 0 && (
                      <Badge tone="danger">
                        <TriangleAlert size={12} /> {a.anomalies}
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            </Card>
          );
        })}
      </div>

      {/* Agent detail: scopes, log, kill-switch */}
      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        eyebrow={selected?.vendor}
        title={selected?.name}
        footer={
          selected && (
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs text-ink-mute">
                <DemoBadge /> Steuerung folgt mit Backend.
              </span>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled>
                  <Pause size={14} /> Pausieren
                </Button>
                <Button variant="danger" size="sm" disabled>
                  <Power size={14} /> Kill-Switch
                </Button>
              </div>
            </div>
          )
        }
      >
        {selected && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill
                tone={STATUS_META[selected.status].tone}
                label={STATUS_META[selected.status].label}
                pulse={STATUS_META[selected.status].pulse}
              />
              <Badge tone={trustTone(selected.trust) as "ok" | "warn" | "danger"}>
                Vertrauen {selected.trust}/100
              </Badge>
              <span className="text-xs text-ink-mute">
                Zuletzt aktiv {fmtRelative(selected.lastActive)}
              </span>
            </div>

            <p className="text-[15px] leading-relaxed text-ink-soft">{selected.purpose}</p>

            {selected.status === "anomaly" && (
              <div className="flex items-start gap-3 rounded-md border border-danger/25 bg-danger-soft px-4 py-3">
                <ShieldAlert size={18} className="mt-0.5 shrink-0 text-danger" />
                <p className="text-sm text-ink-soft">
                  <span className="font-medium text-ink">Anomalie erkannt.</span> Aktionen
                  außerhalb der erlaubten Scopes und zu untypischer Zeit. Prüfung empfohlen.
                </p>
              </div>
            )}

            {/* Scopes */}
            <div>
              <div className="mb-2.5 text-xs font-semibold uppercase tracking-[0.08em] text-ink-mute">
                Berechtigungen (Scopes)
              </div>
              <ul className="divide-y divide-line overflow-hidden rounded-md border border-line">
                {selected.scopes.map((s) => (
                  <li
                    key={s.label}
                    className="flex items-center justify-between gap-3 px-4 py-2.5"
                  >
                    <span className="flex items-center gap-2.5 text-sm">
                      {s.granted ? (
                        <Check size={15} className="text-ok" strokeWidth={2.4} />
                      ) : (
                        <X size={15} className="text-ink-mute" strokeWidth={2.4} />
                      )}
                      <span className={s.granted ? "text-ink" : "text-ink-mute line-through"}>
                        {s.label}
                      </span>
                    </span>
                    <Toggle checked={s.granted} onChange={() => {}} disabled label={s.label} />
                  </li>
                ))}
              </ul>
            </div>

            {/* Audit log */}
            <div>
              <div className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-ink-mute">
                <Activity size={13} /> Audit-Log
              </div>
              <ol className="relative ml-2 space-y-1 border-l border-line pl-6">
                {selected.log.map((entry, i) => (
                  <li key={i} className="relative pb-4">
                    <span
                      className={cn(
                        "absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full border bg-surface",
                        entry.status === "flagged"
                          ? "border-danger/40 text-danger"
                          : "border-line text-ink-mute",
                      )}
                    >
                      {entry.status === "flagged" ? (
                        <TriangleAlert size={12} />
                      ) : (
                        <Check size={12} strokeWidth={2.4} />
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-sm",
                          entry.status === "flagged" ? "font-medium text-danger" : "text-ink",
                        )}
                      >
                        {entry.action}
                      </span>
                    </div>
                    <span className="text-xs text-ink-mute">{fmtDateTime(entry.ts)}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
