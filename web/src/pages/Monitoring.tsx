import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  UserX,
  Search,
  Radar,
  Loader2,
  ExternalLink,
  Check,
  ShieldX,
  XCircle,
  ShieldCheck,
  Image as ImageIcon,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardBody, Field, Input, Button, Badge, SkeletonRows, EmptyState } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import type { Detection, DetectionStatus } from "@icp/shared";
import { fmtPercent, fmtRelative, cn } from "@/lib/format";

const STATUS_META: Record<DetectionStatus, { label: string; tone: "danger" | "warn" | "info" | "ok" }> = {
  new: { label: "Neu", tone: "danger" },
  reviewed: { label: "Geprüft", tone: "info" },
  takedown_requested: { label: "Takedown beantragt", tone: "warn" },
  dismissed: { label: "Verworfen", tone: "ok" },
};

function confidenceTone(c: number): "danger" | "warn" | "neutral" {
  if (c >= 0.85) return "danger";
  if (c >= 0.7) return "warn";
  return "neutral";
}

export default function Monitoring() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const [imageUrl, setImageUrl] = useState("");
  const [name, setName] = useState("");
  const [showKnown, setShowKnown] = useState(false);
  const [lastMock, setLastMock] = useState<boolean | null>(null);

  const feed = useQuery({ queryKey: ["monitoring"], queryFn: api.monitoring });

  const scan = useMutation({
    mutationFn: () =>
      api.scanMonitoring({ imageUrl: imageUrl.trim() || undefined, name: name.trim() || undefined }),
    onSuccess: (res) => {
      setLastMock(res.mock);
      qc.invalidateQueries({ queryKey: ["monitoring"] });
      const parts = [`${res.created} neu`];
      if (res.knownFiltered > 0) parts.push(`${res.knownFiltered} eigene ausgeblendet`);
      if (res.mock) parts.push("Demo-Daten");
      toast(`Scan fertig: ${parts.join(" · ")}`, res.created > 0 ? "ok" : "ok");
    },
    onError: (e: Error) => toast(e.message, "danger"),
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: DetectionStatus }) => api.updateDetection(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["monitoring"] }),
    onError: (e: Error) => toast(e.message, "danger"),
  });

  const items = feed.data?.items ?? [];
  const knownCount = feed.data?.summary.known ?? 0;
  const visible = items.filter((d) => showKnown || !d.isKnown);

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Deepfake- & Fake-Account-Monitoring"
        title="Wer gibt vor, du zu sein"
        description="Reverse-Bildsuche und Namens-Suche finden Profile und Postings, die dein Gesicht oder deinen Namen verwenden. Deine bekannten eigenen Konten werden automatisch herausgerechnet."
      />

      {/* Scan-Formular */}
      <Card className="mb-6">
        <CardHeader
          title="Nach Fake-Accounts suchen"
          caption="Bildsuche (Google Lens) + Namens-/Postings-Suche über SerpAPI."
        />
        <CardBody>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Referenzbild-URL" hint="Öffentlich erreichbare Bild-URL für die Reverse-Bildsuche.">
              <Input
                placeholder="https://…/mein-foto.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </Field>
            <Field label="Name" hint="Für die Textsuche nach Profilen/Postings. Leer = dein Name.">
              <Input placeholder="Lena Kessler" value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Button variant="primary" onClick={() => scan.mutate()} disabled={scan.isPending}>
              {scan.isPending ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Suche läuft…
                </>
              ) : (
                <>
                  <Radar size={15} /> Suchen
                </>
              )}
            </Button>
            {lastMock != null && (
              <span className="text-xs text-ink-mute">
                {lastMock
                  ? "Demo-Modus (kein SerpAPI-Key) — Beispiel-Treffer."
                  : "Live über SerpAPI."}
              </span>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Trefferliste */}
      {feed.isLoading ? (
        <Card>
          <SkeletonRows rows={4} />
        </Card>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Search}
          title={items.length === 0 ? "Noch keine Treffer" : "Keine Fake-Treffer"}
          description={
            items.length === 0
              ? "Starte oben eine Suche nach deinem Bild oder Namen."
              : "Alle Treffer sind deine bekannten eigenen Konten."
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {visible.map((d) => (
            <DetectionCard
              key={d.id}
              d={d}
              busy={setStatus.isPending}
              onStatus={(status) => setStatus.mutate({ id: d.id, status })}
            />
          ))}
        </div>
      )}

      {/* Hinweis auf herausgerechnete eigene Konten */}
      {knownCount > 0 && (
        <button
          onClick={() => setShowKnown((s) => !s)}
          className="mt-4 inline-flex items-center gap-2 text-sm text-ink-mute transition-colors hover:text-ink"
        >
          <ShieldCheck size={15} className="text-ok" />
          {knownCount} {knownCount === 1 ? "eigenes Konto" : "eigene Konten"} mit dem Inventar abgeglichen und{" "}
          {showKnown ? "eingeblendet" : "ausgeblendet"} — {showKnown ? "verbergen" : "anzeigen"}
        </button>
      )}
    </div>
  );
}

function DetectionCard({
  d,
  busy,
  onStatus,
}: {
  d: Detection;
  busy: boolean;
  onStatus: (status: DetectionStatus) => void;
}) {
  const status = STATUS_META[d.status];
  const Icon = d.matchType === "image" ? UserX : Search;
  return (
    <Card>
      <div className="p-5">
        <div className="flex gap-4">
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border",
              d.isKnown
                ? "border-ok/30 bg-ok-soft text-ok"
                : d.status === "new"
                  ? "border-danger/30 bg-danger-soft text-danger"
                  : "border-line bg-sunken text-ink-soft",
            )}
          >
            {d.thumbnail ? (
              <img src={d.thumbnail} alt="" className="h-full w-full object-cover" />
            ) : d.isKnown ? (
              <ShieldCheck size={20} strokeWidth={1.6} />
            ) : (
              <Icon size={20} strokeWidth={1.6} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs text-ink-mute">
                {d.matchType === "image" ? <ImageIcon size={13} /> : <Search size={13} />}
                {d.matchType === "image" ? "Bildtreffer" : "Namenstreffer"}
              </span>
              {d.isKnown ? <Badge tone="ok">Eigenes Konto</Badge> : <Badge tone={status.tone}>{status.label}</Badge>}
            </div>

            <p className="mt-1 truncate text-sm font-medium text-ink">{d.title}</p>
            <div className="truncate text-xs text-ink-soft">
              {d.platform} · {d.source}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                <div
                  className={cn(
                    "h-full rounded-full",
                    confidenceTone(d.confidence) === "danger" && "bg-danger",
                    confidenceTone(d.confidence) === "warn" && "bg-warn",
                    confidenceTone(d.confidence) === "neutral" && "bg-ink-mute",
                  )}
                  style={{ width: `${Math.round(d.confidence * 100)}%` }}
                />
              </div>
              <span className="tnum text-xs font-medium text-ink-soft">{fmtPercent(d.confidence)}</span>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-ink-mute">{fmtRelative(d.ts)}</span>
              <a
                href={d.url}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
              >
                Öffnen <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>

        {!d.isKnown && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-3">
            <Button variant="secondary" size="sm" disabled={busy} onClick={() => onStatus("reviewed")}>
              <Check size={14} /> Geprüft
            </Button>
            <Button variant="danger" size="sm" disabled={busy} onClick={() => onStatus("takedown_requested")}>
              <ShieldX size={14} /> Takedown
            </Button>
            <Button variant="ghost" size="sm" disabled={busy} onClick={() => onStatus("dismissed")}>
              <XCircle size={14} /> Verwerfen
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
