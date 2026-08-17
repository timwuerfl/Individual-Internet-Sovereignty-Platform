import type { HTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "@/lib/format";

// Editorial table: hairline row rules, no zebra, no vertical borders.
export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full border-collapse text-sm", className)} {...props} />
    </div>
  );
}

export function Th({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "border-b border-line px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-[0.07em] text-ink-mute",
        className,
      )}
      {...props}
    />
  );
}

export function Td({ className, ...props }: HTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn("border-b border-line px-4 py-3 align-middle", className)} {...props} />
  );
}

interface RowProps extends HTMLAttributes<HTMLTableRowElement> {
  interactive?: boolean;
}

export function Tr({ className, interactive, ...props }: RowProps) {
  return (
    <tr
      className={cn(
        "transition-colors",
        interactive && "cursor-pointer hover:bg-sunken/70",
        className,
      )}
      {...props}
    />
  );
}
