// Eingabe der Anschlussfinanzierung – Preset = aktueller Zinssatz.

import { Repeat } from "lucide-react";
import { Card } from "./ui/Card";
import { InputField } from "./ui/InputField";
import { Toggle } from "./ui/Toggle";
import type { Anschlussfinanzierung, Kredit } from "../types";

interface Props {
  anschluss: Anschlussfinanzierung;
  kredit: Kredit;
  setAnschluss: (u: (prev: Anschlussfinanzierung) => Anschlussfinanzierung) => void;
}

export function AnschlussfinanzierungBlock({ anschluss, kredit, setAnschluss }: Props) {
  return (
    <Card
      title="Anschlussfinanzierung"
      subtitle={`Greift nach ${kredit.zinsbindungJahre} Jahren Zinsbindung`}
      icon={<Repeat size={18} />}
      actions={
        <button
          type="button"
          onClick={() =>
            setAnschluss((p) => ({ ...p, zinssatz: kredit.zinssatz }))
          }
          className="text-xs font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-soft)] transition-colors"
        >
          Aktuellen Zinssatz übernehmen
        </button>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="Zinssatz (Prognose)"
          type="number"
          min={0}
          step="0.01"
          suffix="%"
          value={anschluss.zinssatz || ""}
          onChange={(e) =>
            setAnschluss((p) => ({ ...p, zinssatz: Number(e.target.value) || 0 }))
          }
        />
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-ink-300)]">
            Tilgungsmodus
          </span>
          <Toggle
            value={anschluss.tilgung.modus}
            options={[
              { value: "tilgungsrate", label: "Tilgungsrate" },
              { value: "monatliche_rate", label: "Monatl. Rate" },
            ]}
            onChange={(modus) =>
              setAnschluss((p) => ({
                ...p,
                tilgung:
                  modus === "tilgungsrate"
                    ? { modus: "tilgungsrate", tilgungsrate: 2.0 }
                    : { modus: "monatliche_rate", monatlicheRate: 1000 },
              }))
            }
          />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {anschluss.tilgung.modus === "tilgungsrate" ? (
          <InputField
            label="Anfängliche Tilgung"
            type="number"
            min={0}
            step="0.1"
            suffix="%"
            value={
              anschluss.tilgung.modus === "tilgungsrate"
                ? anschluss.tilgung.tilgungsrate || ""
                : ""
            }
            onChange={(e) =>
              setAnschluss((p) => ({
                ...p,
                tilgung: {
                  modus: "tilgungsrate",
                  tilgungsrate: Number(e.target.value) || 0,
                },
              }))
            }
          />
        ) : (
          <InputField
            label="Monatliche Rate"
            type="number"
            min={0}
            suffix="EUR"
            value={
              anschluss.tilgung.modus === "monatliche_rate"
                ? anschluss.tilgung.monatlicheRate || ""
                : ""
            }
            onChange={(e) =>
              setAnschluss((p) => ({
                ...p,
                tilgung: {
                  modus: "monatliche_rate",
                  monatlicheRate: Number(e.target.value) || 0,
                },
              }))
            }
          />
        )}
      </div>
    </Card>
  );
}
