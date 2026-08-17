import { useState } from "react";
import {
  UserX,
  ImageOff,
  Video,
  AudioLines,
  ShieldX,
  ArrowRight,
  Radar,
  Loader2,
  Check,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, Badge, Button, Drawer, StatusPill } from "@/components/ui";
import { DemoNotice, DemoBadge } from "@/components/common/DemoNotice";
import { SyntheticPortrait } from "@/components/common/SyntheticPortrait";
import { detections } from "@/mock/detections";
import type { DetectionHit } from "@/lib/types";
import { fmtDateTime, fmtRelative, fmtPercent, cn } from "@/lib/format";

const KIND_META = {
  "fake-profile": { label: "Fake-Profil", icon: UserX },
  "deepfake-image": { label: "Deepfake-Bild", icon: ImageOff },
  "deepfake-video": { label: "Deepfake-Video", icon: Video },
  "voice-clone": { label: "Stimm-Klon", icon: AudioLines },
} as const;

const STATUS_META: Record<
  DetectionHit["status"],
  { label: string; tone: "danger" | "warn" | "info" | "ok" }
> = {
  new: { label: "Neu", tone: "danger" },
  reviewing: { label: "In Prüfung", tone: "warn" },
  "takedown-requested": { label: "Takedown beantragt", tone: "info" },
  resolved: { label: "Erledigt", tone: "ok" },
};

function confidenceTone(c: number) {
  if (c >= 0.85) return "danger";
  if (c >= 0.7) return "warn";
  return "neutral";
}

type ScanState = "idle" | "scanning" | "done";

