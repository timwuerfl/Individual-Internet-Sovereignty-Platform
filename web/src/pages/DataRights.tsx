import { useState } from "react";
import { Check, Clock, Send, FileText, Ban, Trash2, Gavel, CalendarClock } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, Badge, Button, Drawer } from "@/components/ui";
import { DemoNotice, DemoBadge } from "@/components/common/DemoNotice";
import { dataRightsCases } from "@/mock/dataRights";
import type { DataRightsCase, CaseStage } from "@/lib/types";
import { fmtDate, cn } from "@/lib/format";

const STAGE_META: Record<CaseStage, { label: string; icon: typeof FileText }> = {
  access: { label: "Auskunft", icon: FileText },
  objection: { label: "Widerspruch", icon: Ban },
  erasure: { label: "Löschung", icon: Trash2 },
  complaint: { label: "Beschwerde", icon: Gavel },
};

const STAGES: CaseStage[] = ["access", "objection", "erasure", "complaint"];

export default function DataRights() {
  const [selected, setSelected] = useState<DataRightsCase | null>(null);

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Datenrechte · DSGVO"
        title="Deine Rechte durchsetzen"
        description="Von der Auskunft bis zur Beschwerde bei der Aufsichtsbehörde — jeder Fall als nachvollziehbare Pipeline gegen einen Verantwortlichen."
      />

      <DemoNotice className="mb-6" />

      <div className="space-y-4">
        {dataRightsCases.map((c) => (
          <Card key={c.id} className="overflow-hidden">
            <button
              onClick={() => setSelected(c)}
              className="block w-full p-5 text-left transition-colors hover:bg-sunken/40"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-display text-display-sm text-ink">{c.controller}</h3>
                  <p className="mt-1 text-sm text-ink-soft">{c.legalBasisChallenged}</p>
                </div>
                {c.deadline && (
                  <Badge tone="warn">
                    <CalendarClock size={13} /> Frist {fmtDate(c.deadline)}
                  </Badge>
                )}
              </div>

              {/* Pipeline */}
              <div className="mt-5">
                <Pipeline c={c} />
              </div>
            </button>
          </Card>
        ))}
      </div>

      {/* Case timeline drawer */}
      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        eyebrow="Fall-Verlauf"
        title={selected?.controller}
        footer={
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs text-ink-mute">
              <DemoBadge /> Versand & Eskalation folgen mit Backend.
            </span>
            <Button variant="primary" size="sm" disabled>
              <Send size={14} /> Nächsten Schritt senden
            </Button>
          </div>
        }
      >
        {selected && (
          <div className="space-y-6">
            <p className="text-sm leading-relaxed text-ink-soft">
              Angefochtene Grundlage: <span className="text-ink">{selected.legalBasisChallenged}</span>
            </p>

            <ol className="relative ml-2 space-y-1 border-l border-line pl-6">
              {selected.stages.map((st) => {
                const meta = STAGE_META[st.stage];
                const tone =
                  st.state === "done" ? "ok" : st.state === "active" ? "accent" : "neutral";
                return (
                  <li key={st.stage} className="relative pb-5">
                    <span
                      className={cn(
                        "absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full border bg-surface",
                        st.state === "done" && "border-ok/40 text-ok",
                        st.state === "active" && "border-accent/40 text-accent",
                        st.state === "pending" && "border-line text-ink-mute",
                      )}
                    >
                      {st.state === "done" ? (
                        <Check size={13} strokeWidth={2.5} />
                      ) : st.state === "active" ? (
                        <Clock size={13} />
                      ) : (
                        <meta.icon size={12} />
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-ink">{meta.label}</span>
                      <Badge tone={tone as "ok" | "accent" | "neutral"}>
                        {st.state === "done" ? "Erledigt" : st.state === "active" ? "Läuft" : "Ausstehend"}
                      </Badge>
                      {st.date && <span className="text-xs text-ink-mute">{fmtDate(st.date)}</span>}
                    </div>
                    {st.note && <p className="mt-1 text-sm text-ink-soft">{st.note}</p>}
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </Drawer>
    </div>
  );
}

// Compact horizontal stage pipeline shown on each case card.
function Pipeline({ c }: { c: DataRightsCase }) {
  return (
    <div className="flex items-center">
      {STAGES.map((stage, i) => {
        const st = c.stages.find((s) => s.stage === stage)!;
        const meta = STAGE_META[stage];
        return (
          <div key={stage} className="flex flex-1 items-center">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border",
                  st.state === "done" && "border-ok/40 bg-ok-soft text-ok",
                  st.state === "active" && "border-accent/50 bg-accent-soft text-accent ring-2 ring-accent/15",
                  st.state === "pending" && "border-line bg-sunken text-ink-mute",
                )}
              >
                {st.state === "done" ? <Check size={13} strokeWidth={2.5} /> : <meta.icon size={13} />}
              </span>
              <span
                className={cn(
                  "hidden text-xs font-medium sm:inline",
                  st.state === "pending" ? "text-ink-mute" : "text-ink-soft",
                )}
              >
                {meta.label}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <span
                className={cn(
                  "mx-2 h-px flex-1",
                  st.state === "done" ? "bg-ok/40" : "bg-line",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
