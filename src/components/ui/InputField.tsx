// Wiederverwendbares Eingabefeld für Zahlen, Text oder Prozent.
// Label oben, Input darunter, optionale Einheit rechts.

import type { InputHTMLAttributes, ReactNode } from "react";

type InputFieldProps = {
  label: string;
  hint?: string;
  suffix?: string;
  icon?: ReactNode;
  error?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "className">;

export function InputField({
  label,
  hint,
  suffix,
  icon,
  error,
  id,
  ...inputProps
}: InputFieldProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <label
        htmlFor={inputId}
        className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-ink-300)]"
      >
        {label}
      </label>
      <div
        className={
          "group flex items-center gap-1.5 rounded-lg border bg-[var(--color-ink-900)]/80 px-2.5 py-2 min-w-0 " +
          "transition-colors focus-within:border-[var(--color-accent)] " +
          (error
            ? "border-[var(--color-warn)]/60"
            : "border-[var(--color-ink-700)] hover:border-[var(--color-ink-600)]")
        }
      >
        {icon && <span className="text-[var(--color-ink-400)]">{icon}</span>}
        <input
          id={inputId}
          {...inputProps}
          className={
            "w-full min-w-0 bg-transparent text-[13px] placeholder:text-[var(--color-ink-500)] outline-none font-medium tabular-nums " +
            (error ? "text-[var(--color-warn)]" : "text-[var(--color-ink-50)]")
          }
        />
        {suffix && (
          <span className="shrink-0 text-[10px] font-medium text-[var(--color-ink-400)]">
            {suffix}
          </span>
        )}
      </div>
      {error && error.trim() ? (
        <p className="text-[10px] text-[var(--color-warn)]">{error}</p>
      ) : hint ? (
        <p className="text-[10px] text-[var(--color-ink-500)]">{hint}</p>
      ) : null}
    </div>
  );
}
