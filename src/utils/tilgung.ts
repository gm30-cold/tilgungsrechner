// Kern der Berechnungslogik: Annuitätendarlehen mit Zinsbindung,
// Anschlussfinanzierung und flexiblen Sondertilgungen.

import type {
  Anschlussfinanzierung,
  Finanzierung,
  Kredit,
  TilgungsMonat,
  TilgungsPlan,
  TilgungsModus,
} from "../types";
import { darlehenssumme } from "./kosten";
import { addMonths, jahrAus } from "./format";

/** Maximale Simulationsdauer (Sicherheitsnetz gegen Endlosschleifen). */
const MAX_MONATE = 600; // 50 Jahre

/** Berechnet die monatliche Rate aus dem gewählten Tilgungsmodus. */
export function monatlicheRate(
  restschuld: number,
  zinssatz: number,
  tilgung: TilgungsModus,
): number {
  if (tilgung.modus === "monatliche_rate") return tilgung.monatlicheRate;
  // Annuitätenformel: (Zinssatz + Tilgungssatz) / 12 × Darlehen
  return (restschuld * (zinssatz + tilgung.tilgungsrate)) / 100 / 12;
}

/**
 * Aus monatlicher Rate → anfänglicher Tilgungssatz p.a. in Prozent.
 * Nützlich für die Anzeige, wenn der Nutzer im Rate-Modus arbeitet.
 */
export function impliziteTilgungsrate(
  darlehen: number,
  zinssatz: number,
  rate: number,
): number {
  if (darlehen <= 0) return 0;
  return Math.max(0, (rate * 12) / darlehen * 100 - zinssatz);
}

interface SimParams {
  darlehen: number;
  kredit: Kredit;
  anschluss: Anschlussfinanzierung;
  /** Kombinierte Sondertilgungsmap: "YYYY-MM" → EUR (real + geplant + sensitivity). */
  sondertilgungen: Map<string, number>;
}

/**
 * Führt eine monatliche Simulation über maximal 50 Jahre durch.
 * Berücksichtigt den Übergang Zinsbindung → Anschlussfinanzierung.
 */
export function simuliere(params: SimParams): TilgungsPlan {
  const { darlehen, kredit, anschluss, sondertilgungen } = params;
  const monate: TilgungsMonat[] = [];

  let restschuld = darlehen;
  let gesamtzinsen = 0;
  let abzahlungsEnde: string | null = null;
  let restschuldAmZinsbindungsEnde = darlehen;

  const zinsbindungMonate = Math.round(kredit.zinsbindungJahre * 12);

  // Die initiale Rate wird zu Beginn einmal berechnet und bleibt während der
  // Zinsbindung gleich. Zum Anschluss wird sie neu kalkuliert anhand der
  // Restschuld zu dem Zeitpunkt.
  let aktRate = monatlicheRate(restschuld, kredit.zinssatz, kredit.tilgung);
  let aktZinssatz = kredit.zinssatz;
  let phase: "zinsbindung" | "anschluss" = "zinsbindung";

  for (let i = 0; i < MAX_MONATE; i++) {
    if (restschuld <= 0.005) {
      // Vollständig getilgt im Vormonat.
      break;
    }

    // Phasenwechsel zum Anschluss prüfen.
    if (i === zinsbindungMonate) {
      restschuldAmZinsbindungsEnde = restschuld;
      phase = "anschluss";
      aktZinssatz = anschluss.zinssatz;
      aktRate = monatlicheRate(restschuld, anschluss.zinssatz, anschluss.tilgung);
    }

    const datum = addMonths(kredit.startdatum, i);
    const zinsanteil = (restschuld * aktZinssatz) / 100 / 12;
    let tilgungsanteil = aktRate - zinsanteil;
    if (tilgungsanteil < 0) tilgungsanteil = 0;

    // Rate darf Restschuld nicht übersteigen (letzter Monat korrigiert sich).
    let effTilgung = tilgungsanteil;
    if (effTilgung > restschuld) {
      effTilgung = restschuld;
    }
    const effRate = zinsanteil + effTilgung;

    // Sondertilgung in diesem Monat?
    const sondertilgung = Math.min(
      sondertilgungen.get(datum) ?? 0,
      Math.max(0, restschuld - effTilgung),
    );

    const neueRestschuld = Math.max(0, restschuld - effTilgung - sondertilgung);

    monate.push({
      monatIndex: i,
      datum,
      jahr: jahrAus(datum),
      zinsanteil,
      tilgungsanteil: effTilgung,
      rate: effRate,
      sondertilgung,
      restschuld: neueRestschuld,
      phase,
    });

    gesamtzinsen += zinsanteil;
    restschuld = neueRestschuld;

    if (restschuld <= 0.005) {
      abzahlungsEnde = datum;
      break;
    }
  }

  return {
    monate,
    gesamtzinsen,
    abzahlungsEndeDatum: abzahlungsEnde,
    restschuldAmZinsbindungsEnde,
  };
}

