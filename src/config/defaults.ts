// Standardwerte für einen neuen, leeren Finanzierungsstand.
// Werden verwendet wenn die App das erste Mal geladen wird oder der Nutzer zurücksetzt.

import type { Finanzierung } from "../types";

export const LEERE_FINANZIERUNG: Finanzierung = {
  immobilie: {
    kaufpreis: 0,
    mobiliarkosten: 0,
    nebenkosten: {
      grunderwerbsteuer: { modus: "bundesland", bundesland: "Hessen" },
      grundbuch: 0,
      notar: 0,
      makler: null,
      sonstige: 0,
    },
    eigenkapital: 0,
  },
  kredit: {
    zinssatz: 3.5,
    zinsbindungJahre: 10,
    startdatum: new Date().toISOString().slice(0, 7),
    tilgung: { modus: "tilgungsrate", tilgungsrate: 2.0 },
  },
  anschlussfinanzierung: {
    zinssatz: 3.5,
    tilgung: { modus: "tilgungsrate", tilgungsrate: 2.0 },
  },
  sondertilgungen: {
    real: [],
    geplant: [],
    sensitivitaetSzenarien: [0, 5000, 10000],
  },
  foerderungen: [],
  einnahmen: [],
  ausgaben: [],
  laufendeKosten: [],
  mietBenchmark: {
    monatlicheKaltmiete: 0,
    monatlicheNebenkosten: 0,
    mietpreisInflationProzent: 2.0,
    renditeProzent: 6.0,
    renditeVolatilitaetProzent: 15.0,
    wertsteigerungProzent: 2.0,
    instandhaltungProzent: 1.0,
    kapitalertragsteuerProzent: 26.375,
    horizontJahre: 30,
    historischeMonatsReturns: {},
  },
};

/** Generiert eine einfache eindeutige ID für neue Listeneinträge. */
export function neueId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
