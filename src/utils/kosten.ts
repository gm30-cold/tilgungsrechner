// Berechnet die Gesamtkosten-Übersicht der Immobilie: Nebenkosten, Darlehen,
// Förderungen, einmalige Posten und laufende Kosten.

import type { Finanzierung, Immobilie, KostenUebersicht } from "../types";
import { GRUNDERWERBSTEUER_SAETZE } from "../config/grunderwerbsteuer";

export function grunderwerbsteuerSatz(immobilie: Immobilie): number {
  const gr = immobilie.nebenkosten.grunderwerbsteuer;
  if (gr.modus === "manuell") return gr.satz;
  return GRUNDERWERBSTEUER_SAETZE[gr.bundesland] ?? 0;
}

export function grunderwerbsteuerBasis(immobilie: Immobilie): number {
  // Mobiliaranteil unterliegt keiner Grunderwerbsteuer.
  return Math.max(0, immobilie.kaufpreis - immobilie.mobiliarkosten);
}

export function grunderwerbsteuerBetrag(immobilie: Immobilie): number {
  const satz = grunderwerbsteuerSatz(immobilie);
  return grunderwerbsteuerBasis(immobilie) * (satz / 100);
}

export function nebenkostenSumme(immobilie: Immobilie): number {
  const nk = immobilie.nebenkosten;
  return (
    grunderwerbsteuerBetrag(immobilie) +
    (nk.grundbuch || 0) +
    (nk.notar || 0) +
    (nk.makler || 0) +
    (nk.sonstige || 0)
  );
}

export function gesamtkosten(immobilie: Immobilie): number {
  return immobilie.kaufpreis + nebenkostenSumme(immobilie);
}

export function darlehenssumme(immobilie: Immobilie): number {
  return Math.max(0, gesamtkosten(immobilie) - immobilie.eigenkapital);
}

export function kostenUebersicht(f: Finanzierung): KostenUebersicht {
  const { immobilie } = f;
  const satz = grunderwerbsteuerSatz(immobilie);
  const grEst = grunderwerbsteuerBetrag(immobilie);
  const nkSumme = nebenkostenSumme(immobilie);

  const einnahmenEinmalig = f.einnahmen.reduce((s, e) => s + (e.betrag || 0), 0);
  const ausgabenEinmalig = f.ausgaben.reduce((s, e) => s + (e.betrag || 0), 0);
  const foerderungenGesamt = f.foerderungen.reduce((s, e) => s + (e.gesamtbetrag || 0), 0);

  let laufendMonatlich = 0;
  let laufendJaehrlich = 0;
  for (const lk of f.laufendeKosten) {
    if (lk.intervall === "monatlich") {
      laufendMonatlich += lk.betrag || 0;
      laufendJaehrlich += (lk.betrag || 0) * 12;
    } else {
      laufendJaehrlich += lk.betrag || 0;
      laufendMonatlich += (lk.betrag || 0) / 12;
    }
  }

  return {
    kaufpreis: immobilie.kaufpreis,
    mobiliarkosten: immobilie.mobiliarkosten,
    grunderwerbsteuerSatz: satz,
    grunderwerbsteuerBetrag: grEst,
    grundbuch: immobilie.nebenkosten.grundbuch || 0,
    notar: immobilie.nebenkosten.notar || 0,
    makler: immobilie.nebenkosten.makler || 0,
    sonstigeNebenkosten: immobilie.nebenkosten.sonstige || 0,
    nebenkostenSumme: nkSumme,
    gesamtkosten: immobilie.kaufpreis + nkSumme,
    darlehenssumme: Math.max(0, immobilie.kaufpreis + nkSumme - immobilie.eigenkapital),
    einnahmenEinmalig,
    ausgabenEinmalig,
    foerderungenGesamt,
    laufendeKostenMonatlich: laufendMonatlich,
    laufendeKostenJaehrlich: laufendJaehrlich,
  };
}
