// Eingabe: reale Sondertilgungen (Fakten) + geplante Sondertilgungen (Prognose)
// + Sensitivitätsszenarien (einheitlicher Jahresbetrag je Szenario).
//
// Die Karte ist für eine 2/3-1/3-Anordnung neben der Sensitivitätsanalyse
// gedacht: die äußere Höhe ist fest an die linke Nachbar-Karte gekoppelt
// (`fill`), die Real- und Geplant-Listen scrollen intern, die Sensitivitäts-
// Szenarien bleiben immer sichtbar am unteren Rand.

import { AlertTriangle, Plus, Trash2, Zap } from "lucide-react";
import { Card } from "./ui/Card";
import { InputField } from "./ui/InputField";
import { IconButton } from "./ui/IconButton";
import type { FinanzierungController } from "../hooks/useFinanzierung";

interface Props {
  ctrl: FinanzierungController;
}

export function Sondertilgungen({ ctrl }: Props) {
  const { finanzierung: f } = ctrl;

  return (
    <Card
      title="Sondertilgungen"
      subtitle="Real, geplant und Szenarien"
      icon={<Zap size={16} />}
      fill
    >
      {/* Scroll-Bereich: Real + Geplant */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 -mr-1">
        <SektionReal ctrl={ctrl} />
        <div className="mt-6">
          <SektionGeplant ctrl={ctrl} />
        </div>
      </div>

      {/* Fester Bereich unten: Sensitivität */}
      <div className="shrink-0 mt-4 pt-4 border-t border-[var(--color-ink-800)]">
        <div className="mb-2.5">
          <h3 className="text-xs font-medium text-[var(--color-ink-100)]">
            Sensitivitätsszenarien
          </h3>
          <p className="text-[10px] text-[var(--color-ink-500)]">
            Jährlicher Pauschalbetrag – nur für leere Zukunftsjahre
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {f.sondertilgungen.sensitivitaetSzenarien.map((betrag, idx) => (
            <InputField
              key={idx}
              label={`Szenario ${String.fromCharCode(65 + idx)}`}
              type="number"
              min={0}
              suffix="€/J"
              value={betrag || ""}
              onChange={(e) => {
                const copy = [...f.sondertilgungen.sensitivitaetSzenarien];
                copy[idx] = Number(e.target.value) || 0;
                ctrl.setSensitivitaetSzenarien(copy);
              }}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}

function SektionReal({ ctrl }: { ctrl: FinanzierungController }) {
  const { finanzierung: f } = ctrl;
  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <div>
          <h3 className="text-xs font-medium text-[var(--color-ink-100)]">
            Real geleistet
          </h3>
          <p className="text-[10px] text-[var(--color-ink-500)]">
            Werden als Fakt eingesetzt
          </p>
        </div>
        <IconButton
          variant="accent"
          icon={<Plus size={12} />}
          label="Neu"
          onClick={ctrl.addSondertilgungReal}
        />
      </div>
      {f.sondertilgungen.real.length === 0 ? (
        <EmptyRow text="Noch keine realen Sondertilgungen" />
      ) : (
        <div className="flex flex-col gap-2">
          {f.sondertilgungen.real.map((s) => (
            <div
              key={s.id}
              className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end"
            >
              <InputField
                label="Datum"
                type="month"
                value={s.datum}
                onChange={(e) =>
                  ctrl.updateSondertilgungReal(s.id, { datum: e.target.value })
                }
              />
              <InputField
                label="Betrag"
                type="number"
                min={0}
                suffix="€"
                value={s.betrag || ""}
                onChange={(e) =>
                  ctrl.updateSondertilgungReal(s.id, {
                    betrag: Number(e.target.value) || 0,
                  })
                }
              />
              <IconButton
                variant="danger"
                icon={<Trash2 size={12} />}
                label=""
                onClick={() => ctrl.removeSondertilgungReal(s.id)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SektionGeplant({ ctrl }: { ctrl: FinanzierungController }) {
  const { finanzierung: f } = ctrl;
  const currentYear = new Date().getFullYear();
  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <div>
          <h3 className="text-xs font-medium text-[var(--color-ink-100)]">Geplant</h3>
          <p className="text-[10px] text-[var(--color-ink-500)]">
            Prognose pro Kalenderjahr
          </p>
        </div>
        <IconButton
          variant="accent"
          icon={<Plus size={12} />}
          label="Neu"
          onClick={ctrl.addSondertilgungGeplant}
        />
      </div>
      {f.sondertilgungen.geplant.length === 0 ? (
        <EmptyRow text="Noch keine geplanten Sondertilgungen" />
      ) : (
        <div className="flex flex-col gap-2">
          {f.sondertilgungen.geplant.map((s) => {
            const inPast = s.jahr > 0 && s.jahr < currentYear;
            const warnText = inPast ? "Planwert liegt in der Vergangenheit" : undefined;
            return (
              <div
                key={s.id}
                className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-end"
                title={warnText}
              >
                <div className="flex items-center h-[34px]">
                  {inPast ? (
                    <AlertTriangle
                      size={14}
                      className="text-[var(--color-warn)]"
                      aria-label={warnText}
                    />
                  ) : (
                    <span className="w-[14px]" aria-hidden />
                  )}
                </div>
                <InputField
                  label="Jahr"
                  type="number"
                  min={2000}
                  max={2100}
                  value={s.jahr || ""}
                  error={warnText}
                  onChange={(e) =>
                    ctrl.updateSondertilgungGeplant(s.id, {
                      jahr: Number(e.target.value) || 0,
                    })
                  }
                />
                <InputField
                  label="Betrag"
                  type="number"
                  min={0}
                  suffix="€"
                  value={s.betrag || ""}
                  error={inPast ? " " : undefined}
                  onChange={(e) =>
                    ctrl.updateSondertilgungGeplant(s.id, {
                      betrag: Number(e.target.value) || 0,
                    })
                  }
                />
                <IconButton
                  variant="danger"
                  icon={<Trash2 size={12} />}
                  label=""
                  onClick={() => ctrl.removeSondertilgungGeplant(s.id)}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[var(--color-ink-700)] px-3 py-3 text-center text-[10px] text-[var(--color-ink-500)]">
      {text}
    </div>
  );
}
