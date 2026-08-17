import { useState } from "react";
import {
  Landmark,
  Share2,
  Mail,
  Cloud,
  CreditCard,
  Bitcoin,
  Users,
  Check,
  CircleDot,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardBody, Badge, Button, Select, Textarea, Drawer, Field } from "@/components/ui";
import { beneficiaries, legacyAssets } from "@/mock/legacy";
import type { LegacyAsset, LegacyDirective } from "@/lib/types";
import { cn } from "@/lib/format";
import { usePersistentState } from "@/lib/usePersistentState";
import { Memorial } from "@/components/legacy/Memorial";

const TYPE_ICON = {
  social: Share2,
  financial: Landmark,
  email: Mail,
  cloud: Cloud,
  subscription: CreditCard,
  crypto: Bitcoin,
} as const;

const DIRECTIVE_META: Record<
  LegacyDirective,
  { label: string; tone: "accent" | "info" | "danger" | "warn"; desc: string }
> = {
  memorialize: { label: "Gedenkzustand", tone: "info", desc: "Profil wird eingefroren und erhalten." },
  transfer: { label: "Übertragen", tone: "accent", desc: "Zugang/Inhalte gehen an Begünstigte." },
  delete: { label: "Löschen", tone: "danger", desc: "Konto und Daten werden entfernt." },
  undecided: { label: "Offen", tone: "warn", desc: "Noch keine Anweisung festgelegt." },
};

