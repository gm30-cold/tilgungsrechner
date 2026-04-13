// Vermögens-Vergleich Kauf vs. Miete.
//
// =============================================================================
// MODELL (was die Simulation macht)
// =============================================================================
//
// KAUF:
//   Wealth_Kauf(t) = Hauswert(t) − Restschuld(t) + KäuferDepot(t)
//   Hauswert wächst mit `wertsteigerungProzent` p.a.
//   Restschuld stammt aus dem Tilgungsplan inkl. Sondertilgungen.
//   Nach Tilgungsende: Rate + Sondertilgung = 0, Restschuld = 0.
//   Die freigespielte monatliche Rate fließt ab dann in ein
//   eigenes MSCI-Depot (gleiche Rendite/Vola wie der Mieter-Pot),
//   abzüglich der weiterhin anfallenden laufenden Kosten + Instandhaltung.
//   KäuferDepot wird brutto geführt (Eigenheim-Verkauf steuerfrei,
//   ETF-Gewinn im KäuferDepot wird bei wealthKauf netto ausgewiesen).
//
// MIETE (Lump-Sum-DCA in den MSCI World):
//   Der Mieter hat im Gegenzug zum Käufer exakt die gleiche Liquidität und
//   "investiert sie in den MSCI World", wann immer der Käufer sie ausgeben
//   würde. Konkret pro Monat i:
//
//     1) Der Pot von i−1 wird mit dem MSCI-World-Return des Monats i
//        multipliziert. In der Vergangenheit ist das die echte
//        MSCI-Rendite (Factsheet-Daten), in der Zukunft die Annahme-Rendite
//        aus den MietBenchmark-Einstellungen.
//
//     2) Nach der Verzinsung wird der Cash-Delta in den Pot eingezahlt
//        bzw. aus dem Pot entnommen:
//          Δ(i) = KäuferSpend(i) − MieterSpend(i)  (+ einmalige Events)
//
//          KäuferSpend(i) = Kreditrate(i)               ← bis Kredit-Ende
//                         + Sondertilgung(i)            ← real + geplant + sens
//                         + kaufLaufendMonat            ← Grundsteuer, Instandh.
//          MieterSpend(i) = (Kaltmiete + NK) × Inflationsfaktor(i)
//
//        Wenn Δ > 0 (Kauf teurer als Miete):
//          → DCA: Δ wird zusätzlich in den MSCI World eingezahlt
//                 und wächst ab Monat i mit.
//        Wenn Δ < 0 (Miete teurer als Kauf):
//          → Withdraw: |Δ| wird aus dem Pot entnommen,
//                      um die Lücke zu schließen.
//
//     3) Bei t=0 gibt es eine große Initial-Tranche:
//          Pot(0) = Eigenkapital + Nebenkosten + einmalige Ausgaben
//                   − einmalige Einnahmen
//        Das sind alle Beträge, die der Käufer am Kauftag versenkt und die
//        der Mieter stattdessen in den ETF legen kann.
//
// WICHTIG: Jeder Geldfluss wird zum "gültigen Monatsindex" einmalig als
// Lump Sum eingezahlt oder entnommen. Es gibt keine Glättung, keine
// Monats-Durchschnitte, keine Vorverlagerung. Das entspricht deinem
// mentalen Modell: "Die Sondertilgung im März 2027 hätte der Mieter im
// März 2027 als Lump Sum in den ETF gelegt und ab April 2027 wächst sie
// mit dem MSCI mit."
//
// Auf den Kursgewinn (Pot-Brutto − kumulierte Einzahlungen) wird bei
// jeder Monats-Schnapshot-Berechnung Kapitalertragsteuer angesetzt und
// für die Netto-Anzeige vom Brutto abgezogen ("Schatten-KapSt": zeigt,
// wie viel dem Mieter bliebe, wenn er genau JETZT alles realisieren
// würde).
//
// =============================================================================
// SENSITIVITÄT
// =============================================================================
// Für jedes Sensitivitäts-Szenario wird eine komplette Zeitreihe
// durchgerechnet, weil sich die Sondertilgungen pro Szenario ja
// unterscheiden. Pro Szenario hat der Pot also einen eigenen Pfad.

