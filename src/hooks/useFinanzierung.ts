// Zentraler App-State. Hält den gesamten Finanzierungsstand und bietet
// Setter-Funktionen für jeden Eingabebereich. Wird an den Top-Level-Layout
// weitergereicht und von dort in die Eingabe-Komponenten verteilt.

import { useCallback, useMemo, useState } from "react";
import type {
  Anschlussfinanzierung,
  EinmaligerPosten,
  Finanzierung,
  Foerderung,
  Immobilie,
  Kredit,
  LaufenderKostenposten,
  SondertilgungGeplant,
  SondertilgungReal,
} from "../types";
import { LEERE_FINANZIERUNG, neueId } from "../config/defaults";
import { berechneBaseline, berechnePlan, berechneSensitivitaet } from "../utils/tilgung";
import { kostenUebersicht } from "../utils/kosten";
import { migriereFinanzierung } from "../utils/persistence";
import { berechneMietBenchmark } from "../utils/mietBenchmark";
import type { MietBenchmark } from "../types";

const STORAGE_KEY = "tilgungsrechner.entwurf.v1";

function ladeEntwurf(): Finanzierung {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return LEERE_FINANZIERUNG;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.immobilie && parsed.kredit) {
      return migriereFinanzierung(parsed);
    }
  } catch {
    // Fehlerhaften Entwurf ignorieren.
  }
  return LEERE_FINANZIERUNG;
}