export default function Monitoring() {
  const [selected, setSelected] = useState<DetectionHit | null>(null);
  const [scan, setScan] = useState<ScanState>("idle");
  const open = detections.filter((d) => d.status === "new" || d.status === "reviewing").length;

  // Simulierter kostenpflichtiger Tiefen-Scan (Demo, kein echter Lauf).
  // // TODO: backend — echten Scan-Auftrag + Zahlung (5 €) auslösen.
  const runScan = () => {
    if (scan !== "idle") return;
    setScan("scanning");
    setTimeout(() => setScan("done"), 2400);
    setTimeout(() => setScan("idle"), 6000);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Deepfake- & Fake-Account-Monitoring"
        title="Wer gibt vor, du zu sein"
        description="Erkannte Fake-Profile, manipulierte Medien und Stimm-Klone — mit Konfidenz, Referenzabgleich und Takedown-Pfad."
        actions={
          <div className="flex items-center gap-3">
            <StatusPill tone="warn" label={`${open} offen`} pulse />
            <Button variant="primary" size="md" onClick={runScan} disabled={scan !== "idle"}>
              {scan === "scanning" ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Scan läuft…
                </>
              ) : scan === "done" ? (
                <>
                  <Check size={15} /> Scan abgeschlossen
                </>
              ) : (
                <>
                  <Radar size={15} /> Tiefen-Scan starten
                  <span className="ml-1 rounded bg-white/20 px-1.5 py-0.5 text-xs font-semibold">
                    5 €
                  </span>
                </>
              )}
            </Button>
          </div>
        }
      />

      <DemoNotice className="mb-6" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {detections.map((d) => {
          const kind = KIND_META[d.kind];
          const status = STATUS_META[d.status];
          return (
            <Card key={d.id}>
              <button
                onClick={() => setSelected(d)}
                className="flex w-full gap-4 p-5 text-left transition-colors hover:bg-sunken/40"
              >
                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-md border",
                    d.status === "new"
                      ? "border-danger/30 bg-danger-soft text-danger"
                      : "border-line bg-sunken text-ink-soft",
                  )}
                >
                  <kind.icon size={20} strokeWidth={1.6} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-ink">{kind.label}</span>
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </div>
                  <div className="mt-0.5 truncate text-sm text-ink-soft">
                    {d.platform} · {d.handle}
                  </div>

                  {/* Confidence bar */}
                  <div className="mt-3 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          confidenceTone(d.confidence) === "danger" && "bg-danger",
                          confidenceTone(d.confidence) === "warn" && "bg-warn",
                          confidenceTone(d.confidence) === "neutral" && "bg-ink-mute",
                        )}
                        style={{ width: `${d.confidence * 100}%` }}
                      />
                    </div>
                    <span className="tnum text-xs font-medium text-ink-soft">
                      {fmtPercent(d.confidence)}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-ink-mute">{fmtRelative(d.detected)}</div>
                </div>
              </button>
            </Card>
          );
        })}
      </div>

      {/* Detail drawer with reference comparison */}
      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        eyebrow={selected ? KIND_META[selected.kind].label : undefined}
        title={selected?.handle}
        footer={
          selected && (
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs text-ink-mute">
                <DemoBadge /> Takedown-Versand folgt mit Backend.
              </span>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled>
                  Als unkritisch markieren
                </Button>
                <Button variant="danger" size="sm" disabled>
                  <ShieldX size={14} /> Takedown
                </Button>
              </div>
            </div>
          )
        }
      >
        {selected && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={STATUS_META[selected.status].tone}>
                {STATUS_META[selected.status].label}
              </Badge>
              <Badge tone={confidenceTone(selected.confidence) as "danger" | "warn" | "neutral"}>
                Konfidenz {fmtPercent(selected.confidence)}
              </Badge>
              <span className="text-xs text-ink-mute">{fmtDateTime(selected.detected)}</span>
            </div>

            {/* Reference vs. found comparison (placeholder visuals) */}
            <div>
              <div className="mb-2.5 text-xs font-semibold uppercase tracking-[0.08em] text-ink-mute">
                Referenz-Abgleich
              </div>
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line">
                <ComparePanel
                  label="Echte Referenz"
                  caption={selected.reference}
                  seed={selected.reference}
                  audio={selected.kind === "voice-clone"}
                  ok
                />
                <ComparePanel
                  label="Gefundener Treffer"
                  caption={`${selected.platform} · ${selected.handle}`}
                  seed={selected.reference}
                  audio={selected.kind === "voice-clone"}
                  manipulated
                />
              </div>
              <p className="mt-2 text-xs text-ink-mute">
                Beispiel-Visualisierung mit synthetischen Bildern. Live: Bild-/Stimm-Embeddings
                mit Ähnlichkeits-Heatmap.
              </p>
            </div>

            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-ink-mute">
                Befund
              </div>
              <p className="text-[15px] leading-relaxed text-ink-soft">{selected.note}</p>
            </div>

            <div className="rounded-md border border-line bg-sunken/50 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-ink">
                <ArrowRight size={15} className="text-accent" /> Empfohlener Pfad
              </div>
              <p className="text-sm text-ink-soft">
                Beweis sichern, Plattform-Meldung mit Identitätsnachweis aus deinem
                verifizierten Kern, bei Ausbleiben Eskalation an Hosting-Provider.
              </p>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

function ComparePanel({
  label,
  caption,
  seed,
  ok,
  manipulated,
  audio,
}: {
  label: string;
  caption: string;
  seed: string;
  ok?: boolean;
  manipulated?: boolean;
  audio?: boolean;
}) {
  return (
    <div className="bg-surface p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-ink-soft">{label}</span>
        {ok && <Badge tone="ok">verifiziert</Badge>}
        {manipulated && <Badge tone="danger">verdächtig</Badge>}
      </div>
      {audio ? (
        <Waveform manipulated={manipulated} />
      ) : (
        <SyntheticPortrait seed={`${seed}${manipulated ? "-fake" : ""}`} manipulated={manipulated} />
      )}
      <p className="mt-2 text-xs text-ink-mute">{caption}</p>
    </div>
  );
}

// Simple synthetic waveform for voice-clone comparisons.
function Waveform({ manipulated }: { manipulated?: boolean }) {
  const bars = Array.from({ length: 40 }, (_, i) =>
    manipulated
      ? 4 + ((i * 73) % 28) + (i % 3 === 0 ? 10 : 0)
      : 6 + Math.round(20 * Math.abs(Math.sin(i / 3))),
  );
  return (
    <div className="flex aspect-[4/3] items-center justify-center gap-[2px] rounded border border-line-strong bg-sunken px-3">
      {bars.map((hgt, i) => (
        <span
          key={i}
          className={cn("w-[2px] rounded-full", manipulated ? "bg-danger/60" : "bg-ink-mute/60")}
          style={{ height: `${hgt}%` }}
        />
      ))}
    </div>
  );
}
