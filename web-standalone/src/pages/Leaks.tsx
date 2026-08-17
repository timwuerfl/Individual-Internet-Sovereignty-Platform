import { useMemo } from "react";
import { Check, Database, ShieldAlert, ArrowRight, Info, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardBody, Badge, Button } from "@/components/ui";
import { RiskTag, RISK_WEIGHT } from "@/components/common/risk";
import { DemoBadge } from "@/components/common/DemoNotice";
import { inventory } from "@/mock/inventory";
import { scanPackages } from "@/mock/scanPackages";
import { usePersistentState } from "@/lib/usePersistentState";
import { fmtRelative, cn } from "@/lib/format";

export default function Leaks() {
  // Leaks stammen aus demselben Inventar wie unter „Identität".
  const leaks = useMemo(
    () =>
      inventory
        .filter((i) => i.category === "leak")
        .sort((a, b) => RISK_WEIGHT[b.risk] - RISK_WEIGHT[a.risk]),
    [],
  );

  // Gewähltes Paket persistiert (Demo-Kauf, keine echte Zahlung).
  const [selectedPkg, setSelectedPkg] = usePersistentState<string | null>("leaks.package", null);

  const criticalCount = leaks.filter((l) => l.risk === "critical").length;
  const exposedCreds = leaks.some((l) =>
    l.exposedData.some((d) => d.toLowerCase().includes("passwort")),
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Datenlecks"
        title="Wo deine Daten aufgetaucht sind"
        description="Lecks, die wir mit dir verknüpft haben — dieselben Fundstellen findest du auch im Identitäts-Inventar. Mit einem Scan-Paket überwachen wir kontinuierlich auf neue."
      />

      {/* Alert if credentials exposed */}
      {exposedCreds && (
        <div className="mb-6 flex items-start gap-3 rounded-md border border-danger/20 bg-danger-soft px-4 py-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-danger" />
          <div className="text-sm">
            <p className="font-medium text-ink">Zugangsdaten betroffen</p>
            <p className="mt-0.5 text-ink-soft">
              In mindestens einem Leck wurden Passwörter offengelegt. Ändere betroffene Zugänge
              und aktiviere 2-Faktor-Authentifizierung.
            </p>
          </div>
        </div>
      )}

      {/* Scan packages */}
      <section className="mb-8">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-display-sm text-ink">Scan-Pakete</h2>
            <p className="mt-1 text-sm text-ink-soft">
              Kontinuierliche Überwachung auf neue Lecks. Einmalzahlung für ein Jahr —{" "}
              <span className="font-medium text-ink">kein Abo</span>.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {scanPackages.map((pkg) => {
            const active = selectedPkg === pkg.id;
            return (
              <Card
                key={pkg.id}
                className={cn(
                  "relative flex flex-col transition-colors",
                  active ? "border-accent ring-1 ring-accent/30" : "hover:border-line-strong",
                )}
              >
                {pkg.highlight && !active && (
                  <span className="absolute -top-2.5 left-5 rounded border border-accent/30 bg-accent-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-ink">
                    Beliebt
                  </span>
                )}
                <CardBody className="flex flex-1 flex-col">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-semibold uppercase tracking-[0.06em] text-ink-soft">
                      {pkg.name}
                    </span>
                    {active && (
                      <Badge tone="accent">
                        <Check size={12} /> Aktiv
                      </Badge>
                    )}
                  </div>

                  <div className="mt-4 flex items-end gap-1.5">
                    <span className="tnum font-display text-display-lg leading-none text-ink">
                      {pkg.price} €
                    </span>
                    <span className="mb-1 text-sm text-ink-mute">/ Jahr</span>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-ink-soft">
                    <div className="flex items-center gap-2">
                      <Database size={15} className="text-accent" /> {pkg.cadence}
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={15} className="text-accent" /> {pkg.scansPerYear}
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={15} className="text-accent" /> Einmalzahlung · kein Abo
                    </div>
                  </div>

                  <p className="mt-4 flex-1 text-sm text-ink-mute">{pkg.blurb}</p>

                  <Button
                    variant={active ? "secondary" : "primary"}
                    size="md"
                    className="mt-5 w-full"
                    onClick={() => setSelectedPkg(active ? null : pkg.id)}
                  >
                    {active ? "Ausgewählt — entfernen" : `Paket wählen · ${pkg.price} €`}
                  </Button>
                </CardBody>
              </Card>
            );
          })}
        </div>

        <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-mute">
          <Info size={13} /> Paketauswahl ist eine Demo (lokal gespeichert) <DemoBadge /> · echte
          Zahlung & Scan-Planung folgen mit Backend.
        </p>
      </section>

      {/* Leaks list */}
      <Card>
        <CardHeader
          title={`Erkannte Lecks (${leaks.length})`}
          caption={`${criticalCount} kritisch · zuletzt geprüft heute`}
          action={
            <Link to="/inventory">
              <Button size="sm" variant="ghost">
                Im Inventar ansehen <ArrowRight size={14} />
              </Button>
            </Link>
          }
        />
        <CardBody className="!p-0">
          <ul>
            {leaks.map((l, i) => (
              <li
                key={l.id}
                className={cn(
                  "flex items-start gap-4 px-5 py-4",
                  i !== leaks.length - 1 && "border-b border-line",
                )}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border",
                    l.risk === "critical"
                      ? "border-danger/30 bg-danger-soft text-danger"
                      : "border-line bg-sunken text-ink-soft",
                  )}
                >
                  <ShieldAlert size={17} strokeWidth={1.6} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-ink">{l.title}</span>
                    <RiskTag level={l.risk} />
                  </div>
                  <p className="mt-0.5 text-sm text-ink-soft">{l.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {l.exposedData.map((d) => (
                      <Badge key={d}>{d}</Badge>
                    ))}
                  </div>
                </div>
                <span className="shrink-0 text-xs text-ink-mute">{fmtRelative(l.discovered)}</span>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