export function useFinanzierung() {
  const [finanzierung, setFinanzierung] = useState<Finanzierung>(ladeEntwurf);

  // Automatisch im Browser-Speicher sichern, damit Eingaben bei einem
  // versehentlichen Reload nicht verloren gehen. Sensitive Daten bleiben
  // rein lokal – nichts verlässt den Rechner.
  useMemo(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(finanzierung));
    } catch {
      // Storage voll / blockiert – ignorieren.
    }
  }, [finanzierung]);

  const setImmobilie = useCallback((updater: (prev: Immobilie) => Immobilie) => {
    setFinanzierung((f) => ({ ...f, immobilie: updater(f.immobilie) }));
  }, []);

  const setKredit = useCallback((updater: (prev: Kredit) => Kredit) => {
    setFinanzierung((f) => ({ ...f, kredit: updater(f.kredit) }));
  }, []);

  const setAnschluss = useCallback(
    (updater: (prev: Anschlussfinanzierung) => Anschlussfinanzierung) => {
      setFinanzierung((f) => ({
        ...f,
        anschlussfinanzierung: updater(f.anschlussfinanzierung),
      }));
    },
    [],
  );

  // ---------- Sondertilgungen ----------
  const addSondertilgungReal = useCallback(() => {
    setFinanzierung((f) => ({
      ...f,
      sondertilgungen: {
        ...f.sondertilgungen,
        real: [
          ...f.sondertilgungen.real,
          { id: neueId(), datum: new Date().toISOString().slice(0, 7), betrag: 0 },
        ],
      },
    }));
  }, []);

  const updateSondertilgungReal = useCallback(
    (id: string, patch: Partial<SondertilgungReal>) => {
      setFinanzierung((f) => ({
        ...f,
        sondertilgungen: {
          ...f.sondertilgungen,
          real: f.sondertilgungen.real.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        },
      }));
    },
    [],
  );

  const removeSondertilgungReal = useCallback((id: string) => {
    setFinanzierung((f) => ({
      ...f,
      sondertilgungen: {
        ...f.sondertilgungen,
        real: f.sondertilgungen.real.filter((s) => s.id !== id),
      },
    }));
  }, []);

  const addSondertilgungGeplant = useCallback(() => {
    setFinanzierung((f) => ({
      ...f,
      sondertilgungen: {
        ...f.sondertilgungen,
        geplant: [
          ...f.sondertilgungen.geplant,
          { id: neueId(), jahr: new Date().getFullYear(), betrag: 0 },
        ],
      },
    }));
  }, []);

  const updateSondertilgungGeplant = useCallback(
    (id: string, patch: Partial<SondertilgungGeplant>) => {
      setFinanzierung((f) => ({
        ...f,
        sondertilgungen: {
          ...f.sondertilgungen,
          geplant: f.sondertilgungen.geplant.map((s) =>
            s.id === id ? { ...s, ...patch } : s,
          ),
        },
      }));
    },
    [],
  );

  const removeSondertilgungGeplant = useCallback((id: string) => {
    setFinanzierung((f) => ({
      ...f,
      sondertilgungen: {
        ...f.sondertilgungen,
        geplant: f.sondertilgungen.geplant.filter((s) => s.id !== id),
      },
    }));
  }, []);

  const setSensitivitaetSzenarien = useCallback((szenarien: number[]) => {
    setFinanzierung((f) => ({
      ...f,
      sondertilgungen: { ...f.sondertilgungen, sensitivitaetSzenarien: szenarien },
    }));
  }, []);

  // ---------- Förderungen ----------
  const addFoerderung = useCallback(() => {
    const neue: Foerderung = {
      id: neueId(),
      bezeichnung: "",
      gesamtbetrag: 0,
      auszahlung: { modus: "einmalig", datum: new Date().toISOString().slice(0, 7) },
    };
    setFinanzierung((f) => ({ ...f, foerderungen: [...f.foerderungen, neue] }));
  }, []);

  const updateFoerderung = useCallback((id: string, patch: Partial<Foerderung>) => {
    setFinanzierung((f) => ({
      ...f,
      foerderungen: f.foerderungen.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    }));
  }, []);

  const removeFoerderung = useCallback((id: string) => {
    setFinanzierung((f) => ({
      ...f,
      foerderungen: f.foerderungen.filter((x) => x.id !== id),
    }));
  }, []);

  // ---------- Einnahmen & Ausgaben ----------
  const addEinmalig = useCallback((typ: "einnahmen" | "ausgaben") => {
    const neu: EinmaligerPosten = {
      id: neueId(),
      bezeichnung: "",
      betrag: 0,
      datum: null,
    };
    setFinanzierung((f) => ({ ...f, [typ]: [...f[typ], neu] }));
  }, []);

  const updateEinmalig = useCallback(
    (typ: "einnahmen" | "ausgaben", id: string, patch: Partial<EinmaligerPosten>) => {
      setFinanzierung((f) => ({
        ...f,
        [typ]: f[typ].map((x) => (x.id === id ? { ...x, ...patch } : x)),
      }));
    },
    [],
  );

  const removeEinmalig = useCallback((typ: "einnahmen" | "ausgaben", id: string) => {
    setFinanzierung((f) => ({
      ...f,
      [typ]: f[typ].filter((x) => x.id !== id),
    }));
  }, []);

  // ---------- Laufende Kosten ----------
  const addLaufendeKosten = useCallback(() => {
    const neu: LaufenderKostenposten = {
      id: neueId(),
      bezeichnung: "",
      betrag: 0,
      intervall: "monatlich",
      kategorie: "",
    };
    setFinanzierung((f) => ({ ...f, laufendeKosten: [...f.laufendeKosten, neu] }));
  }, []);

  const updateLaufendeKosten = useCallback(
    (id: string, patch: Partial<LaufenderKostenposten>) => {
      setFinanzierung((f) => ({
        ...f,
        laufendeKosten: f.laufendeKosten.map((x) =>
          x.id === id ? { ...x, ...patch } : x,
        ),
      }));
    },
    [],
  );

  const removeLaufendeKosten = useCallback((id: string) => {
    setFinanzierung((f) => ({
      ...f,
      laufendeKosten: f.laufendeKosten.filter((x) => x.id !== id),
    }));
  }, []);

  // ---------- Miet-Benchmark ----------
  const setMietBenchmark = useCallback(
    (updater: (prev: MietBenchmark) => MietBenchmark) => {
      setFinanzierung((f) => ({ ...f, mietBenchmark: updater(f.mietBenchmark) }));
    },
    [],
  );

  // ---------- Replace (Import) und Reset ----------
  const ersetzeFinanzierung = useCallback((f: Finanzierung) => {
    setFinanzierung(f);
  }, []);

  const zuruecksetzen = useCallback(() => {
    setFinanzierung(LEERE_FINANZIERUNG);
  }, []);

  // ---------- Berechnete Werte ----------
  const kosten = useMemo(() => kostenUebersicht(finanzierung), [finanzierung]);
  const plan = useMemo(() => berechnePlan(finanzierung), [finanzierung]);
  const baseline = useMemo(() => berechneBaseline(finanzierung), [finanzierung]);
  const sensitivitaet = useMemo(() => berechneSensitivitaet(finanzierung), [finanzierung]);
  const mietBenchmark = useMemo(
    () => berechneMietBenchmark(finanzierung, plan, kosten),
    [finanzierung, plan, kosten],
  );

  return {
    finanzierung,
    // Setter
    setImmobilie,
    setKredit,
    setAnschluss,
    addSondertilgungReal,
    updateSondertilgungReal,
    removeSondertilgungReal,
    addSondertilgungGeplant,
    updateSondertilgungGeplant,
    removeSondertilgungGeplant,
    setSensitivitaetSzenarien,
    addFoerderung,
    updateFoerderung,
    removeFoerderung,
    addEinmalig,
    updateEinmalig,
    removeEinmalig,
    addLaufendeKosten,
    updateLaufendeKosten,
    removeLaufendeKosten,
    setMietBenchmark,
    ersetzeFinanzierung,
    zuruecksetzen,
    // Berechnungen
    kosten,
    plan,
    baseline,
    sensitivitaet,
    mietBenchmark,
  };
}

export type FinanzierungController = ReturnType<typeof useFinanzierung>;
