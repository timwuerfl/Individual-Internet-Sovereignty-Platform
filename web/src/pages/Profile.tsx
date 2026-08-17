import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Plus,
  X,
  Trash2,
  Radar,
  ShieldAlert,
  Loader2,
  ArrowRight,
  AtSign,
  Link2,
  Mail,
  Check,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardBody, Field, Input, Button, Badge, SkeletonRows } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api";

export default function Profile() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: profile, isLoading } = useQuery({ queryKey: ["profile"], queryFn: api.profile });

  const patch = useMutation({
    mutationFn: api.updateProfile,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
    onError: (e: Error) => toast(e.message, "danger"),
  });

  const scanLeaks = useMutation({
    mutationFn: () => api.scanLeaks(),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["leaks"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast(
        `Leak-Prüfung: ${r.created} neu über ${r.scanned.length} E-Mail(s)${r.mock ? " · Demo-Daten" : ""}`,
      );
    },
    onError: (e: Error) => toast(e.message, "danger"),
  });

  const scanFakes = useMutation({
    mutationFn: (terms: string[]) => api.scanMonitoring({ terms }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["monitoring"] });
      toast(
        `Fake-Suche: ${r.created} neu · ${r.knownFiltered} eigene ausgeblendet${r.mock ? " · Demo-Daten" : ""}`,
      );
    },
    onError: (e: Error) => toast(e.message, "danger"),
  });

  if (isLoading || !profile) {
    return (
      <div className="animate-fade-in">
        <PageHeader eyebrow="Meine Identität" title="Deine Daten, deine Kontrolle" />
        <Card>
          <SkeletonRows rows={5} />
        </Card>
      </div>
    );
  }

  const searchTerms = [
    ...new Set([profile.name, ...profile.aliases, ...profile.accounts.map((a) => a.handle).filter(Boolean)]),
  ].filter(Boolean) as string[];

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Meine Identität"
        title="Deine Daten, deine Kontrolle"
        description="Pflege deine Namen, E-Mails und Konten (ohne Passwörter). Daraus prüfen wir Daten-Leaks und suchen nach Fake-Profilen — deine echten Konten werden dabei automatisch herausgerechnet."
      />

      {/* Aktionen */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-line bg-sunken text-ink-soft">
              <ShieldAlert size={20} strokeWidth={1.6} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink">Auf Daten-Leaks prüfen</p>
              <p className="text-xs text-ink-soft">Prüft alle {profile.emails.length} hinterlegten E-Mails.</p>
            </div>
            <Button variant="primary" size="sm" disabled={scanLeaks.isPending} onClick={() => scanLeaks.mutate()}>
              {scanLeaks.isPending ? <Loader2 size={14} className="animate-spin" /> : <Radar size={14} />} Prüfen
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-line bg-sunken text-ink-soft">
              <Radar size={20} strokeWidth={1.6} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink">Nach Fake-Profilen suchen</p>
              <p className="text-xs text-ink-soft">{searchTerms.length} Begriffe (Name, Aliasse, Handles).</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              disabled={scanFakes.isPending || searchTerms.length === 0}
              onClick={() => scanFakes.mutate(searchTerms)}
            >
              {scanFakes.isPending ? <Loader2 size={14} className="animate-spin" /> : <Radar size={14} />} Suchen
            </Button>
          </CardBody>
        </Card>
      </div>

      {(scanLeaks.isSuccess || scanFakes.isSuccess) && (
        <div className="mb-6 flex flex-wrap items-center gap-4 text-sm">
          <Link to="/leaks" className="inline-flex items-center gap-1 text-accent hover:underline">
            Zu den Datenlecks <ArrowRight size={14} />
          </Link>
          <Link to="/monitoring" className="inline-flex items-center gap-1 text-accent hover:underline">
            Zu den Fake-Profil-Treffern <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Identität */}
      <Card className="mb-6">
        <CardHeader title="Identität" caption="Name, alternative Schreibweisen und E-Mails." />
        <CardBody className="space-y-5">
          <NameEditor
            value={profile.name}
            onSave={(name) => patch.mutate({ name })}
            saving={patch.isPending}
          />
          <Field label="Alternative Namen / Schreibweisen">
            <ChipList
              items={profile.aliases}
              placeholder="z. B. Lena K. Kessler"
              onAdd={(v) => patch.mutate({ aliases: [...profile.aliases, v] })}
              onRemove={(v) => patch.mutate({ aliases: profile.aliases.filter((x) => x !== v) })}
            />
          </Field>
          <Field
            label="Weitere E-Mails"
            hint="Zusätzlich zu den E-Mails, die an Konten hängen."
          >
            <ChipList
              items={profile.extraEmails}
              placeholder="weitere@beispiel.de"
              onAdd={(v) => patch.mutate({ extraEmails: [...profile.extraEmails, v] })}
              onRemove={(v) => patch.mutate({ extraEmails: profile.extraEmails.filter((x) => x !== v) })}
            />
          </Field>
          <div>
            <div className="mb-1.5 text-[13px] font-medium text-ink-soft">
              Beim Leak-Scan geprüfte E-Mails ({profile.emails.length})
            </div>
            <div className="flex flex-wrap gap-1.5">
              {profile.emails.map((e) => (
                <Badge key={e} tone="neutral">
                  <Mail size={12} /> {e}
                </Badge>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Konten */}
      <Card>
        <CardHeader
          title={`Eigene Konten (${profile.accounts.length})`}
          caption={'Diese Konten werden beim Fake-Profil-Abgleich als „eigen" erkannt.'}
        />
        <CardBody className="!p-0">
          <ul>
            {profile.accounts.map((a) => (
              <li key={a.id} className="flex items-start gap-4 border-b border-line px-5 py-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line bg-sunken text-ink-soft">
                  <AtSign size={16} strokeWidth={1.6} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-ink">{a.label}</span>
                    {a.handle && <Badge>@{a.handle.replace(/^@/, "")}</Badge>}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
                    {a.url && (
                      <a
                        href={a.url.startsWith("http") ? a.url : `https://${a.url}`}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1 hover:text-accent"
                      >
                        <Link2 size={12} /> {a.url.replace(/^https?:\/\//, "")}
                      </a>
                    )}
                    {a.email && (
                      <span className="inline-flex items-center gap-1">
                        <Mail size={12} /> {a.email}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => api.deleteOwnedAccount(a.id).then(() => qc.invalidateQueries({ queryKey: ["profile"] }))}
                  className="shrink-0 text-ink-mute transition-colors hover:text-danger"
                  aria-label="Konto entfernen"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
            {profile.accounts.length === 0 && (
              <li className="px-5 py-4 text-sm text-ink-mute">Noch keine Konten hinterlegt.</li>
            )}
          </ul>
          <AddAccountForm
            onAdd={(body) =>
              api.createOwnedAccount(body).then(() => qc.invalidateQueries({ queryKey: ["profile"] }))
            }
          />
        </CardBody>
      </Card>
    </div>
  );
}

function NameEditor({ value, onSave, saving }: { value: string; onSave: (v: string) => void; saving: boolean }) {
  const [name, setName] = useState(value);
  const dirty = name.trim() !== value && name.trim().length > 0;
  return (
    <Field label="Name">
      <div className="flex gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} />
        <Button variant="secondary" size="md" disabled={!dirty || saving} onClick={() => onSave(name.trim())}>
          <Check size={14} /> Speichern
        </Button>
      </div>
    </Field>
  );
}

function ChipList({
  items,
  placeholder,
  onAdd,
  onRemove,
}: {
  items: string[];
  placeholder: string;
  onAdd: (v: string) => void;
  onRemove: (v: string) => void;
}) {
  const [val, setVal] = useState("");
  const add = () => {
    const v = val.trim();
    if (!v || items.includes(v)) return;
    onAdd(v);
    setVal("");
  };
  return (
    <div>
      {items.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {items.map((x) => (
            <span
              key={x}
              className="inline-flex items-center gap-1.5 rounded border border-line-strong bg-sunken px-2 py-0.5 text-xs text-ink-soft"
            >
              {x}
              <button onClick={() => onRemove(x)} className="text-ink-mute hover:text-danger" aria-label="Entfernen">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={val}
          placeholder={placeholder}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button variant="secondary" size="md" onClick={add} disabled={!val.trim()}>
          <Plus size={14} /> Hinzufügen
        </Button>
      </div>
    </div>
  );
}

function AddAccountForm({
  onAdd,
}: {
  onAdd: (body: { label: string; handle?: string; url?: string; email?: string }) => Promise<unknown>;
}) {
  const [label, setLabel] = useState("");
  const [handle, setHandle] = useState("");
  const [url, setUrl] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = () => {
    if (!label.trim() || busy) return;
    setBusy(true);
    onAdd({
      label: label.trim(),
      handle: handle.trim() || undefined,
      url: url.trim() || undefined,
      email: email.trim() || undefined,
    }).finally(() => {
      setBusy(false);
      setLabel("");
      setHandle("");
      setUrl("");
      setEmail("");
    });
  };

  return (
    <div className="border-t border-line bg-sunken/30 p-5">
      <div className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-ink-mute">Konto hinzufügen</div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Dienst *">
          <Input placeholder="Instagram" value={label} onChange={(e) => setLabel(e.target.value)} />
        </Field>
        <Field label="Handle">
          <Input placeholder="lena.kessler" value={handle} onChange={(e) => setHandle(e.target.value)} />
        </Field>
        <Field label="Profil-URL">
          <Input placeholder="instagram.com/…" value={url} onChange={(e) => setUrl(e.target.value)} />
        </Field>
        <Field label="E-Mail">
          <Input placeholder="optional@beispiel.de" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
      </div>
      <Button variant="primary" size="sm" className="mt-3" disabled={!label.trim() || busy} onClick={submit}>
        {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Konto hinzufügen
      </Button>
    </div>
  );
}
