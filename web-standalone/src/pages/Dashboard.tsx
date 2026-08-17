import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Boxes,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  Bot,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardBody, Button, StatusPill, SkeletonRows } from "@/components/ui";
import { ScoreArc, MiniMeter } from "@/components/common/ScoreArc";
import { DemoBadge } from "@/components/common/DemoNotice";
import { NAV } from "@/lib/nav";
import { fmtRelative } from "@/lib/format";
import { api } from "@/lib/api";

const severityTone = { info: "info", ok: "ok", warn: "warn", danger: "danger" } as const;

// Per-module quick status for the grid (illustrative health read).
const moduleStatus: Record<string, { tone: "ok" | "warn" | "danger" | "accent"; label: string; meter: number }> = {
  "/inventory": { tone: "warn", label: "Risiken offen", meter: 58 },
  "/leaks": { tone: "danger", label: "3 Lecks", meter: 72 },
  "/reputation": { tone: "ok", label: "Aktuell", meter: 32 },
  "/legacy": { tone: "warn", label: "1 Asset offen", meter: 40 },
  "/data-rights": { tone: "accent", label: "3 Fälle aktiv", meter: 55 },
  "/monitoring": { tone: "danger", label: "1 neuer Treffer", meter: 78 },
  "/agents": { tone: "danger", label: "Anomalie", meter: 70 },
  "/settings": { tone: "ok", label: "Kern verifiziert", meter: 18 },
};

export default function Dashboard() {
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: api.dashboard });

  const stats = data && [
    { icon: Boxes, label: "Fundstellen", value: data.stats.sourcesTracked, to: "/inventory" },
    { icon: ShieldAlert, label: "Offene Risiken", value: data.stats.openRisks, to: "/inventory" },
    { icon: AlertTriangle, label: "Aktive Leaks", value: data.stats.activeLeaks, to: "/leaks" },
    { icon: Bot, label: "Agenten-Anomalien", value: data.stats.agentAnomalies, to: "/agents" },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Übersicht"
        title="Du besitzt deine digitale Identität."
        description="Eine ruhige Steuerebene zwischen dir und dem Netz: was über dich existiert, wie du wirkst, und was du dagegen tun kannst."
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Exposure-Score" caption="Serverseitig aus deinen Fundstellen berechnet." />
          <CardBody className="flex flex-col items-center pt-6">
            {isLoading || !data ? (
              <div className="skeleton h-[168px] w-[168px] rounded-full" />
            ) : (
              <>
                <ScoreArc value={data.exposureScore} />
                <p className="mt-4 text-sm text-ink-mute">
                  Aggregiert über {data.stats.sourcesTracked} Fundstellen
                </p>
              </>
            )}
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Lage"
            caption="Aggregierte Kennzahlen über alle Module."
            action={
              <Link to="/inventory">
                <Button size="sm" variant="ghost">
                  Inventar öffnen <ArrowUpRight size={15} />
                </Button>
              </Link>
            }
          />
          <CardBody>
            {isLoading || !stats ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skeleton h-24 rounded-md" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line sm:grid-cols-4">
                {stats.map((s) => (
                  <Link key={s.label} to={s.to} className="group bg-surface p-4 transition-colors hover:bg-sunken/60">
                    <s.icon size={18} strokeWidth={1.6} className="mb-3 text-ink-mute" />
                    <div className="tnum font-display text-display-md leading-none text-ink">{s.value}</div>
                    <div className="mt-1.5 text-[13px] text-ink-soft">{s.label}</div>
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-5 flex items-start gap-3 rounded-md border border-danger/20 bg-danger-soft px-4 py-3">
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-danger" />
              <div className="text-sm">
                <p className="font-medium text-ink">Sofortiger Handlungsbedarf</p>
                <p className="mt-0.5 text-ink-soft">
                  Ein altes Klartext-Passwort wurde in „Collection #5“ gefunden. Ändere
                  betroffene Zugänge und aktiviere 2FA.
                </p>
                <Link to="/leaks" className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-danger hover:underline">
                  Lecks ansehen <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Letzte Ereignisse" caption="Chronologisch über alle Module." />
          <CardBody className="!p-0">
            {isLoading || !data ? (
              <SkeletonRows rows={5} />
            ) : (
              <ul>
                {data.events.map((ev, i) => (
                  <li key={ev.id} className={`flex gap-4 px-5 py-4 ${i !== data.events.length - 1 ? "border-b border-line" : ""}`}>
                    <div className="pt-1">
                      <StatusPill tone={severityTone[ev.severity]} label="" pulse={ev.severity === "danger"} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="font-medium text-ink">{ev.title}</p>
                        <span className="shrink-0 text-xs text-ink-mute">{fmtRelative(ev.ts)}</span>
                      </div>
                      <p className="mt-0.5 text-sm text-ink-soft">{ev.detail}</p>
                      <span className="mt-1.5 inline-block text-xs uppercase tracking-wide text-ink-mute">{ev.module}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader title="Module" caption="Status & Reifegrad." />
          <CardBody className="!p-0">
            <ul>
              {NAV.filter((n) => n.path !== "/").map((m, i, arr) => {
                const st = moduleStatus[m.path];
                return (
                  <li key={m.path} className={i !== arr.length - 1 ? "border-b border-line" : ""}>
                    <Link to={m.path} className="group flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-sunken/60">
                      <m.icon size={17} strokeWidth={1.6} className="shrink-0 text-ink-mute" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium text-ink">{m.label}</span>
                          {m.maturity === "preview" && <DemoBadge />}
                        </div>
                        {st && (
                          <div className="mt-1.5 flex items-center gap-2">
                            <div className="w-16"><MiniMeter value={st.meter} /></div>
                            <span className="text-xs text-ink-mute">{st.label}</span>
                          </div>
                        )}
                      </div>
                      <ArrowRight size={15} className="shrink-0 text-ink-mute opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
