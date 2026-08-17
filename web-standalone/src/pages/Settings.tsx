import { BadgeCheck, Clock, Circle, ShieldCheck, Server, KeyRound } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardBody, Toggle, Select, Badge, Button, Field } from "@/components/ui";
import { profile } from "@/mock/profile";
import { fmtDate, cn } from "@/lib/format";
import { usePersistentState } from "@/lib/usePersistentState";

const VERIFY_META = {
  verified: { icon: BadgeCheck, cls: "text-ok", label: "Verifiziert", tone: "ok" as const },
  pending: { icon: Clock, cls: "text-warn", label: "In Prüfung", tone: "warn" as const },
  unverified: { icon: Circle, cls: "text-ink-mute", label: "Offen", tone: "neutral" as const },
};

export default function Settings() {
  const [toggles, setToggles] = usePersistentState<Record<string, boolean>>(
    "settings.toggles",
    Object.fromEntries(profile.toggles.map((t) => [t.id, t.value])),
  );
  const [scanFreq, setScanFreq] = usePersistentState(
    "settings.scanFreq",
    profile.dataSettings[0].value,
  );

  const verifiedCount = profile.verifications.filter((v) => v.status === "verified").length;

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Einstellungen"
        title="Verifizierter Identitäts-Kern"
        description="Die nachgewiesene Grundlage deiner Identität und wie deine Daten gehalten werden. Diese Verankerung macht alle anderen Module vertrauenswürdig."
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Identity core */}
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <CardHeader
              title="Verifizierung"
              caption={`${verifiedCount} von ${profile.verifications.length} Nachweisen bestätigt.`}
              action={
                <Badge tone="ok">
                  <ShieldCheck size={13} /> Kern aktiv
                </Badge>
              }
            />
            <CardBody className="!p-0">
              <ul>
                {profile.verifications.map((v, i) => {
                  const meta = VERIFY_META[v.status];
                  return (
                    <li
                      key={v.id}
                      className={cn(
                        "flex items-center gap-3.5 px-5 py-3.5",
                        i !== profile.verifications.length - 1 && "border-b border-line",
                      )}
                    >
                      <meta.icon size={19} strokeWidth={1.7} className={cn("shrink-0", meta.cls)} />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-ink">{v.label}</div>
                        <div className="truncate text-xs text-ink-mute">{v.detail}</div>
                      </div>
                      {v.status === "unverified" ? (
                        <Button size="sm" variant="secondary" disabled title="Demo">
                          Hinterlegen
                        </Button>
                      ) : (
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                      )}
                    </li>
                  );
                })}
              </ul>
            </CardBody>
          </Card>

          {/* Data settings + toggles */}
          <Card>
            <CardHeader title="Datenhaltung & Privatsphäre" />
            <CardBody className="space-y-5">
              <Field
                label={profile.dataSettings[0].label}
                hint={profile.dataSettings[0].desc}
              >
                <Select
                  value={scanFreq}
                  onChange={(e) => setScanFreq(e.target.value)}
                  className="max-w-xs"
                >
                  {profile.dataSettings[0].options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>

              <hr className="border-line" />

              <ul className="space-y-4">
                {profile.toggles.map((t) => (
                  <li key={t.id} className="flex items-start justify-between gap-6">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-ink">{t.label}</div>
                      <p className="mt-0.5 text-sm text-ink-soft">{t.desc}</p>
                    </div>
                    <Toggle
                      checked={toggles[t.id]}
                      onChange={(v) => setToggles((prev) => ({ ...prev, [t.id]: v }))}
                      label={t.label}
                    />
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </div>

        {/* Profile aside */}
        <div className="lg:col-span-1 space-y-5">
          <Card>
            <CardBody className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft font-display text-display-sm text-accent-ink">
                LK
              </div>
              <div className="mt-3 font-display text-display-sm text-ink">{profile.name}</div>
              <div className="text-sm text-ink-mute">{profile.email}</div>
              <Badge tone="ok" className="mt-3">
                <BadgeCheck size={13} /> Identität bestätigt
              </Badge>
              <div className="mt-4 text-xs text-ink-mute">
                Mitglied seit {fmtDate(profile.memberSince)}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-3.5 text-sm">
              <div className="flex items-center gap-3">
                <Server size={17} className="text-ink-mute" strokeWidth={1.6} />
                <div>
                  <div className="text-ink-soft">Datenstandort</div>
                  <div className="font-medium text-ink">{profile.dataResidency}</div>
                </div>
              </div>
              <hr className="border-line" />
              <div className="flex items-center gap-3">
                <KeyRound size={17} className="text-ink-mute" strokeWidth={1.6} />
                <div>
                  <div className="text-ink-soft">Schlüsselverwaltung</div>
                  <div className="font-medium text-ink">Nutzerkontrolliert (lokal)</div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
