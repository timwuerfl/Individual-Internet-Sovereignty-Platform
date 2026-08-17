// Small formatting helpers — German locale, tabular friendly.

const dtf = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const dtfTime = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function fmtDate(iso: string): string {
  return dtf.format(new Date(iso));
}

export function fmtDateTime(iso: string): string {
  return dtfTime.format(new Date(iso));
}

/** Relative time, coarse and human ("vor 3 Tagen"). */
export function fmtRelative(iso: string, now = new Date()): string {
  const diff = now.getTime() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "gerade eben";
  if (min < 60) return `vor ${min} Min`;
  const h = Math.round(min / 60);
  if (h < 24) return `vor ${h} Std`;
  const d = Math.round(h / 24);
  if (d < 30) return `vor ${d} ${d === 1 ? "Tag" : "Tagen"}`;
  const mo = Math.round(d / 30);
  if (mo < 12) return `vor ${mo} ${mo === 1 ? "Monat" : "Monaten"}`;
  const y = Math.round(mo / 12);
  return `vor ${y} ${y === 1 ? "Jahr" : "Jahren"}`;
}

export function fmtPercent(value: number): string {
  return `${Math.round(value * 100)} %`;
}

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
