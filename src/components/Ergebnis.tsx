// Kennzahlen-Übersicht: monatliche Rate, Zinslast, Gesamtkosten, Abzahlungsende.
// Grosses visuelles Gewicht – das ist der "Dashboard"-Bereich ganz oben.

import type { FinanzierungController } from "../hooks/useFinanzierung";
import { formatEUR, formatMonatJahr } from "../utils/format";
import { TrendingDown, Calendar, Wallet, Flame, Receipt, PiggyBank } from "lucide-react";

interface Props {
  ctrl: FinanzierungController;
}

export function Ergebnis({ ctrl }: Props) {
  const { plan, baseline, kosten, finanzierung: f } = ctrl;

  const ersteRate = plan.monate[0]?.rate ?? 0;
  const monatlicheGesamtbelastung = ersteRate + kosten.laufendeKostenMonatlich;
  const zinsErsparnis = baseline.gesamtzinsen - plan.gesamtzinsen;
  const nettoGesamtbelastung =
    kosten.gesamtkosten +
    plan.gesamtzinsen +
    kosten.ausgabenEinmalig -
    kosten.einnahmenEinmalig -
    kosten.foerderungenGesamt;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      <KPI
        icon={<Wallet size={16} />}
        label="Darlehen"
        value={formatEUR(kosten.darlehenssumme)}
        sublabel={`Kaufpreis ${formatEUR(kosten.kaufpreis)}`}
      />
      <KPI
        icon={<Receipt size={16} />}
        label="Monatliche Rate"
        value={formatEUR(ersteRate, true)}
        sublabel={`+ ${formatEUR(kosten.laufendeKostenMonatlich)} laufend`}
        highlight
      />
      <KPI
        icon={<Flame size={16} />}
        label="Gesamtzinsen"
        value={formatEUR(plan.gesamtzinsen)}
        sublabel={
          zinsErsparnis > 0
            ? `Sondertilgung spart ${formatEUR(zinsErsparnis)}`
            : undefined
        }
        variant="warn"
      />
      <KPI
        icon={<PiggyBank size={16} />}
        label="Förderungen"
        value={formatEUR(kosten.foerderungenGesamt)}
        sublabel={`${f.foerderungen.length} erfasst`}
        variant="good"
      />
      <KPI
        icon={<Calendar size={16} />}
        label="Abzahlungsende"
        value={formatMonatJahr(plan.abzahlungsEndeDatum)}
        sublabel={`Laufzeit: ${plan.monate.length} Monate`}
      />
      <KPI
        icon={<TrendingDown size={16} />}
        label="Netto-Gesamtbelastung"
        value={formatEUR(nettoGesamtbelastung)}
        sublabel={`${formatEUR(monatlicheGesamtbelastung)} mtl. gesamt`}
      />
    </div>
  );
}

interface KPIProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel?: string;
  highlight?: boolean;
  variant?: "default" | "warn" | "good";
}

function KPI({ icon, label, value, sublabel, highlight, variant = "default" }: KPIProps) {
  const valueColor =
    variant === "warn"
      ? "text-[var(--color-warn)]"
      : variant === "good"
      ? "text-[var(--color-accent)]"
      : "text-[var(--color-ink-50)]";
  const borderColor = highlight
    ? "border-[var(--color-accent)]/40"
    : "border-[var(--color-ink-700)]";

  return (
    <div
      className={
        "rounded-xl border bg-[var(--color-ink-850)] px-3.5 py-2.5 min-w-0 " +
        "transition-colors hover:border-[var(--color-ink-600)] " +
        borderColor
      }
    >
      <div className="flex items-center gap-1.5 text-[var(--color-ink-400)]">
        <span className="text-[var(--color-accent)]">{icon}</span>
        <span className="text-[9px] uppercase tracking-wider font-medium truncate">
          {label}
        </span>
      </div>
      <div className={`mt-1 text-sm font-semibold tabular-nums truncate ${valueColor}`}>
        {value}
      </div>
      {sublabel && (
        <div className="text-[10px] text-[var(--color-ink-500)] mt-0.5 truncate">
          {sublabel}
        </div>
      )}
    </div>
  );
}
