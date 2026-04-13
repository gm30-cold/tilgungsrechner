// Kleiner ghost-style Button für Aktionen wie "hinzufügen" / "entfernen".

import type { ButtonHTMLAttributes, ReactNode } from "react";

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  icon: ReactNode;
  label: string;
  variant?: "ghost" | "danger" | "accent";
}

export function IconButton({ icon, label, variant = "ghost", ...rest }: IconButtonProps) {
  const base =
    "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors";
  const styles = {
    ghost:
      "text-[var(--color-ink-300)] hover:bg-[var(--color-ink-800)] hover:text-[var(--color-ink-50)]",
    danger:
      "text-[var(--color-ink-400)] hover:bg-[var(--color-warn)]/10 hover:text-[var(--color-warn)]",
    accent:
      "text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10",
  }[variant];
  return (
    <button type="button" {...rest} className={`${base} ${styles}`}>
      {icon}
      <span>{label}</span>
    </button>
  );
}
