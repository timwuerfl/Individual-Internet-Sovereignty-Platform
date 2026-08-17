import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/format";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const base =
  "inline-flex items-center justify-center gap-2 font-medium rounded transition-colors duration-150 ease-subtle focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap";

const variants: Record<Variant, string> = {
  // Solid pine — used once per view, for the primary action only.
  primary: "bg-accent text-paper hover:bg-accent-ink active:bg-accent-ink",
  // Hairline outline — the workhorse secondary.
  secondary:
    "bg-surface text-ink border border-line-strong hover:bg-sunken hover:border-ink-mute",
  ghost: "text-ink-soft hover:text-ink hover:bg-sunken",
  danger:
    "bg-surface text-danger border border-danger/30 hover:bg-danger/5 hover:border-danger/50",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "secondary", size = "md", className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";
