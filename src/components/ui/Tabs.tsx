// Schlanke Tab-Leiste im Fintech-Stil. Der aktive Tab bekommt eine Akzent-
// Underline und einen subtilen Highlight-Background. Icons optional.

import type { ReactNode } from "react";

export interface TabDef<K extends string> {
  key: K;
  label: string;
  icon?: ReactNode;
}

interface TabsProps<K extends string> {
  tabs: TabDef<K>[];
  active: K;
  onChange: (key: K) => void;
}

export function Tabs<K extends string>({ tabs, active, onChange }: TabsProps<K>) {
  return (
    <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
      {tabs.map((t) => {
        const isActive = t.key === active;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            className={
              "relative flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium " +
              "transition-colors whitespace-nowrap " +
              (isActive
                ? "text-[var(--color-ink-50)]"
                : "text-[var(--color-ink-400)] hover:text-[var(--color-ink-200)]")
            }
          >
            {t.icon && (
              <span
                className={
                  isActive ? "text-[var(--color-accent)]" : "text-[var(--color-ink-500)]"
                }
              >
                {t.icon}
              </span>
            )}
            {t.label}
            {isActive && (
              <span className="absolute inset-x-2 -bottom-px h-px bg-[var(--color-accent)]" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
