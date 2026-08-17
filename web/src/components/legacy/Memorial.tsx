import { useState } from "react";
import {
  Flower2,
  Image as ImageIcon,
  Mail,
  Video,
  AudioLines,
  FileText,
  Globe,
  Users,
  KeyRound,
  Plus,
  Trash2,
  Paperclip,
  ExternalLink,
} from "lucide-react";
import { Card, CardHeader, CardBody, Badge, Button, Toggle, Field, Input, Select, Textarea } from "@/components/ui";
import { memorialSeed } from "@/mock/legacy";
import type { MemorialItem, MemorialKind, MemorialVisibility } from "@/lib/types";
import { usePersistentState } from "@/lib/usePersistentState";
import { cn } from "@/lib/format";

const KIND_META: Record<MemorialKind, { label: string; icon: typeof Mail }> = {
  photo: { label: "Foto", icon: ImageIcon },
  letter: { label: "Brief", icon: Mail },
  video: { label: "Video", icon: Video },
  voice: { label: "Sprachnachricht", icon: AudioLines },
  document: { label: "Dokument", icon: FileText },
};

const VIS_META: Record<
  MemorialVisibility,
  { label: string; icon: typeof Globe; tone: "accent" | "info" | "neutral" }
> = {
  public: { label: "Öffentlich", icon: Globe, tone: "accent" },
  family: { label: "Nur Familie", icon: Users, tone: "info" },
  code: { label: "Mit Zugangscode", icon: KeyRound, tone: "neutral" },
};

const blankDraft = (): Omit<MemorialItem, "id"> => ({
  title: "",
  kind: "letter",
  visibility: "family",
  fileName: "",
  message: "",
});

// Digitaler Friedhof: kuratierte Inhalte, die posthum auf einer Gedenkseite
// zugänglich gemacht werden. Voll interaktiv (A), persistiert via localStorage.
export function Memorial() {
  const [enabled, setEnabled] = usePersistentState("memorial.enabled", true);
  const [items, setItems] = usePersistentState<MemorialItem[]>("memorial.items", memorialSeed);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(blankDraft());

  const addItem = () => {
    if (!draft.title.trim()) return;
    setItems((prev) => [
      ...prev,
      { ...draft, fileName: draft.fileName || "anhang.dat", id: `mem-${Date.now()}` },
    ]);
    setDraft(blankDraft());
    setAdding(false);
  };

  return (
    <Card>
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            <Flower2 size={15} className="text-accent" strokeWidth={1.7} /> Digitaler Friedhof
          </span>
        }
        caption="Inhalte, die nach dir auf einer öffentlichen Gedenkseite zugänglich sein sollen."
        action={
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-ink-mute">Gedenkseite</span>
            <Toggle checked={enabled} onChange={setEnabled} label="Gedenkseite aktiv" />
          </div>
        }
      />
      <CardBody className="!p-0">
        {/* Public memorial page address (simulated) */}
        <div
          className={cn(
            "flex items-center justify-between gap-3 border-b border-line px-5 py-3.5 text-sm",
            !enabled && "opacity-50",
          )}
        >
          <div className="flex items-center gap-2 text-ink-soft">
            <Globe size={15} className="text-ink-mute" />
            <span>Deine Gedenkseite:</span>
            <span className="font-medium text-accent-ink">friedhof.identity.io/lena-kessler</span>
          </div>
          <a
            className={cn(
              "inline-flex items-center gap-1 text-xs",
              enabled ? "text-accent hover:underline" : "pointer-events-none text-ink-mute",
            )}
            href="#"
            onClick={(e) => e.preventDefault()}
            title="Demo"
          >
            Vorschau <ExternalLink size={12} />
          </a>
        </div>

        {/* Items */}
        <ul className={cn(!enabled && "pointer-events-none opacity-50")}>
          {items.map((it, i) => {
            const kind = KIND_META[it.kind];
            const vis = VIS_META[it.visibility];
            return (
              <li
                key={it.id}
                className={cn(
                  "flex items-start gap-3.5 px-5 py-4",
                  i !== items.length - 1 && "border-b border-line",
                )}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line text-ink-soft">
                  <kind.icon size={17} strokeWidth={1.6} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-ink">{it.title}</span>
                    <Badge tone={vis.tone}>
                      <vis.icon size={11} /> {vis.label}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-sm text-ink-soft">{it.message}</p>
                  <div className="mt-1.5 inline-flex items-center gap-1 text-xs text-ink-mute">
                    <Paperclip size={12} /> {it.fileName}
                  </div>
                </div>
                <button
                  onClick={() => setItems((prev) => prev.filter((x) => x.id !== it.id))}
                  className="shrink-0 rounded p-1.5 text-ink-mute hover:bg-sunken hover:text-danger"
                  aria-label="Entfernen"
                  title="Entfernen"
                >
                  <Trash2 size={15} />
                </button>
              </li>
            );
          })}
          {items.length === 0 && (
            <li className="px-5 py-8 text-center text-sm text-ink-mute">
              Noch keine Inhalte hinterlegt.
            </li>
          )}
        </ul>

        {/* Add form */}
        <div className="border-t border-line p-5">
          {adding ? (
            <div className="space-y-4 rounded-md border border-line bg-sunken/40 p-4">
              <Field label="Titel">
                <Input
                  autoFocus
                  value={draft.title}
                  placeholder="z. B. Abschiedsbrief an meine Familie"
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Art">
                  <Select
                    value={draft.kind}
                    onChange={(e) => setDraft({ ...draft, kind: e.target.value as MemorialKind })}
                  >
                    {(Object.keys(KIND_META) as MemorialKind[]).map((k) => (
                      <option key={k} value={k}>
                        {KIND_META[k].label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Sichtbarkeit">
                  <Select
                    value={draft.visibility}
                    onChange={(e) =>
                      setDraft({ ...draft, visibility: e.target.value as MemorialVisibility })
                    }
                  >
                    {(Object.keys(VIS_META) as MemorialVisibility[]).map((v) => (
                      <option key={v} value={v}>
                        {VIS_META[v].label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Field label="Datei" hint="In dieser Demo wird nur der Dateiname hinterlegt.">
                <Input
                  value={draft.fileName}
                  placeholder="datei.pdf"
                  onChange={(e) => setDraft({ ...draft, fileName: e.target.value })}
                />
              </Field>
              <Field label="Botschaft">
                <Textarea
                  value={draft.message}
                  placeholder="Begleitende Worte zu diesem Inhalt…"
                  onChange={(e) => setDraft({ ...draft, message: e.target.value })}
                />
              </Field>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => setAdding(false)}>
                  Abbrechen
                </Button>
                <Button variant="primary" size="sm" onClick={addItem} disabled={!draft.title.trim()}>
                  Hinzufügen
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="secondary" size="sm" disabled={!enabled} onClick={() => setAdding(true)}>
              <Plus size={15} /> Inhalt hinterlegen
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
