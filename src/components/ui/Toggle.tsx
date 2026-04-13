// Segmentierter Toggle-Switch für binäre/mehrfache Entscheidungen.
// Z.B. "Tilgungsrate" vs. "monatliche Rate".

interface ToggleOption<T extends string> {
  value: T;
  label: string;
}

interface ToggleProps<T extends string> {
  value: T;
  options: ToggleOption<T>[];
  onChange: (value: T) => void;
}

export function Toggle<T extends string>({ value, options, onChange }: ToggleProps<T>) {
  return (
    <div className="inline-flex rounded-lg border border-[var(--color-ink-700)] bg-[var(--color-ink-900)]/80 p-1">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={
              "rounded-md px-3 py-1.5 text-xs font-medium transition-all " +
              (active
                ? "bg-[var(--color-ink-700)] text-[var(--color-ink-50)] shadow-sm"
                : "text-[var(--color-ink-400)] hover:text-[var(--color-ink-200)]")
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
