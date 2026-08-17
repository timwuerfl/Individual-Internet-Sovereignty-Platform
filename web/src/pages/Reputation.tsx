import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, Umbrella, Globe, Plus, Minus, Circle, Lightbulb } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody, SegmentedControl, Badge, SkeletonRows } from "@/components/ui";
import { DemoNotice } from "@/components/common/DemoNotice";
import { api } from "@/lib/api";
import type { Perspective } from "@icp/shared";
import { cn } from "@/lib/format";

const ICONS: Record<Perspective, typeof Briefcase> = {
  recruiter: Briefcase,
  insurer: Umbrella,
  public: Globe,
};

const TONE_BADGE = {
  positive: { tone: "ok" as const, label: "Vorteilhaft" },
  neutral: { tone: "neutral" as const, label: "Neutral" },
  mixed: { tone: "warn" as const, label: "Gemischt" },
  risk: { tone: "danger" as const, label: "Riskant" },
};

const IMPACT = {
  positive: { icon: Plus, cls: "text-ok", ring: "border-ok/30 bg-ok-soft" },
  neutral: { icon: Circle, cls: "text-ink-mute", ring: "border-line bg-sunken" },
  negative: { icon: Minus, cls: "text-danger", ring: "border-danger/30 bg-danger-soft" },
};

export default function Reputation() {
  const [active, setActive] = useState<Perspective>("recruiter");
  const { data, isLoading } = useQuery({ queryKey: ["reputation"], queryFn: api.reputation });

  const view = data?.find((p) => p.perspective === active);

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Wahrnehmung"
        title="Wie du wirkst"
        description="Dieselbe Identität wird je nach Betrachter völlig anders gelesen. Wechsle die Perspektive, um zu sehen, welches Bild entsteht."
      />

      <div className="mb-6">
        <SegmentedControl
          value={active}
          onChange={setActive}
          options={(data ?? []).map((p) => ({ value: p.perspective, label: p.label }))}
        />
      </div>

      {isLoading || !view ? (
        <Card>
          <SkeletonRows rows={5} />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardBody className="!p-0">
                <div key={active} className="animate-fade-in p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-line text-ink-soft">
                      {(() => {
                        const Icon = ICONS[active];
                        return <Icon size={22} strokeWidth={1.5} />;
                      })()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5">
                        <h2 className="font-display text-display-md text-ink">{view.label}</h2>
                        <Badge tone={TONE_BADGE[view.tone].tone}>{TONE_BADGE[view.tone].label}</Badge>
                      </div>
                      <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">{view.summary}</p>
                    </div>
                  </div>

                  <hr className="my-6 border-line" />

                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-ink-mute">
                    Prägende Signale
                  </h3>
                  <ul className="space-y-2.5">
                    {view.signals.map((s) => {
                      const imp = IMPACT[s.impact];
                      return (
                        <li key={s.id} className="flex items-start gap-3 rounded-md border border-line px-4 py-3">
                          <span className={cn("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border", imp.ring)}>
                            <imp.icon size={13} className={imp.cls} strokeWidth={2.4} />
                          </span>
                          <div>
                            <p className="text-sm font-medium text-ink">{s.label}</p>
                            <p className="mt-0.5 text-sm text-ink-soft">{s.note}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </CardBody>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card>
              <CardBody>
                <div className="mb-4 flex items-center gap-2">
                  <Lightbulb size={17} className="text-accent" strokeWidth={1.6} />
                  <h3 className="text-sm font-semibold text-ink">Empfehlungen</h3>
                </div>
                {view.recommendations.length === 0 ? (
                  <p className="text-sm text-ink-mute">Keine offenen Empfehlungen — alles im grünen Bereich.</p>
                ) : (
                  <ol key={active} className="animate-fade-in space-y-3">
                    {view.recommendations.map((r, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="tnum flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line text-xs font-medium text-ink-soft">
                          {i + 1}
                        </span>
                        <p className="text-sm leading-relaxed text-ink-soft">{r}</p>
                      </li>
                    ))}
                  </ol>
                )}
              </CardBody>
            </Card>

            <DemoNotice variant="demo" className="mt-4">
              <span className="font-medium text-ink">Aufbereitet.</span> Tonalität und Empfehlungen
              werden serverseitig aus deinen Signalen abgeleitet.
            </DemoNotice>
          </div>
        </div>
      )}
    </div>
  );
}
