// Export/Import der Finanzierungsdaten als JSON-Datei.
// Rein lokal – die Datei wird im Browser erzeugt und zum Download angeboten.

import type { Finanzierung } from "../types";
import { LEERE_FINANZIERUNG } from "../config/defaults";

const DATEI_VERSION = 1;

/**
 * Bringt alte JSON-Stände auf das aktuelle Schema, indem neue Felder mit
 * ihren Default-Werten aufgefüllt werden. Das hält Import/LocalStorage
 * abwärtskompatibel, auch wenn wir neue Eingabebereiche hinzufügen.
 */
export function migriereFinanzierung(raw: unknown): Finanzierung {
  const f = raw as Partial<Finanzierung>;
  return {
    ...LEERE_FINANZIERUNG,
    ...f,
    mietBenchmark: {
      ...LEERE_FINANZIERUNG.mietBenchmark,
      ...(f.mietBenchmark ?? {}),
    },
    sondertilgungen: {
      ...LEERE_FINANZIERUNG.sondertilgungen,
      ...(f.sondertilgungen ?? {}),
    },
  };
}

interface ExportFormat {
  version: number;
  exportiertAm: string;
  finanzierung: Finanzierung;
}

export function exportiereJSON(finanzierung: Finanzierung): void {
  const data: ExportFormat = {
    version: DATEI_VERSION,
    exportiertAm: new Date().toISOString(),
    finanzierung,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const stamp = new Date().toISOString().slice(0, 10);
  a.download = `tilgungsrechner-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importiereJSON(file: File): Promise<Finanzierung> {
  const text = await file.text();
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Ungültige Datei");
  }
  // Unterstützt sowohl neue (mit Wrapper) als auch direkte Finanzierungs-Objekte.
  const f = parsed.finanzierung ?? parsed;
  if (!f.immobilie || !f.kredit) {
    throw new Error("Datei enthält keinen gültigen Finanzierungsstand");
  }
  return migriereFinanzierung(f);
}