export default function Legacy() {
  // Persisted state — this module is fully interactive (A) and survives reloads.
  const [assets, setAssets] = usePersistentState<LegacyAsset[]>("legacy.assets", legacyAssets);
  const [editing, setEditing] = useState<LegacyAsset | null>(null);

  const update = (id: string, patch: Partial<LegacyAsset>) =>
    setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));

  const undecidedCount = assets.filter((a) => a.directive === "undecided").length;
  const coverage = Math.round(((assets.length - undecidedCount) / assets.length) * 100);

  const beneficiaryName = (id: string | null) =>
    id ? (beneficiaries.find((b) => b.id === id)?.name ?? "—") : "—";

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Digitaler Nachlass"
        title="Was nach dir bleibt"
        description="Lege fest, was mit jedem digitalen Konto geschehen soll und wer es verwalten darf. Änderungen werden lokal in dieser Demo gehalten."
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Coverage summary */}
        <Card>
          <CardHeader title="Vollständigkeit" />
          <CardBody>
            <div className="flex items-end gap-2">
              <span className="tnum font-display text-display-lg leading-none text-ink">
                {coverage}
              </span>
              <span className="mb-1 text-ink-mute">% geregelt</span>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-500 ease-subtle"
                style={{ width: `${coverage}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-ink-soft">
              {undecidedCount === 0 ? (
                <span className="inline-flex items-center gap-1.5 text-ok">
                  <Check size={15} /> Alle Assets haben eine Anweisung.
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-warn">
                  <CircleDot size={15} /> {undecidedCount} Asset
                  {undecidedCount > 1 ? "s" : ""} noch offen.
                </span>
              )}
            </p>
          </CardBody>
        </Card>

        {/* Beneficiaries */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Nachlassverwalter & Begünstigte"
            caption="Personen, denen du Verantwortung übertragen kannst."
            action={
              <Button size="sm" variant="secondary" disabled title="Demo">
                <Users size={15} /> Person hinzufügen
              </Button>
            }
          />
          <CardBody className="!p-0">
            <ul>
              {beneficiaries.map((b, i) => {
                const assigned = assets.filter((a) => a.beneficiaryId === b.id).length;
                return (
                  <li
                    key={b.id}
                    className={cn(
                      "flex items-center gap-3 px-5 py-3.5",
                      i !== beneficiaries.length - 1 && "border-b border-line",
                    )}
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft font-display text-sm text-accent-ink">
                      {b.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-ink">{b.name}</div>
                      <div className="text-xs text-ink-mute">
                        {b.relation} · {b.email}
                      </div>
                    </div>
                    <Badge tone={assigned > 0 ? "accent" : "neutral"}>
                      {assigned} Asset{assigned === 1 ? "" : "s"}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          </CardBody>
        </Card>
      </div>

      {/* Asset inventory */}
      <div className="mt-5">
        <Card>
          <CardHeader
            title="Digitale Assets"
            caption="Pro Konto: Anweisung, Begünstigte:r und Notiz."
          />
          <CardBody className="!p-0">
            <ul>
              {assets.map((a, i) => {
                const Icon = TYPE_ICON[a.type];
                const meta = DIRECTIVE_META[a.directive];
                return (
                  <li
                    key={a.id}
                    className={cn(
                      "flex flex-wrap items-center gap-4 px-5 py-4",
                      i !== assets.length - 1 && "border-b border-line",
                    )}
                  >
                    <div className="flex min-w-[200px] flex-1 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line text-ink-soft">
                        <Icon size={17} strokeWidth={1.6} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-ink">{a.account}</div>
                        <div className="truncate text-xs text-ink-mute">{a.value}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                      <span className="hidden text-sm text-ink-soft sm:inline">
                        {a.directive !== "delete" && a.beneficiaryId
                          ? beneficiaryName(a.beneficiaryId)
                          : a.directive === "delete"
                            ? "—"
                            : "kein:e Begünstigte:r"}
                      </span>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(a)}>
                        Bearbeiten
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardBody>
        </Card>
      </div>

      {/* Digitaler Friedhof — kuratierte Gedenk-Inhalte */}
      <div className="mt-5">
        <Memorial />
      </div>

      {/* Edit drawer — local state form */}
      <Drawer
        open={!!editing}
        onClose={() => setEditing(null)}
        eyebrow="Anweisung bearbeiten"
        title={editing?.account}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setEditing(null)}>
              Schließen
            </Button>
            <Button variant="primary" size="sm" onClick={() => setEditing(null)}>
              Übernehmen
            </Button>
          </div>
        }
      >
        {editing && (
          <div className="space-y-5">
            <p className="text-sm text-ink-soft">{editing.value}</p>

            <Field label="Anweisung" hint={DIRECTIVE_META[editing.directive].desc}>
              <Select
                value={editing.directive}
                onChange={(e) => {
                  const directive = e.target.value as LegacyDirective;
                  update(editing.id, {
                    directive,
                    // Löschen braucht keine:n Begünstigte:n.
                    beneficiaryId: directive === "delete" ? null : editing.beneficiaryId,
                  });
                  setEditing((prev) => prev && { ...prev, directive });
                }}
              >
                {(Object.keys(DIRECTIVE_META) as LegacyDirective[]).map((d) => (
                  <option key={d} value={d}>
                    {DIRECTIVE_META[d].label}
                  </option>
                ))}
              </Select>
            </Field>

            {editing.directive !== "delete" && (
              <Field label="Begünstigte:r / Verwalter:in">
                <Select
                  value={editing.beneficiaryId ?? ""}
                  onChange={(e) => {
                    const beneficiaryId = e.target.value || null;
                    update(editing.id, { beneficiaryId });
                    setEditing((prev) => prev && { ...prev, beneficiaryId });
                  }}
                >
                  <option value="">— nicht zugewiesen —</option>
                  {beneficiaries.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.relation})
                    </option>
                  ))}
                </Select>
              </Field>
            )}

            <Field label="Posthume Notiz" hint="Konkrete Wünsche für die Vollstreckung.">
              <Textarea
                value={editing.notes}
                placeholder="z. B. Familienfotos sichern, dann Konto schließen…"
                onChange={(e) => {
                  const notes = e.target.value;
                  update(editing.id, { notes });
                  setEditing((prev) => prev && { ...prev, notes });
                }}
              />
            </Field>
          </div>
        )}
      </Drawer>
    </div>
  );
}
