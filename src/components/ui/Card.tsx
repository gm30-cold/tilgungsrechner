// Wiederverwendbarer Container für Sektionen – das Grundelement der UI.
// Dunkler Hintergrund, subtile Border, dezente Hover-Akzente.
//
// Wenn `fill` gesetzt ist, füllt die Karte die volle Höhe ihres Grid-Containers
// aus und der Content-Bereich wird zur flex-column mit overflow-hidden – so
// kann die Karte ihre innere Zusammensetzung per flex-grow/overflow regeln,
// ohne ihre äußere Höhe zu verändern.

import type { ReactNode } from "react";

interface CardProps {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  fill?: boolean;
}

export function Card({
  title,
  subtitle,
  icon,
  actions,
  children,
  className = "",
  fill = false,
}: CardProps) {
  const rootClasses =
    "group relative rounded-2xl border border-[var(--color-ink-700)] " +
    "bg-[var(--color-ink-850)] " +
    "transition-colors hover:border-[var(--color-ink-600)] " +
    (fill ? "h-full flex flex-col overflow-hidden " : "") +
    className;

  const contentClasses =
    "px-5 py-4 " + (fill ? "flex-1 min-h-0 flex flex-col overflow-hidden" : "");

  return (
    <section className={rootClasses}>
      {(title || actions) && (
        <header className="flex items-start justify-between gap-3 border-b border-[var(--color-ink-800)] px-5 py-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {icon && (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-ink-800)] text-[var(--color-accent)]">
                {icon}
              </span>
            )}
            <div className="min-w-0">
              {title && (
                <h2 className="text-sm font-medium text-[var(--color-ink-50)] tracking-tight">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-[10px] text-[var(--color-ink-400)] mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={contentClasses}>{children}</div>
    </section>
  );
}
