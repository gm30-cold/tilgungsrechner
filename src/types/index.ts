// Zentrales Datenmodell für den Tilgungsrechner.
// Alle Eingabebereiche, Export/Import und Berechnungen nutzen diese Typen.

export type Bundesland =
  | "Baden-Württemberg"
  | "Bayern"
  | "Berlin"
  | "Brandenburg"
  | "Bremen"
  | "Hamburg"
  | "Hessen"
  | "Mecklenburg-Vorpommern"
  | "Niedersachsen"
  | "Nordrhein-Westfalen"
  | "Rheinland-Pfalz"
  | "Saarland"
  | "Sachsen"
  | "Sachsen-Anhalt"
  | "Schleswig-Holstein"
  | "Thüringen";

/** Grunderwerbsteuer: entweder aus Bundesland-Tabelle oder manuell gesetzt. */
export type Grunderwerbsteuer =
  | { modus: "bundesland"; bundesland: Bundesland }
  | { modus: "manuell"; satz: number };

export interface Nebenkosten {
  grunderwerbsteuer: Grunderwerbsteuer;
  grundbuch: number;
  notar: number;
  makler: number | null; // optional
  sonstige: number;
}

export interface Immobilie {
  kaufpreis: number;
  mobiliarkosten: number; // wird von Grunderwerbsteuer-Basis abgezogen
  nebenkosten: Nebenkosten;
  eigenkapital: number;
}

/** Tilgung kann über die jährliche Tilgungsrate ODER die monatliche Rate definiert werden. */
export type TilgungsModus =
  | { modus: "tilgungsrate"; tilgungsrate: number } // Prozent p.a.
  | { modus: "monatliche_rate"; monatlicheRate: number }; // EUR

export interface Kredit {
  zinssatz: number; // Prozent p.a.
  zinsbindungJahre: number;
  startdatum: string; // ISO "YYYY-MM" – wichtig für bereits laufende Kredite
  tilgung: TilgungsModus;
}

export interface Anschlussfinanzierung {
  zinssatz: number; // Prozent p.a.
  tilgung: TilgungsModus;
}

export interface SondertilgungReal {
  id: string;
  datum: string; // ISO "YYYY-MM"
  betrag: number;
}

export interface SondertilgungGeplant {
  id: string;
  jahr: number;
  betrag: number;
}

export interface Sondertilgungen {
  real: SondertilgungReal[];
  geplant: SondertilgungGeplant[];
  /** Jährliche Werte für Sensitivitätsanalyse, z.B. [0, 5000, 10000] */
  sensitivitaetSzenarien: number[];
}

export type FoerderModus =
  | { modus: "einmalig"; datum: string }
  | { modus: "ratierlich"; laufzeitJahre: number; beginn: string };

export interface Foerderung {
  id: string;
  bezeichnung: string;
  gesamtbetrag: number;
  auszahlung: FoerderModus;
}

export interface EinmaligerPosten {
  id: string;
  bezeichnung: string;
  betrag: number;
  datum: string | null;
}

export type Intervall = "monatlich" | "jaehrlich";

export interface LaufenderKostenposten {
  id: string;
  bezeichnung: string;
  betrag: number;
  intervall: Intervall;
  kategorie: string;
}

/**
 * Eingaben für den Miet-Benchmark: simuliert das Alternative-Szenario "ich
 * miete stattdessen und lege den Cash-Vorteil am Kapitalmarkt an".
 * Der Vergleich ist ein Netto-Vermögens-Vergleich am Ende der Laufzeit:
 *   - Kauf: Hauswert (inkl. Wertsteigerung) minus Restschuld
 *   - Miete: Investment-Pot (Seed aus EK + Nebenkosten + einm. Ausgaben
 *            minus Einnahmen, plus monatlicher Cash-Delta) abzüglich KapSt
 *            auf den Kursgewinn.
 */
