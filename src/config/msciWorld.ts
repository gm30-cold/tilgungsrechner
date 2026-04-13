// Historische Performance des MSCI World für den Miet-Benchmark.
//
// =============================================================================
// QUELLE 2025 + 2026 (Monats-Schlusskurse)
// =============================================================================
// iShares MSCI World EUR Hedged UCITS ETF (Acc), ISIN IE00B441G979
// Börse.de historische Kurse:
//   https://www.boerse.de/historische-kurse/iShares-MSCI-World-EUR-Hedged-UCITS-ETF-Acc/IE00B441G979
// Die Monatsrenditen unten sind die "Veränderung"-Spalte der Börse.de-
// Tabelle bzw. aus den Monats-Schlusskursen selbst abgeleitet.
//
// ACHTUNG: Das ist der CURRENCY-HEDGED Fund (EUR-abgesichert). Er
// eliminiert das EUR/USD-Wechselkurs-Risiko, kostet dafür minimal
// Hedging-Gebühren. Ein unhedged MSCI World in EUR (z.B. IWDA) liefert
// durch Wechselkursbewegungen andere Zahlen. Für einen deutschen
// Anleger, der kein USD-Exposure will, ist der hedged Fund die
// sinnvollere Vergleichsgröße – wir bleiben bei dieser Wahl.
//
// AKTUALISIERUNG: Am Jahres-Ende die neuen Monate einfach ergänzen. Ab
// dem ersten Monat ohne Eintrag fällt die Simulation auf die
// Annahme-Rendite zurück (siehe utils/mietBenchmark.ts).
//
// =============================================================================
// QUELLE 2020 – 2024 (Jahres-Returns, Fallback)
// =============================================================================
// MSCI World Index (EUR) Factsheet, Stand Mar 31, 2026:
//   https://www.msci.com/documents/10199/890dd84d-3750-4656-87f2-1229ed5a5d6e
// Diese Werte sind die unhedged MSCI-World-Jahresrenditen in EUR. Sie
// dienen als Fallback, falls der Kreditstart weiter zurückliegt als
// 2025 – ein gemischter Ansatz, aber innerhalb eines einzelnen Jahres
// geometrisch gemittelt (siehe Helper unten).
//
// Innerhalb eines Jahres ohne Monats-Override wird die Jahresrendite
// geometrisch auf 12 Monate verteilt: monat = (1 + jahr)^(1/12) − 1.
// Am Jahres-Ende liefert jede DCA-Tranche exakt × (1 + jahresRate).

export type JahresReturn =
  | number
  | {
      annual: number;
      monthly?: Record<string, number>;
    };

export const MSCI_WORLD_JAHRES_RETURNS: Record<number, JahresReturn> = {
  // ===== 2020 – 2024: Jahres-Fallback aus MSCI-Factsheet (unhedged EUR) =====
  2020: 0.0633, //  +6,33 %
  2021: 0.3107, // +31,07 %
  2022: -0.1278, // −12,78 %
  2023: 0.1960, // +19,60 %
  2024: 0.2660, // +26,60 %

  // ===== 2025: echte Monats-Returns IE00B441G979 (EUR Hedged) =====
  // Monats-Schlusskurse laut börse.de:
  //   Jan 95,20 · Feb 94,17 · Mär 89,46 · Apr 88,98 · Mai 94,14 ·
  //   Jun 97,43 · Jul 99,26 · Aug 101,10 · Sep 104,18 · Okt 106,70 ·
  //   Nov 106,81 · Dez 107,20
  // Jan 2025 hat keinen Referenz-Vorkurs (Dez 2024 Close liegt uns nicht
  // vor), deshalb neutral mit 0 % markiert – das verschiebt nur den
  // Startzeitpunkt einer eventuellen Pre-Jun-2025-Tranche minimal.
  2025: {
    annual: 0.1258, // = 107,20 / 95,20 − 1 (Feb–Dez kumulativ)
    monthly: {
      "2025-01": 0.0, //  neutral, kein Vorkurs verfügbar
      "2025-02": -0.0108,
      "2025-03": -0.0501,
      "2025-04": -0.0054,
      "2025-05": 0.0580,
      "2025-06": 0.0350,
      "2025-07": 0.0188,
      "2025-08": 0.0186,
      "2025-09": 0.0305,
      "2025-10": 0.0241,
      "2025-11": 0.0010,
      "2025-12": 0.0036,
    },
  },

  // ===== 2026: echte Monats-Returns IE00B441G979 (EUR Hedged) =====
  // Monats-Schlusskurse: Jan 108,88 · Feb 109,82 · Mär 103,33
  // Jan 2026 Return = 108,88 / 107,20 − 1 ≈ +1,567 %.
  // Ab April 2026 → Fallback auf Annahme-Rendite aus den
  // MietBenchmark-Einstellungen (siehe utils/mietBenchmark.ts).
  2026: {
    annual: -0.0361, // = 103,33 / 107,20 − 1 (Jan–Mär kumulativ)
    monthly: {
      "2026-01": 0.01567,
      "2026-02": 0.0086,
      "2026-03": -0.0591,
    },
  },
};

/**
 * Liefert die Monatsrendite für einen gegebenen "YYYY-MM"-String als
 * Dezimalzahl (0,012 = +1,2 %). Gibt `undefined` zurück, wenn weder ein
 * Monats-Override noch ein Jahres-Wert in der Tabelle steht. Der Caller
 * fällt in dem Fall auf seine eigene Annahme-Rendite zurück.
 */
export function msciWorldMonatsReturn(yyyymm: string): number | undefined {
  const [yStr] = yyyymm.split("-");
  const jahr = Number(yStr);
  const entry = MSCI_WORLD_JAHRES_RETURNS[jahr];
  if (entry === undefined) return undefined;

  if (typeof entry === "object") {
    const m = entry.monthly?.[yyyymm];
    if (m !== undefined) return m;
    // Wenn ein monthly-Objekt existiert, aber dieser konkrete Monat nicht
    // drin ist, wird KEIN Fallback auf `annual` gemacht. So kann der Caller
    // explizit auf die Annahme-Rendite wechseln (→ zukünftige Monate).
    if (entry.monthly) return undefined;
    return jahresZuMonatsRate(entry.annual);
  }

  return jahresZuMonatsRate(entry);
}

function jahresZuMonatsRate(jahresRate: number): number {
  return Math.pow(1 + jahresRate, 1 / 12) - 1;
}
