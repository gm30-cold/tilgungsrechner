// Eingabe: Zinssatz, Zinsbindung, Startdatum, Toggle Tilgungsrate/Rate.

import { Percent } from "lucide-react";
import { Card } from "./ui/Card";
import { InputField } from "./ui/InputField";
import { Toggle } from "./ui/Toggle";
import type { Kredit } from "../types";
import { impliziteTilgungsrate, monatlicheRate } from "../utils/tilgung";
import { formatEUR, formatProzent } from "../utils/format";

interface Props {
  kredit: Kredit;
  darlehen: number;
  setKredit: (u: (prev: Kredit) => Kredit) => void;
}

export function KreditKonditionen({ kredit, darlehen, setKredit }: Props) {
  const aktuellerModus = kredit.tilgung.modus;
  const rate = monatlicheRate(darlehen, kredit.zinssatz, kredit.tilgung);
  const impl =
    aktuellerModus === "monatliche_rate"
      ? impliziteTilgungsrate(darlehen, kredit.zinssatz, kredit.tilgung.monatlicheRate)
      : null;

  return (
    <Card
      title="Kreditkonditionen"
      subtitle="Zinssatz, Bindung und Tilgung"
      icon={<Percent size={18} />}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InputField
          label="Sollzins p.a."
          type="number"
          min={0}
          step="0.01"
          suffix="%"
          value={kredit.zinssatz || ""}
          onChange={(e) =>
            setKredit((p) => ({ ...p, zinssatz: Number(e.target.value) || 0 }))
          }
        />
        <InputField
          label="Zinsbindung"
          type="number"
          min={1}
          max={40}
          suffix="Jahre"
          value={kredit.zinsbindungJahre || ""}
          onChange={(e) =>
            setKredit((p) => ({ ...p, zinsbindungJahre: Number(e.target.value) || 0 }))
          }
        />
        <InputField
          label="Kreditbeginn"
          type="month"
          value={kredit.startdatum}
          onChange={(e) => setKredit((p) => ({ ...p, startdatum: e.target.value }))}
          hint="Monat des Auszahlungsstarts"
        />
      </div>

      <div className="mt-6 rounded-xl border border-[var(--color-ink-800)] bg-[var(--color-ink-900)]/40 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-medium text-[var(--color-ink-100)]">
            Tilgungsmodus
          </h3>
          <Toggle
            value={aktuellerModus}
            options={[
              { value: "tilgungsrate", label: "Tilgungsrate" },
              { value: "monatliche_rate", label: "Monatliche Rate" },
            ]}
            onChange={(modus) =>
              setKredit((p) => ({
                ...p,
                tilgung:
                  modus === "tilgungsrate"
                    ? { modus: "tilgungsrate", tilgungsrate: 2.0 }
                    : { modus: "monatliche_rate", monatlicheRate: rate || 1000 },
              }))
            }
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {aktuellerModus === "tilgungsrate" ? (
            <>
              <InputField
                label="Anfängliche Tilgung"
                type="number"
                min={0}
                step="0.1"
                suffix="%"
                value={
                  kredit.tilgung.modus === "tilgungsrate"
                    ? kredit.tilgung.tilgungsrate || ""
                    : ""
                }
                onChange={(e) =>
                  setKredit((p) => ({
                    ...p,
                    tilgung: {
                      modus: "tilgungsrate",
                      tilgungsrate: Number(e.target.value) || 0,
                    },
                  }))
                }
              />
              <div className="flex flex-col justify-end text-xs text-[var(--color-ink-400)]">
                <div className="flex justify-between">
                  <span>Monatliche Rate</span>
                  <span className="tabular-nums text-[var(--color-ink-100)] font-semibold">
                    {formatEUR(rate, true)}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <>
              <InputField
                label="Monatliche Rate"
                type="number"
                min={0}
                suffix="EUR"
                value={
                  kredit.tilgung.modus === "monatliche_rate"
                    ? kredit.tilgung.monatlicheRate || ""
                    : ""
                }
                onChange={(e) =>
                  setKredit((p) => ({
                    ...p,
                    tilgung: {
                      modus: "monatliche_rate",
                      monatlicheRate: Number(e.target.value) || 0,
                    },
                  }))
                }
              />
              <div className="flex flex-col justify-end text-xs text-[var(--color-ink-400)]">
                <div className="flex justify-between">
                  <span>Implizite Tilgung</span>
                  <span className="tabular-nums text-[var(--color-ink-100)] font-semibold">
                    {impl !== null ? formatProzent(impl) : "–"}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