import type {
  Finanzierung,
  KostenUebersicht,
  MietBenchmarkErgebnis,
  MietBenchmarkMonat,
  MietBenchmarkSzenario,
  TilgungsPlan,
} from "../types";
import { addMonths, jahrAus } from "./format";
import { berechneSensitivitaet } from "./tilgung";
import { msciWorldMonatsReturn } from "../config/msciWorld";

/** Aktuelles Jahr-Monat im "YYYY-MM"-Format (Kreditstart-Zeitzone). */
function jetztMonatString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Vergleich zweier "YYYY-MM"-Strings. Negativ = a < b, 0 = gleich. */
function cmpMonat(a: string, b: string): number {
  return a.localeCompare(b);
}

/** Hauptfunktion: gibt das komplette Benchmark-Ergebnis zurück. */
export function berechneMietBenchmark(
  finanzierung: Finanzierung,
  _hauptPlan: TilgungsPlan,
  kosten: KostenUebersicht,
): MietBenchmarkErgebnis {
  // `berechneSensitivitaet` liefert für jedes Sondertilgungs-Szenario einen
  // kompletten Tilgungsplan (inkl. realer + geplanter Sondertilgungen als
  // Basis, plus dem Szenario-Pauschalbetrag in leeren Zukunftsjahren).
  const sens = berechneSensitivitaet(finanzierung);

  const einnahmenGesamt = finanzierung.einnahmen.reduce(
    (s, e) => s + (e.betrag || 0),
    0,
  );
  const ausgabenGesamt = finanzierung.ausgaben.reduce(
    (s, a) => s + (a.betrag || 0),
    0,
  );
  const seedBetrag =
    finanzierung.immobilie.eigenkapital +
    kosten.nebenkostenSumme +
    ausgabenGesamt -
    einnahmenGesamt;

  const szenarien: MietBenchmarkSzenario[] = sens.map((s) =>
    berechneEinSzenario(finanzierung, s.plan, kosten, s.jaehrlicheSondertilgung),
  );

  return { szenarien, seedBetrag };
}

