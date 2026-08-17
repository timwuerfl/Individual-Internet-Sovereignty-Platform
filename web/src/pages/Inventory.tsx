import { useMemo, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Search, SlidersHorizontal, ExternalLink, Inbox, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Card,
  Input,
  SegmentedControl,
  Drawer,
  Badge,
  Button,
  EmptyState,
  Table,
  Th,
  Td,
  Tr,
  SkeletonRows,
} from "@/components/ui";
import { RiskTag, RISK_LABEL } from "@/components/common/risk";
import { DemoBadge } from "@/components/common/DemoNotice";
import { api } from "@/lib/api";
import type { IdentityFinding, FindingCategory } from "@icp/shared";
import { fmtDate, fmtRelative } from "@/lib/format";

const CATEGORY_LABEL: Record<FindingCategory | "all", string> = {
  all: "Alle",
  account: "Accounts",
  broker: "Data Broker",
  search: "Suchtreffer",
  leak: "Leaks",
};

const STATUS_LABEL: Record<IdentityFinding["status"], string> = {
  active: "Aktiv",
  dormant: "Ruhend",
  removed: "Entfernt",
};

export default function Inventory() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FindingCategory | "all">("all");
  const [selected, setSelected] = useState<IdentityFinding | null>(null);

  // Counts aus dem ungefilterten Gesamtbestand (für die Filter-Reiter).
  const countsQuery = useQuery({
    queryKey: ["findings", "all"],
    queryFn: () => api.findings({ pageSize: 100 }),
  });

  // Hauptliste — Suche/Filter/Sortierung laufen serverseitig.
  const listQuery = useQuery({
    queryKey: ["findings", { q: query, category }],
    queryFn: () =>
      api.findings({
        q: query || undefined,
        category: category === "all" ? undefined : category,
        sort: "risk",
        pageSize: 100,
      }),
    placeholderData: keepPreviousData,
  });

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: countsQuery.data?.total ?? 0 };
    for (const f of countsQuery.data?.items ?? []) c[f.category] = (c[f.category] ?? 0) + 1;
    return c;
  }, [countsQuery.data]);

  const items = listQuery.data?.items ?? [];
  const loading = listQuery.isLoading;

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Identitäts-Inventar"
        title="Was über dich existiert"
        description="Jede Fundstelle, die wir mit dir verknüpfen konnten — von dir angelegt oder über dich angelegt. Sortiert nach Risiko."
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl
          value={category}
          onChange={setCategory}
          options={(["all", "account", "broker", "search", "leak"] as const).map((c) => ({
            value: c,
            label: `${CATEGORY_LABEL[c]}${counts[c] ? ` ${counts[c]}` : ""}`,
          }))}
        />
        <div className="relative w-full sm:w-72">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" />
          <Input
            placeholder="Fundstellen, Quelle oder Datum suchen…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Card>
        {loading ? (
          <SkeletonRows rows={6} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={query ? Search : Inbox}
            title={query ? "Keine Treffer" : "Nichts gefunden"}
            description={
              query
                ? "Kein Eintrag passt zu deiner Suche. Filter zurücksetzen oder Begriff ändern."
                : "In dieser Kategorie wurde aktuell nichts mit dir verknüpft."
            }
            action={
              query ? (
                <Button variant="secondary" size="sm" onClick={() => setQuery("")}>
                  Suche zurücksetzen
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Fundstelle</Th>
                <Th className="hidden md:table-cell">Kategorie</Th>
                <Th className="hidden lg:table-cell">Exponierte Daten</Th>
                <Th>Risiko</Th>
                <Th className="hidden sm:table-cell">Zuletzt gesehen</Th>
                <Th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <Tr key={it.id} interactive onClick={() => setSelected(it)}>
                  <Td>
                    <div className="font-medium text-ink">{it.title}</div>
                    <div className="text-xs text-ink-mute">{it.source}</div>
                  </Td>
                  <Td className="hidden md:table-cell">
                    <Badge>{CATEGORY_LABEL[it.category]}</Badge>
                  </Td>
                  <Td className="hidden lg:table-cell">
                    <span className="text-sm text-ink-soft">
                      {it.exposedData.slice(0, 3).join(", ")}
                      {it.exposedData.length > 3 && (
                        <span className="text-ink-mute"> +{it.exposedData.length - 3}</span>
                      )}
                    </span>
                  </Td>
                  <Td>
                    <RiskTag level={it.risk} />
                  </Td>
                  <Td className="hidden sm:table-cell">
                    <span className="text-sm text-ink-mute">{fmtRelative(it.lastSeen)}</span>
                  </Td>
                  <Td>
                    <ArrowRight size={15} className="text-ink-mute" />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {!loading && items.length > 0 && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-mute">
          <SlidersHorizontal size={13} /> {items.length} von {counts.all} Fundstellen · serverseitig
          nach Risiko sortiert
        </p>
      )}

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        eyebrow={selected ? CATEGORY_LABEL[selected.category] : undefined}
        title={selected?.title}
        footer={
          selected && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-ink-mute">Aktionen sind in dieser Demo deaktiviert.</span>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled>Ignorieren</Button>
                <Button variant="primary" size="sm" disabled>Maßnahme starten</Button>
              </div>
            </div>
          )
        }
      >
        {selected && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <RiskTag level={selected.risk} />
              <Badge>{STATUS_LABEL[selected.status]}</Badge>
              {selected.url && (
                <a href={`https://${selected.url}`} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-sm text-accent hover:underline">
                  {selected.url} <ExternalLink size={13} />
                </a>
              )}
            </div>

            <p className="text-[15px] leading-relaxed text-ink-soft">{selected.description}</p>

            <DetailGrid
              rows={[
                ["Quelle", selected.source],
                ["Risiko", RISK_LABEL[selected.risk]],
                ["Sensitivität", `${Math.round(selected.sensitivity * 100)} %`],
                ["Entdeckt", fmtDate(selected.discovered)],
                ["Zuletzt gesehen", fmtDate(selected.lastSeen)],
              ]}
            />

            <div>
              <SectionLabel>Exponierte Daten</SectionLabel>
              <div className="flex flex-wrap gap-1.5">
                {selected.exposedData.map((d) => (
                  <Badge key={d} tone="neutral">{d}</Badge>
                ))}
              </div>
            </div>

            {selected.actions.length > 0 && (
              <div>
                <SectionLabel>
                  Empfohlene Maßnahmen <DemoBadge />
                </SectionLabel>
                <ul className="space-y-2">
                  {selected.actions.map((a) => (
                    <li key={a} className="flex items-start gap-2.5 rounded-md border border-line bg-sunken/40 px-3 py-2.5 text-sm text-ink-soft">
                      <ArrowRight size={15} className="mt-0.5 shrink-0 text-accent" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-ink-mute">
      {children}
    </div>
  );
}

function DetailGrid({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line">
      {rows.map(([k, v]) => (
        <div key={k} className="bg-surface px-3.5 py-3">
          <dt className="text-xs text-ink-mute">{k}</dt>
          <dd className="mt-0.5 text-sm font-medium text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
