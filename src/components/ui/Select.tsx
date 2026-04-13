// Styled Select-Dropdown passend zur InputField-Ästhetik.

import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "className"> {
  label: string;
  hint?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, hint, options, id, ...rest }: SelectProps) {
  const selectId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <label
        htmlFor={selectId}
        className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-ink-300)]"
      >
        {label}
      </label>
      <div className="relative">
        <select
          id={selectId}
          {...rest}
          className="w-full appearance-none rounded-lg border border-[var(--color-ink-700)] bg-[var(--color-ink-900)]/80 px-2.5 py-2 pr-8 text-[13px] text-[var(--color-ink-50)] font-medium outline-none transition-colors hover:border-[var(--color-ink-600)] focus:border-[var(--color-accent)]"
        >
          {options.map((o) => (
            <option
              key={o.value}
              value={o.value}
              className="bg-[var(--color-ink-900)] text-[var(--color-ink-50)]"
            >
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-400)]"
        />
      </div>
      {hint && <p className="text-[10px] text-[var(--color-ink-500)]">{hint}</p>}
    </div>
  );
}