/**
 * Baut die Sondertilgungs-Map für einen Lauf zusammen.
 * - realMitgezählt: bereits geleistete Sondertilgungen werden immer aktiv.
 * - geplantMitgezählt: optional (wird bei Baseline weggelassen).
 * - sensitivitätJaehrlich: optional zusätzlicher fester Betrag pro Jahr.
 */
function baueSondertilgungsMap(
  finanzierung: Finanzierung,
  opts: {
    realMitgezaehlt: boolean;
    geplantMitgezaehlt: boolean;
    sensitivitaetJaehrlich?: number;
  },
): Map<string, number> {
  const map = new Map<string, number>();
  const add = (datum: string, betrag: number) => {
    map.set(datum, (map.get(datum) ?? 0) + betrag);
  };

  if (opts.realMitgezaehlt) {
    for (const s of finanzierung.sondertilgungen.real) {
      if (s.betrag > 0) add(s.datum, s.betrag);
    }
  }

  if (opts.geplantMitgezaehlt) {
    for (const s of finanzierung.sondertilgungen.geplant) {
      if (s.betrag > 0) add(`${s.jahr}-12`, s.betrag);
    }
  }

  if (opts.sensitivitaetJaehrlich && opts.sensitivitaetJaehrlich > 0) {
    // Jährliche Sensitivitäts-Zahlung im Dezember jedes Jahres – aber NUR:
    // 1. in der Zukunft (Jahre ab heute oder später),
    // 2. in Jahren, in denen weder eine reale noch eine geplante
    //    Sondertilgung hinterlegt ist (sonst würde doppelt gezählt).
    const jetzt = new Date();
    const heuteJahr = jetzt.getFullYear();

    const belegteJahre = new Set<number>();
    for (const s of finanzierung.sondertilgungen.real) {
      if (s.betrag > 0) belegteJahre.add(jahrAus(s.datum));
    }
    for (const s of finanzierung.sondertilgungen.geplant) {
      if (s.betrag > 0) belegteJahre.add(s.jahr);
    }

    const startJahr = jahrAus(finanzierung.kredit.startdatum);
    for (let j = 0; j < 50; j++) {
      const jahr = startJahr + j;
      if (jahr < heuteJahr) continue; // Vergangenheit überspringen
      if (belegteJahre.has(jahr)) continue; // bereits echte/geplante Sondertilgung
      add(`${jahr}-12`, opts.sensitivitaetJaehrlich);
    }
  }

  return map;
}

/** Berechnet den Hauptplan inkl. realer + geplanter Sondertilgungen. */
export function berechnePlan(finanzierung: Finanzierung): TilgungsPlan {
  return simuliere({
    darlehen: darlehenssumme(finanzierung.immobilie),
    kredit: finanzierung.kredit,
    anschluss: finanzierung.anschlussfinanzierung,
    sondertilgungen: baueSondertilgungsMap(finanzierung, {
      realMitgezaehlt: true,
      geplantMitgezaehlt: true,
    }),
  });
}

/** Baseline: nur reale Sondertilgungen, keine geplanten – zum Vergleich in der Grafik. */
export function berechneBaseline(finanzierung: Finanzierung): TilgungsPlan {
  return simuliere({
    darlehen: darlehenssumme(finanzierung.immobilie),
    kredit: finanzierung.kredit,
    anschluss: finanzierung.anschlussfinanzierung,
    sondertilgungen: baueSondertilgungsMap(finanzierung, {
      realMitgezaehlt: true,
      geplantMitgezaehlt: false,
    }),
  });
}

/** Sensitivitätsanalyse: gibt je Szenario einen Plan zurück. */
export interface SensitivitaetsErgebnis {
  jaehrlicheSondertilgung: number;
  plan: TilgungsPlan;
}

export function berechneSensitivitaet(
  finanzierung: Finanzierung,
): SensitivitaetsErgebnis[] {
  // Die Sensitivität sitzt ON TOP des bestehenden Plans: reale UND geplante
  // Sondertilgungen bleiben erhalten, der Szenario-Betrag wird lediglich in
  // leeren Zukunftsjahren zusätzlich addiert (die Filter-Logik dafür liegt
  // in `baueSondertilgungsMap`). Dadurch entspricht Szenario A (0 €/Jahr)
  // exakt dem Haupt-Plan.
  return finanzierung.sondertilgungen.sensitivitaetSzenarien.map((betrag) => ({
    jaehrlicheSondertilgung: betrag,
    plan: simuliere({
      darlehen: darlehenssumme(finanzierung.immobilie),
      kredit: finanzierung.kredit,
      anschluss: finanzierung.anschlussfinanzierung,
      sondertilgungen: baueSondertilgungsMap(finanzierung, {
        realMitgezaehlt: true,
        geplantMitgezaehlt: true,
        sensitivitaetJaehrlich: betrag,
      }),
    }),
  }));
}