export interface MietBenchmark {
  monatlicheKaltmiete: number;
  monatlicheNebenkosten: number;
  mietpreisInflationProzent: number; // jährlich
  renditeProzent: number; // jährlich auf den Investment-Pot (brutto)
  renditeVolatilitaetProzent: number; // annualisierte Standardabweichung σ der Rendite
  wertsteigerungProzent: number; // jährlich auf den Immobilienwert
  instandhaltungProzent: number; // % vom Kaufpreis p.a. als Rücklage/Reparaturen
  kapitalertragsteuerProzent: number; // effektiv 25% + 5,5% Soli = 26,375%
  /** User-importierte Monatsrenditen aus Börse.de-Paste. Übersteuern die
   *  hardcoded Config in msciWorld.ts. Schlüssel "YYYY-MM", Wert als Dezimalzahl. */
  historischeMonatsReturns: Record<string, number>;
}

/** Gesamter Finanzierungsstand, wird als JSON exportiert/importiert. */
export interface Finanzierung {
  immobilie: Immobilie;
  kredit: Kredit;
  anschlussfinanzierung: Anschlussfinanzierung;
  sondertilgungen: Sondertilgungen;
  foerderungen: Foerderung[];
  einnahmen: EinmaligerPosten[];
  ausgaben: EinmaligerPosten[];
  laufendeKosten: LaufenderKostenposten[];
  mietBenchmark: MietBenchmark;
}

// =============================================================================
// Berechnungs-Ergebnistypen
// =============================================================================

/** Ein einzelner Monat im Tilgungsplan. */
export interface TilgungsMonat {
  monatIndex: number; // 0 = erster Monat
  datum: string; // "YYYY-MM"
  jahr: number;
  zinsanteil: number;
  tilgungsanteil: number;
  rate: number;
  sondertilgung: number;
  restschuld: number;
  phase: "zinsbindung" | "anschluss";
}

export interface TilgungsPlan {
  monate: TilgungsMonat[];
  gesamtzinsen: number;
  abzahlungsEndeDatum: string | null; // null wenn nicht erreicht innerhalb Simulationszeitraum
  restschuldAmZinsbindungsEnde: number;
}

export interface KostenUebersicht {
  kaufpreis: number;
  mobiliarkosten: number;
  grunderwerbsteuerSatz: number; // Prozent
  grunderwerbsteuerBetrag: number;
  grundbuch: number;
  notar: number;
  makler: number;
  sonstigeNebenkosten: number;
  nebenkostenSumme: number;
  gesamtkosten: number;
  darlehenssumme: number;
  einnahmenEinmalig: number;
  ausgabenEinmalig: number;
  foerderungenGesamt: number;
  laufendeKostenMonatlich: number;
  laufendeKostenJaehrlich: number;
}

// =============================================================================
// Miet-Benchmark Ergebnistypen
// =============================================================================

export interface MietBenchmarkMonat {
  monatIndex: number;
  datum: string;
  jahr: number;
  /** Nettovermögen im Kauf-Fall: Hauswert − Restschuld. */
  wealthKauf: number;
  /** Nettovermögen im Miet-Fall NACH Kapitalertragsteuer. */
  wealthMieteNetto: number;
  /** Brutto-Topfstand vor KapSt (für Tooltip / Debug). */
  wealthMieteBrutto: number;
  /** Oberes 1σ-Band (log-normal) NETTO. */
  wealthMieteNettoUpper: number;
  /** Unteres 1σ-Band (log-normal) NETTO. */
  wealthMieteNettoLower: number;
  /** Delta = wealthKauf − wealthMieteNetto. Positiv = Kauf besser. */
  delta: number;
}

export interface MietBenchmarkSzenario {
  /** Entspricht dem Sensitivitäts-Szenario (0, 5.000, 10.000 … €/Jahr). */
  jaehrlicheSondertilgung: number;
  monate: MietBenchmarkMonat[];
  endWealthKauf: number;
  endWealthMieteBrutto: number;
  endWealthMieteNetto: number;
  /** Kumulierter Kursgewinn des Pots am Ende. */
  kursgewinn: number;
  /** Fälliger KapSt-Betrag auf den Kursgewinn. */
  kapStBetrag: number;
  /** Monats-Index, in dem Kauf erstmals > Miete wird. null wenn nie. */
  breakEvenMonat: number | null;
}

export interface MietBenchmarkErgebnis {
  szenarien: MietBenchmarkSzenario[];
  /** Seed des Miet-Pots bei t=0 (fürs UI). */
  seedBetrag: number;
}
