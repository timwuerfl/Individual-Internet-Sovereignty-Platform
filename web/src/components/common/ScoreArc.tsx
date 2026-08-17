import { cn } from "@/lib/format";

interface ScoreArcProps {
  // 0..100, higher = more exposure / risk.
  value: number;
  size?: number;
  label?: string;
}

function toneFor(v: number): string {
  if (v >= 70) return "var(--danger)";
  if (v >= 45) return "var(--warn)";
  return "var(--ok)";
}

function bandLabel(v: number): string {
  if (v >= 70) return "Erhöht";
  if (v >= 45) return "Beobachten";
  return "Stabil";
}

// Minimal 270° gauge — single stroke, no gradients, tabular numerals.
export function ScoreArc({ value, size = 168, label = "Exposure-Score" }: ScoreArcProps) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const sweep = 270; // degrees of the open gauge
  const circ = 2 * Math.PI * r;
  const arcLen = (sweep / 360) * circ;
  const filled = (value / 100) * arcLen;
  const rotation = 135; // start bottom-left

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${label}: ${value} von 100`}>
        <g transform={`rotate(${rotation} ${cx} ${cy})`}>
          {/* track */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="var(--line)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${arcLen} ${circ}`}
          />
          {/* value */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={toneFor(value)}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${filled} ${circ}`}
            className="transition-[stroke-dasharray] duration-700 ease-subtle"
          />
        </g>
        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          className="tnum font-display"
          style={{ fontSize: 40, fill: "var(--ink)" }}
        >
          {value}
        </text>
        <text
          x={cx}
          y={cy + 22}
          textAnchor="middle"
          style={{ fontSize: 12, fill: "var(--ink-mute)", letterSpacing: "0.04em" }}
        >
          / 100
        </text>
      </svg>
      <div className={cn("mt-1 text-sm font-medium")} style={{ color: toneFor(value) }}>
        {bandLabel(value)}
      </div>
    </div>
  );
}

// Thin horizontal meter used in module cards.
export function MiniMeter({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
      <div
        className="h-full rounded-full transition-[width] duration-500 ease-subtle"
        style={{ width: `${value}%`, background: toneFor(value) }}
      />
    </div>
  );
}
