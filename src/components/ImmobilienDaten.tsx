// Eingabe der Immobilien-Grunddaten: Kaufpreis, Mobiliar, Nebenkosten (inkl.
// Grunderwerbsteuer mit Bundesland-Auswahl), Eigenkapital.

import { Home } from "lucide-react";
import { Card } from "./ui/Card";
import { InputField } from "./ui/InputField";
import { Select } from "./ui/Select";
import { Toggle } from "./ui/Toggle";
import type { Bundesland, Immobilie } from "../types";
import { BUNDESLAENDER, GRUNDERWERBSTEUER_SAETZE } from "../config/grunderwerbsteuer";
import {
  grunderwerbsteuerBetrag,
  grunderwerbsteuerSatz,
  nebenkostenSumme,
  gesamtkosten,
  darlehenssumme,
} from "../utils/kosten";
import { formatEUR, formatProzent } from "../utils/format";

interface Props {
  immobilie: Immobilie;
  setImmobilie: (u: (prev: Immobilie) => Immobilie) => void;
}

export function ImmobilienDaten({ immobilie, setImmobilie }: Props) {
  const gr = immobilie.nebenkosten.grunderwerbsteuer;

  return (
    <Card
      title="Immobilie"
      subtitle="Kaufpreis, Nebenkosten und Eigenkapital"
      icon={<Home size={18} />}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="Kaufpreis"
          type="number"
          min={0}
          suffix="EUR"
          value={immobilie.kaufpreis || ""}
          onChange={(e) =>
            setImmobilie((p) => ({ ...p, kaufpreis: Number(e.target.value) || 0 }))
          }
          placeholder="0"
        />
        <InputField
          label="davon Mobiliarkosten"
          type="number"
          min={0}
          suffix="EUR"
          value={immobilie.mobiliarkosten || ""}
          onChange={(e) =>
            setImmobilie((p) => ({ ...p, mobiliarkosten: Number(e.target.value) || 0 }))
          }
          placeholder="0"
          hint="Reduziert die Grunderwerbsteuer-Basis"
        />
      </div>

      <div className="mt-6 rounded-xl border border-[var(--color-ink-800)] bg-[var(--color-ink-900)]/40 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-medium text-[var(--color-ink-100)]">Nebenkosten</h3>
          <Toggle
            value={gr.modus}
            options={[
              { value: "bundesland", label: "Bundesland" },
              { value: "manuell", label: "Manuell" },
            ]}
            onChange={(modus) =>
              setImmobilie((p) => ({
                ...p,
                nebenkosten: {
                  ...p.nebenkosten,
                  grunderwerbsteuer:
                    modus === "bundesland"
                      ? { modus: "bundesland", bundesland: "Hessen" }
                      : { modus: "manuell", satz: 6.0 },
                },
              }))
            }
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {gr.modus === "bundesland" ? (
            <Select
              label="Bundesland (Grunderwerbsteuer)"
              value={gr.bundesland}
              onChange={(e) =>
                setImmobilie((p) => ({
                  ...p,
                  nebenkosten: {
                    ...p.nebenkosten,
                    grunderwerbsteuer: {
                      modus: "bundesland",
                      bundesland: e.target.value as Bundesland,
                    },
                  },
                }))
              }
              options={BUNDESLAENDER.map((b) => ({
                value: b,
                label: `${b} — ${GRUNDERWERBSTEUER_SAETZE[b].toLocaleString("de-DE")} %`,
              }))}
              hint={`Steuersatz: ${formatProzent(grunderwerbsteuerSatz(immobilie))}`}
            />
          ) : (
            <InputField
              label="Grunderwerbsteuer-Satz"
              type="number"
              min={0}
              step="0.1"
              suffix="%"
              value={gr.satz || ""}
              onChange={(e) =>
                setImmobilie((p) => ({
                  ...p,
                  nebenkosten: {
                    ...p.nebenkosten,
                    grunderwerbsteuer: {
                      modus: "manuell",
                      satz: Number(e.target.value) || 0,
                    },
                  },
                }))
              }
              hint={`Betrag: ${formatEUR(grunderwerbsteuerBetrag(immobilie))}`}
            />
          )}

          <InputField
            label="Grundbuch"
            type="number"
            min={0}
            suffix="EUR"
            value={immobilie.nebenkosten.grundbuch || ""}
            onChange={(e) =>
              setImmobilie((p) => ({
                ...p,
                nebenkosten: { ...p.nebenkosten, grundbuch: Number(e.target.value) || 0 },
              }))
            }
          />
          <InputField
            label="Notar"
            type="number"
            min={0}
            suffix="EUR"
            value={immobilie.nebenkosten.notar || ""}
            onChange={(e) =>
              setImmobilie((p) => ({
                ...p,
                nebenkosten: { ...p.nebenkosten, notar: Number(e.target.value) || 0 },
              }))
            }
          />
          <InputField
            label="Makler (optional)"
            type="number"
            min={0}
            suffix="EUR"
            value={immobilie.nebenkosten.makler ?? ""}
            onChange={(e) =>
              setImmobilie((p) => ({
                ...p,
                nebenkosten: {
                  ...p.nebenkosten,
                  makler: e.target.value === "" ? null : Number(e.target.value) || 0,
                },
              }))
            }
          />
          <InputField
            label="Sonstige Nebenkosten"
            type="number"
            min={0}
            suffix="EUR"
            value={immobilie.nebenkosten.sonstige || ""}
            onChange={(e) =>
              setImmobilie((p) => ({
                ...p,
                nebenkosten: { ...p.nebenkosten, sonstige: Number(e.target.value) || 0 },
              }))
            }
            hint="Gutachter, Umzug, etc."
          />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="Eigenkapital"
          type="number"
          min={0}
          suffix="EUR"
          value={immobilie.eigenkapital || ""}
          onChange={(e) =>
            setImmobilie((p) => ({ ...p, eigenkapital: Number(e.target.value) || 0 }))
          }
        />
        <div className="flex flex-col justify-end gap-1 text-xs text-[var(--color-ink-400)]">
          <div className="flex justify-between">
            <span>Nebenkosten gesamt</span>
            <span className="tabular-nums text-[var(--color-ink-200)]">
              {formatEUR(nebenkostenSumme(immobilie))}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Gesamtkosten</span>
            <span className="tabular-nums text-[var(--color-ink-200)]">
              {formatEUR(gesamtkosten(immobilie))}
            </span>
          </div>
          <div className="flex justify-between border-t border-[var(--color-ink-800)] pt-1 mt-1">
            <span className="text-[var(--color-ink-200)]">Darlehenssumme</span>
            <span className="tabular-nums text-[var(--color-accent)] font-semibold">
              {formatEUR(darlehenssumme(immobilie))}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
