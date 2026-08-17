import {
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/lib/format";

const fieldBase =
  "w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-mute transition-colors focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:bg-sunken disabled:text-ink-mute";

export function Label({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1.5 block text-[13px] font-medium text-ink-soft">{children}</label>
  );
}

interface FieldProps {
  label?: string;
  hint?: string;
  children: ReactNode;
}

export function Field({ label, hint, children }: FieldProps) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      {children}
      {hint && <p className="mt-1 text-xs text-ink-mute">{hint}</p>}
    </div>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldBase, className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldBase, "min-h-[80px] resize-y", className)} {...props} />;
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(fieldBase, "appearance-none pr-8", className)} {...props}>
      {children}
    </select>
  );
}
