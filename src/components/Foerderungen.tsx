// Förderungen mit Toggle Einmalig / Ratierlich (z.B. Hessengeld über 10 Jahre).

import { Plus, Trash2, Gift } from "lucide-react";
import { Card } from "./ui/Card";
import { InputField } from "./ui/InputField";
import { Toggle } from "./ui/Toggle";
import { IconButton } from "./ui/IconButton";
import type { FinanzierungController } from "../hooks/useFinanzierung";

interface Props {
  ctrl: FinanzierungController;
}

export function Foerderungen({ ctrl }: Props) {
  const { finanzierung: f } = ctrl;

  return (
    <Card
      title="Förderungen"
      subtitle="Einmalige oder ratierliche Zuschüsse"
      icon={<Gift size={18} />}
      actions={
        <IconButton
          variant="accent"
          icon={<Plus size={14} />}
          label="Hinzufügen"
          onClick={ctrl.addFoerderung}
        />
      }
    >
      {f.foerderungen.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--color-ink-700)] px-4 py-5 text-center text-xs text-[var(--color-ink-500)]">
          Noch keine Förderungen erfasst
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {f.foerderungen.map((foerd) => (
            <div
              key={foerd.id}
              className="rounded-xl border border-[var(--color-ink-800)] bg-[var(--color-ink-900)]/40 p-4"
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label="Bezeichnung"
                    type="text"
                    value={foerd.bezeichnung}
                    placeholder="z.B. Hessengeld"
                    onChange={(e) =>
                      ctrl.updateFoerderung(foerd.id, { bezeichnung: e.target.value })
                    }
                  />
                  <InputField
                    label="Gesamtbetrag"
                    type="number"
                    min={0}
                    suffix="EUR"
                    value={foerd.gesamtbetrag || ""}
                    onChange={(e) =>
                      ctrl.updateFoerderung(foerd.id, {
                        gesamtbetrag: Number(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <IconButton
                  variant="danger"
                  icon={<Trash2 size={14} />}
                  label=""
                  onClick={() => ctrl.removeFoerderung(foerd.id)}
                />
              </div>

              <div className="flex flex-col gap-3">
                <Toggle
                  value={foerd.auszahlung.modus}
                  options={[
                    { value: "einmalig", label: "Einmalzahlung" },
                    { value: "ratierlich", label: "Ratierlich" },
                  ]}
                  onChange={(modus) =>
                    ctrl.updateFoerderung(foerd.id, {
                      auszahlung:
                        modus === "einmalig"
                          ? { modus: "einmalig", datum: new Date().toISOString().slice(0, 7) }
                          : {
                              modus: "ratierlich",
                              laufzeitJahre: 10,
                              beginn: new Date().toISOString().slice(0, 7),
                            },
                    })
                  }
                />

                {foerd.auszahlung.modus === "einmalig" ? (
                  <InputField
                    label="Auszahlungsdatum"
                    type="month"
                    value={foerd.auszahlung.datum}
                    onChange={(e) =>
                      ctrl.updateFoerderung(foerd.id, {
                        auszahlung: { modus: "einmalig", datum: e.target.value },
                      })
                    }
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                      label="Laufzeit"
                      type="number"
                      min={1}
                      max={40}
                      suffix="Jahre"
                      value={foerd.auszahlung.laufzeitJahre || ""}
                      onChange={(e) =>
                        ctrl.updateFoerderung(foerd.id, {
                          auszahlung: {
                            modus: "ratierlich",
                            laufzeitJahre: Number(e.target.value) || 1,
                            beginn:
                              foerd.auszahlung.modus === "ratierlich"
                                ? foerd.auszahlung.beginn
                                : "",
                          },
                        })
                      }
                    />
                    <InputField
                      label="Beginn"
                      type="month"
                      value={foerd.auszahlung.beginn}
                      onChange={(e) =>
                        ctrl.updateFoerderung(foerd.id, {
                          auszahlung: {
                            modus: "ratierlich",
                            laufzeitJahre:
                              foerd.auszahlung.modus === "ratierlich"
                                ? foerd.auszahlung.laufzeitJahre
                                : 10,
                            beginn: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
