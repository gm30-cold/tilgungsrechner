// Laufende monatliche/jährliche Kosten der Immobilie (Strom, Heizung,
// Versicherungen, Grundsteuer etc.).

import { Plus, Trash2, Activity } from "lucide-react";
import { Card } from "./ui/Card";
import { InputField } from "./ui/InputField";
import { Toggle } from "./ui/Toggle";
import { IconButton } from "./ui/IconButton";
import type { FinanzierungController } from "../hooks/useFinanzierung";
import { formatEUR } from "../utils/format";

interface Props {
  ctrl: FinanzierungController;
}

export function LaufendeKosten({ ctrl }: Props) {
  const { finanzierung: f, kosten } = ctrl;

  return (
    <Card
      title="Laufende Kosten"
      subtitle="Wiederkehrende Nebenkosten"
      icon={<Activity size={18} />}
      actions={
        <IconButton
          variant="accent"
          icon={<Plus size={14} />}
          label="Hinzufügen"
          onClick={ctrl.addLaufendeKosten}
        />
      }
    >
      {f.laufendeKosten.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--color-ink-700)] px-4 py-5 text-center text-xs text-[var(--color-ink-500)]">
          Noch keine laufenden Kosten erfasst
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {f.laufendeKosten.map((lk) => (
            <div
              key={lk.id}
              className="grid grid-cols-1 lg:grid-cols-[2fr_1fr_auto_1fr_auto] gap-3 items-end"
            >
              <InputField
                label="Bezeichnung"
                type="text"
                value={lk.bezeichnung}
                placeholder="z.B. Strom"
                onChange={(e) =>
                  ctrl.updateLaufendeKosten(lk.id, { bezeichnung: e.target.value })
                }
              />
              <InputField
                label="Betrag"
                type="number"
                min={0}
                suffix="EUR"
                value={lk.betrag || ""}
                onChange={(e) =>
                  ctrl.updateLaufendeKosten(lk.id, {
                    betrag: Number(e.target.value) || 0,
                  })
                }
              />
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-ink-300)]">
                  Intervall
                </span>
                <Toggle
                  value={lk.intervall}
                  options={[
                    { value: "monatlich", label: "Monatl." },
                    { value: "jaehrlich", label: "Jährl." },
                  ]}
                  onChange={(intervall) =>
                    ctrl.updateLaufendeKosten(lk.id, { intervall })
                  }
                />
              </div>
              <InputField
                label="Kategorie"
                type="text"
                value={lk.kategorie}
                placeholder="Energie, Versicherung..."
                onChange={(e) =>
                  ctrl.updateLaufendeKosten(lk.id, { kategorie: e.target.value })
                }
              />
              <IconButton
                variant="danger"
                icon={<Trash2 size={14} />}
                label=""
                onClick={() => ctrl.removeLaufendeKosten(lk.id)}
              />
            </div>
          ))}
        </div>
      )}
      <div className="mt-6 flex flex-col gap-1 text-xs text-[var(--color-ink-400)] border-t border-[var(--color-ink-800)] pt-4">
        <div className="flex justify-between">
          <span>Monatlich</span>
          <span className="tabular-nums text-[var(--color-ink-100)] font-semibold">
            {formatEUR(kosten.laufendeKostenMonatlich)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Jährlich</span>
          <span className="tabular-nums text-[var(--color-ink-100)] font-semibold">
            {formatEUR(kosten.laufendeKostenJaehrlich)}
          </span>
        </div>
      </div>
    </Card>
  );
}
