// Deterministic, fully synthetic "portrait" used as example imagery in the
// deepfake comparison — no real persons, no external image fetches. The
// `manipulated` variant adds subtle artefacts to read as a tampered copy.

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

interface Props {
  seed: string;
  manipulated?: boolean;
}

export function SyntheticPortrait({ seed, manipulated }: Props) {
  const h = hashSeed(seed);
  const hue = h % 360;
  const skin = `hsl(${25 + (h % 20)} 38% ${manipulated ? 64 : 70}%)`;
  const bgA = `hsl(${hue} 24% 90%)`;
  const bgB = `hsl(${(hue + 40) % 360} 22% 80%)`;
  const hair = `hsl(${(hue + 200) % 360} 18% ${30 + (h % 15)}%)`;
  const id = `p${h % 99999}`;

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded border border-line-strong">
      <svg viewBox="0 0 120 90" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={bgA} />
            <stop offset="100%" stopColor={bgB} />
          </linearGradient>
        </defs>
        <rect width="120" height="90" fill={`url(#${id}-bg)`} />
        {/* shoulders */}
        <path d="M28 90 Q60 58 92 90 Z" fill={hair} opacity="0.85" />
        <path d="M34 90 Q60 64 86 90 Z" fill={skin} opacity="0.9" />
        {/* head */}
        <ellipse cx="60" cy="40" rx="20" ry="23" fill={skin} />
        {/* hair */}
        <path d="M40 36 Q60 8 80 36 Q74 24 60 22 Q46 24 40 36 Z" fill={hair} />
        {/* eyes */}
        <circle cx="52" cy="40" r="2.1" fill="#2b2b2b" />
        <circle cx="68" cy="40" r="2.1" fill="#2b2b2b" />
        {/* nose + mouth */}
        <path d="M60 43 L58 49 H62 Z" fill="#00000022" />
        <path d="M54 55 Q60 59 66 55" stroke="#00000055" strokeWidth="1.4" fill="none" strokeLinecap="round" />

        {manipulated && (
          <>
            {/* subtle deepfake artefacts: scanlines + seam */}
            <g opacity="0.22">
              {Array.from({ length: 12 }).map((_, i) => (
                <rect key={i} x="0" y={i * 7.5} width="120" height="1" fill="#ffffff" />
              ))}
            </g>
            <line x1="60" y1="0" x2="60" y2="90" stroke="#a23b33" strokeWidth="0.5" opacity="0.35" />
            <rect x="46" y="34" width="28" height="14" fill="none" stroke="#a23b33" strokeWidth="0.6" opacity="0.5" strokeDasharray="2 2" />
          </>
        )}
      </svg>
      {manipulated && (
        <div className="absolute bottom-1 right-1 rounded bg-danger/85 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
          Artefakte
        </div>
      )}
    </div>
  );
}
