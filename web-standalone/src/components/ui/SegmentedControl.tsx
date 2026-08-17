import { cn } from "@/lib/format";

interface Segment<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  options: Segment<T>[];
  onChange: (value: T) => void;
  className?: string;
}

// Hairline-framed tab group. Selected segment gets the paper surface, no shadow.
export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={cn(
        "inline-flex rounded-md border border-line bg-sunken p-0.5",
        className,
      )}
      role="tablist"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded px-3.5 py-1.5 text-[13px] font-medium transition-colors duration-150 ease-subtle",
              active
                ? "bg-surface text-ink border border-line-strong"
                : "border border-transparent text-ink-mute hover:text-ink",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
