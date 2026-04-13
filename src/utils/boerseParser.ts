// Parser für das Copy-Paste-Format der Börse.de-Monatstabelle:
//
// iShares MSCI World EUR Hedged UCITS ETF (Acc) Monats-Schlusskurse 2026
// Monat	Erster	Hoch	Tief	Schluss	Veränderung
// Januar	-	109,60	107,38	108,88	-
// Februar	-	110,36	107,38	109,82	0,86%
// ...
// 11 | 12 | 13 | ... | 26          ← Jahresregister, wird ignoriert
//
// Der Parser:
//   1) Sucht den Header "Monats-Schlusskurse YYYY" für das Jahr
//   2) Liest die Spalte "Schluss" (Index 4 nach Tab-Split)
//   3) Berechnet die Monatsrendite aus aufeinanderfolgenden Schlusskursen:
//        return_m = close_m / close_(m-1) − 1
//   4) Gibt ein Record<string, number> zurück ("YYYY-MM" → Dezimalrendite)

const MONAT_MAP: Record<string, string> = {
  januar: "01",
  februar: "02",
  "märz": "03",
  maerz: "03",
  april: "04",
  mai: "05",
  juni: "06",
  juli: "07",
  august: "08",
  september: "09",
  oktober: "10",
  november: "11",
  dezember: "12",
};

interface ParseResult {
  returns: Record<string, number>;
  /** Letzter Monat, der in der Config aktualisiert wurde. */
  letzterMonat: string | null;
  /** Anzahl geparster Monats-Returns. */
  anzahl: number;
  /** Warnungen (z.B. "Januar ohne Vorkurs, auf 0 % gesetzt"). */
  warnungen: string[];
  /** Vorheriger Dez-Schlusskurs, falls für Jan-Berechnung benötigt. */
  letzterDezClose?: number;
}

/**
 * Parst einen oder mehrere Börse.de-Tabellen-Blöcke.
 *
 * @param raw  Rohtext aus der Zwischenablage
 * @param vorjahresDezClose  Optionaler Dez-Schlusskurs des Vorjahres
 *                           (für die Berechnung der Januar-Rendite).
 *                           Wenn nicht gegeben, wird Jan = 0 % gesetzt.
 */
export function parseBoerseTabelle(
  raw: string,
  vorjahresDezClose?: number,
): ParseResult {
  const returns: Record<string, number> = {};
  const warnungen: string[] = [];
  let letzterMonat: string | null = null;
  let anzahl = 0;

  // Zeilen aufteilen und trimmen
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let currentYear: number | null = null;
  let prevClose: number | undefined = vorjahresDezClose;
  let lastDezClose: number | undefined;

  for (const line of lines) {
    // --- Header-Zeile: "...Monats-Schlusskurse YYYY" ---
    const headerMatch = line.match(/Monats-Schlusskurse\s+(\d{4})/i);
    if (headerMatch) {
      currentYear = Number(headerMatch[1]);
      // Für das neue Jahr: prevClose auf den Dez-Close des vorherigen
      // geparsten Jahres setzen (falls vorhanden).
      if (lastDezClose !== undefined) {
        prevClose = lastDezClose;
      }
      continue;
    }

    // --- Spaltenheader überspringen ---
    if (/^Monat\t/i.test(line)) continue;

    // --- Jahresregister überspringen (enthält " | ") ---
    if (/\d+\s*\|\s*\d+/.test(line)) continue;

    // --- Monatszeile parsen ---
    if (!currentYear) continue;

    const cols = line.split("\t");
    if (cols.length < 5) continue;

    const monatName = cols[0].trim().toLowerCase();
    const monatNr = MONAT_MAP[monatName];
    if (!monatNr) continue;

    const schlussRaw = cols[4]?.trim();
    if (!schlussRaw || schlussRaw === "-") continue;

    // Deutsche Zahlenformatierung: "108,88" → 108.88
    const schluss = Number(schlussRaw.replace(/\./g, "").replace(",", "."));
    if (!Number.isFinite(schluss) || schluss <= 0) continue;

    const key = `${currentYear}-${monatNr}`;

    if (prevClose !== undefined && prevClose > 0) {
      const ret = schluss / prevClose - 1;
      returns[key] = Math.round(ret * 100000) / 100000; // 5 Nachkommastellen
      anzahl++;
      letzterMonat = key;
    } else {
      // Kein Vorkurs → 0 % als Platzhalter (typisch für Januar ohne Vorjahr).
      returns[key] = 0;
      warnungen.push(
        `${monatName.charAt(0).toUpperCase() + monatName.slice(1)} ${currentYear}: ` +
          "Kein Vorkurs → 0 % gesetzt. Ggf. Dezember-Schlusskurs des Vorjahres importieren.",
      );
      anzahl++;
      letzterMonat = key;
    }

    prevClose = schluss;
    if (monatNr === "12") lastDezClose = schluss;
  }

  return { returns, letzterMonat, anzahl, warnungen, letzterDezClose: lastDezClose };
}