function berechneEinSzenario(
  finanzierung: Finanzierung,
  plan: TilgungsPlan,
  kosten: KostenUebersicht,
  jaehrlicheSondertilgung: number,
): MietBenchmarkSzenario {
  const mb = finanzierung.mietBenchmark;
  const startDatum = finanzierung.kredit.startdatum;

  const kaufpreis = finanzierung.immobilie.kaufpreis;
  const monatWertsteig = jahresFaktorZuMonatsRate(mb.wertsteigerungProzent);
  const monatRendite = jahresFaktorZuMonatsRate(mb.renditeProzent);
  const instandhaltungMonatlich =
    (kaufpreis * (mb.instandhaltungProzent / 100)) / 12;

  // Alle laufenden Kauf-Kosten pro Monat, inklusive Instandhaltungs-Rücklage.
  const kaufLaufendMonat =
    kosten.laufendeKostenMonatlich + instandhaltungMonatlich;

  // Einmalige Cashflow-Events auf Monats-Index mappen.
  const cashflowEvents = new Map<number, number>();
  const addEvent = (idx: number, betrag: number) => {
    cashflowEvents.set(idx, (cashflowEvents.get(idx) ?? 0) + betrag);
  };
  for (const a of finanzierung.ausgaben) {
    const idx = datumZuIndex(a.datum, startDatum) ?? 0;
    addEvent(Math.max(0, idx), a.betrag || 0);
  }
  for (const e of finanzierung.einnahmen) {
    const idx = datumZuIndex(e.datum, startDatum) ?? 0;
    addEvent(Math.max(0, idx), -(e.betrag || 0));
  }

  // Seed bei t=0: EK + Nebenkosten + Einmalige mit Datum im Start-Monat.
  let pot =
    finanzierung.immobilie.eigenkapital +
    kosten.nebenkostenSumme +
    (cashflowEvents.get(0) ?? 0);
  cashflowEvents.delete(0);

  // Kumulierte Netto-Einzahlungen (für KapSt-Berechnung).
  let kumulierteEinzahlungen = pot;

  // Horizont: fester Zeitrahmen (z.B. 30 Jahre), NICHT mehr nur bis Tilgungsende.
  const anzahlMonate = Math.max(mb.horizontJahre * 12, plan.monate.length, 1);
  const monate: MietBenchmarkMonat[] = [];
  const kapStAnteil = mb.kapitalertragsteuerProzent / 100;
  const sigma = (mb.renditeVolatilitaetProzent || 0) / 100;
  const heuteStr = jetztMonatString();

  const [sy, sm] = startDatum.split("-").map(Number);
  const [hy, hm] = heuteStr.split("-").map(Number);
  const heuteIdx = (hy - sy) * 12 + (hm - sm);

  // Käufer-Depot: Nach Tilgungsende investiert der Käufer die freigespielte
  // Rate (abzüglich laufender Kosten) monatlich in den MSCI World.
  let kaeuferDepot = 0;
  let kaeuferDepotEinzahlungen = 0;

  for (let i = 0; i < anzahlMonate; i++) {
    const planMonat = i < plan.monate.length ? plan.monate[i] : undefined;
    const datum = planMonat?.datum ?? addMonths(startDatum, i);
    const jahr = planMonat?.jahr ?? jahrAus(datum);
    const tilgungLaeuft = planMonat !== undefined;

    // 1) SCHRITT A: Pot wird mit dem MSCI-Monatsreturn verzinst.
    const istHistorisch = cmpMonat(datum, heuteStr) <= 0;
    const userReturn = mb.historischeMonatsReturns?.[datum];
    const configReturn = istHistorisch
      ? msciWorldMonatsReturn(datum)
      : undefined;
    const effektiveMonatRendite =
      userReturn !== undefined
        ? userReturn
        : configReturn !== undefined
        ? configReturn
        : monatRendite;
    pot = pot * (1 + effektiveMonatRendite);

    // Käufer-Depot mitverzinsen (gleiche MSCI-Rendite).
    if (kaeuferDepot > 0) {
      kaeuferDepot = kaeuferDepot * (1 + effektiveMonatRendite);
    }

    // 2) SCHRITT B1: Mieter-Spend – inflationierte Warmmiete.
    const jahreSeitStart = i / 12;
    const mietFaktor = Math.pow(
      1 + mb.mietpreisInflationProzent / 100,
      jahreSeitStart,
    );
    const mieterSpend =
      (mb.monatlicheKaltmiete + mb.monatlicheNebenkosten) * mietFaktor;

    // 3) SCHRITT B2: Käufer-Spend.
    //    Während Tilgung: Rate + Sondertilgung + laufende Kosten.
    //    Nach Tilgung: nur noch laufende Kosten (Rate + Sondertilgung = 0).
    const rate = planMonat?.rate ?? 0;
    const sondertilgungBetrag = planMonat?.sondertilgung ?? 0;
    const kaeuferSpend = rate + sondertilgungBetrag + kaufLaufendMonat;

    // 4) SCHRITT C: Cash-Delta für den Mieter-Pot.
    const einmaligFlow = cashflowEvents.get(i) ?? 0;
    const delta = kaeuferSpend - mieterSpend + einmaligFlow;
    pot += delta;
    kumulierteEinzahlungen += delta;

    // 5) Nach Tilgungsende: Die freigespielte Rate fließt ins Käufer-Depot.
    //    "Freigespielte Rate" = was der Käufer während der Tilgung an Rate +
    //    Sondertilgung gezahlt hat, jetzt aber nicht mehr zahlen muss.
    //    Übrig bleibt aber die Differenz zur Miete: Der Käufer zahlt weiterhin
    //    laufende Kosten, der Mieter zahlt Miete. Wenn kaufLaufendMonat < mieterSpend,
    //    hat der Käufer nach Tilgung sogar einen monatlichen Überschuss.
    if (!tilgungLaeuft) {
      // Käufer hat jetzt keinen Kredit mehr. Sein monatlicher Spend = kaufLaufendMonat.
      // Was er "spart" vs. der Mieter: mieterSpend − kaufLaufendMonat.
      // Ist das positiv, investiert der Käufer diesen Überschuss.
      // Ist das negativ, muss der Käufer drauflegen (selten, aber möglich bei
      // sehr hohen laufenden Kosten vs. sehr niedriger Miete).
      const kaeuferUeberschuss = mieterSpend - kaufLaufendMonat;
      if (kaeuferUeberschuss > 0) {
        kaeuferDepot += kaeuferUeberschuss;
        kaeuferDepotEinzahlungen += kaeuferUeberschuss;
      }
    }

    // 6) Kauf-Seite: Hauswert − Restschuld + Käufer-Depot (netto nach KapSt).
    const hausWert = kaufpreis * Math.pow(1 + monatWertsteig, i + 1);
    const restschuld = planMonat?.restschuld ?? 0;
    const kaeuferDepotGewinn = Math.max(0, kaeuferDepot - kaeuferDepotEinzahlungen);
    const kaeuferDepotNetto = kaeuferDepot - kaeuferDepotGewinn * kapStAnteil;
    const wealthKauf = hausWert - restschuld + kaeuferDepotNetto;

    // 7) Schatten-KapSt auf Mieter-Pot.
    const kursgewinnAktuell = Math.max(0, pot - kumulierteEinzahlungen);
    const kapStAktuell = kursgewinnAktuell * kapStAnteil;
    const wealthMieteNetto = pot - kapStAktuell;

    // 8) ±1σ-Band.
    const jahreSeitHeute = Math.max(0, (i - heuteIdx) / 12);
    const bandFaktor =
      sigma > 0 && jahreSeitHeute > 0
        ? Math.exp(sigma * Math.sqrt(jahreSeitHeute))
        : 1;
    const potUpper = pot * bandFaktor;
    const potLower = pot / bandFaktor;
    const gewinnUpper = Math.max(0, potUpper - kumulierteEinzahlungen);
    const gewinnLower = Math.max(0, potLower - kumulierteEinzahlungen);
    const wealthMieteNettoUpper = potUpper - gewinnUpper * kapStAnteil;
    const wealthMieteNettoLower = potLower - gewinnLower * kapStAnteil;

    monate.push({
      monatIndex: i,
      datum,
      jahr,
      wealthKauf,
      wealthMieteBrutto: pot,
      wealthMieteNetto,
      wealthMieteNettoUpper,
      wealthMieteNettoLower,
      delta: wealthKauf - wealthMieteNetto,
    });
  }

  // Break-Even: erster Vorzeichenwechsel von negativ nach nicht-negativ.
  let breakEvenMonat: number | null = null;
  for (let i = 1; i < monate.length; i++) {
    if (monate[i - 1].delta < 0 && monate[i].delta >= 0) {
      breakEvenMonat = i;
      break;
    }
  }

  const last = monate[monate.length - 1];
  const endWealthKauf = last?.wealthKauf ?? 0;
  const endWealthMieteBrutto = last?.wealthMieteBrutto ?? 0;
  const endWealthMieteNetto = last?.wealthMieteNetto ?? 0;
  const kursgewinnEnde = Math.max(
    0,
    endWealthMieteBrutto - kumulierteEinzahlungen,
  );
  const kapStBetragEnde = kursgewinnEnde * kapStAnteil;

  return {
    jaehrlicheSondertilgung,
    monate,
    endWealthKauf,
    endWealthMieteBrutto,
    endWealthMieteNetto,
    kursgewinn: kursgewinnEnde,
    kapStBetrag: kapStBetragEnde,
    breakEvenMonat,
  };
}

function jahresFaktorZuMonatsRate(prozent: number): number {
  return Math.pow(1 + prozent / 100, 1 / 12) - 1;
}

function datumZuIndex(datum: string | null, startdatum: string): number | null {
  if (!datum) return null;
  const [sy, sm] = startdatum.split("-").map(Number);
  const [y, m] = datum.split("-").map(Number);
  if (!y || !m || !sy || !sm) return null;
  return (y - sy) * 12 + (m - sm);
}
