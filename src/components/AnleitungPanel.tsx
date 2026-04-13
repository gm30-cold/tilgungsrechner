// Tab: Anleitung – Schritt-für-Schritt-Guide zum Ausfüllen für Eigennutzer.

import { BookOpen, ArrowRight } from "lucide-react";
import { Card } from "./ui/Card";

interface Props {
  onNavigate: (tab: string, scrollId?: string) => void;
}

export function AnleitungPanel({ onNavigate }: Props) {
  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="text-[var(--color-ink-300)] text-sm leading-relaxed">
        Diese Anleitung führt dich Schritt für Schritt durch alle Eingaben.
        Du hast eine Immobilie zur Selbstnutzung gekauft und möchtest deine
        Finanzierung simulieren und mit dem Miet-Szenario vergleichen.
      </div>

      {/* Schritt 1 */}
      <StepCard
        step={1}
        title="Immobilie & Nebenkosten"
        tab="finanzierung"
        onNavigate={onNavigate}
      >
        <P>Trage zuerst die Eckdaten deiner Immobilie ein:</P>
        <UL>
          <LI><B>Kaufpreis</B> – der Betrag aus dem Kaufvertrag</LI>
          <LI>
            <B>Mobiliarkosten</B> – falls im Kaufvertrag separat ausgewiesen
            (z.B. Einbauküche, Markise). Wird von der Grunderwerbsteuer-Basis
            abgezogen und spart dir Steuern.
          </LI>
          <LI>
            <B>Grunderwerbsteuer</B> – wähle dein Bundesland aus der Liste
            (der Satz wird automatisch gesetzt) oder trage den Satz manuell ein.
          </LI>
          <LI>
            <B>Grundbuch / Notar / Makler / Sonstige</B> – die tatsächlichen
            Beträge aus deinen Rechnungen. Falls kein Makler beteiligt war,
            lass das Feld leer.
          </LI>
          <LI>
            <B>Eigenkapital</B> – wie viel Eigenmittel du eingebracht hast.
            Daraus ergibt sich automatisch die Darlehenssumme.
          </LI>
        </UL>
        <Hint>
          Tipp: Die Darlehenssumme = Kaufpreis + Nebenkosten − Eigenkapital.
          Prüfe, ob sie mit deinem tatsächlichen Kreditvertrag übereinstimmt.
        </Hint>
      </StepCard>

      {/* Schritt 2 */}
      <StepCard
        step={2}
        title="Kreditkonditionen"
        tab="finanzierung"
        onNavigate={onNavigate}
      >
        <P>Übertrage die Konditionen aus deinem Kreditvertrag:</P>
        <UL>
          <LI>
            <B>Sollzins p.a.</B> – der gebundene Sollzinssatz (nicht der
            Effektivzins).
          </LI>
          <LI>
            <B>Zinsbindung</B> – Anzahl der Jahre mit festem Zinssatz
            (typisch: 10, 15 oder 20 Jahre).
          </LI>
          <LI>
            <B>Kreditbeginn</B> – Monat der ersten Rate. Bei einem laufenden
            Kredit in der Vergangenheit (z.B. 2024-01) wird die bisherige
            Tilgung korrekt berücksichtigt.
          </LI>
          <LI>
            <B>Tilgung</B> – entweder als <B>Tilgungsrate in %</B> (z.B. 2 %)
            oder als <B>monatliche Rate in EUR</B>. Beides steht in deinem
            Vertrag. Umschaltbar per Toggle.
          </LI>
        </UL>
      </StepCard>

      {/* Schritt 3 */}
      <StepCard
        step={3}
        title="Anschlussfinanzierung"
        tab="finanzierung"
        scrollId="anschluss"
        onNavigate={onNavigate}
      >
        <P>
          Nach Ablauf der Zinsbindung brauchst du eine Anschlussfinanzierung
          für die Restschuld. Da dieser Zinssatz noch unbekannt ist, trägst du
          hier deine <B>Prognose</B> ein:
        </P>
        <UL>
          <LI>
            <B>Zinssatz</B> – deine Erwartung. Orientierung: aktuelles
            Zinsniveau ± 0,5 %.
          </LI>
          <LI>
            <B>Tilgung</B> – gleiche Logik wie beim Erstkredit. Viele erhöhen
            hier die Tilgungsrate, um schneller fertig zu werden.
          </LI>
        </UL>
        <Hint>
          Tipp: Spiel mit verschiedenen Zinssätzen – das zeigt dir, wie
          empfindlich deine Finanzierung auf Zinsänderungen reagiert.
        </Hint>
      </StepCard>

      {/* Schritt 4 */}
      <StepCard
        step={4}
        title="Sondertilgungen"
        tab="dashboard"
        scrollId="sondertilgungen"
        onNavigate={onNavigate}
      >
        <P>
          Sondertilgungen findest du im Dashboard rechts unten. Es gibt drei
          Bereiche:
        </P>
        <UL>
          <LI>
            <B>Real geleistet</B> – bereits gezahlte Sondertilgungen mit
            Datum und Betrag (z.B. „2024-12, 5.000 €"). Diese sind fix und
            fließen in alle Szenarien ein.
          </LI>
          <LI>
            <B>Geplant</B> – konkret geplante zukünftige Sondertilgungen
            nach Jahr und Betrag (z.B. „2026, 10.000 €").
          </LI>
          <LI>
            <B>Sensitivitätsszenarien</B> – drei pauschale jährliche Beträge
            (z.B. 0 / 5.000 / 10.000 €). Damit siehst du im Chart, wie stark
            regelmäßige Sondertilgungen die Laufzeit verkürzen.
          </LI>
        </UL>
        <Hint>
          Die Szenarien A, B, C aus der Sensitivität werden auch im
          Miet-Benchmark verwendet.
        </Hint>
      </StepCard>

      {/* Schritt 5 */}
      <StepCard
        step={5}
        title="Einnahmen & Förderungen"
        tab="einnahmen"
        onNavigate={onNavigate}
      >
        <P>Alles was deine Finanzierung günstiger macht:</P>
        <UL>
          <LI>
            <B>Einmalige Einnahmen</B> – z.B. Möbelverkauf, Geschenke,
            Erbschaft mit Datum und Betrag.
          </LI>
          <LI>
            <B>Förderungen</B> – staatliche Zuschüsse wie Hessengeld, BAFA,
            KfW-Tilgungszuschuss. Entweder als <B>Einmalzahlung</B> (mit
            Datum) oder <B>ratierlich</B> (über X Jahre verteilt, z.B.
            Hessengeld: 10.000 € über 10 Jahre).
          </LI>
        </UL>
        <Hint>
          Einnahmen reduzieren im Miet-Benchmark den Seed des Miet-Pots –
          sie gehören also zum Kauf-Szenario.
        </Hint>
      </StepCard>

      {/* Schritt 6 */}
      <StepCard
        step={6}
        title="Ausgaben"
        tab="ausgaben"
        scrollId="laufende-kosten"
        onNavigate={onNavigate}
      >
        <P>Kosten, die zum Haus gehören:</P>
        <UL>
          <LI>
            <B>Laufende Kosten</B> – alles was monatlich oder jährlich
            anfällt: Grundsteuer, Gebäudeversicherung, Strom, Gas, Wasser,
            Müllabfuhr, Schornsteinfeger, etc. Trage den Betrag und das
            Intervall (monatlich/jährlich) ein.
          </LI>
          <LI>
            <B>Einmalige Ausgaben</B> – größere Anschaffungen rund um den
            Kauf: neue Küche, Renovierung, Garten, Möbel. Mit Datum, damit
            sie im Miet-Benchmark zeitlich korrekt verbucht werden.
          </LI>
        </UL>
        <Hint>
          Die laufenden Kosten fließen in die monatliche Gesamtbelastung auf
          dem Dashboard und in den Kauf-Spend beim Miet-Benchmark ein.
        </Hint>
      </StepCard>

      {/* Schritt 7 */}
      <StepCard
        step={7}
        title="Miet-Benchmark"
        tab="miet-benchmark"
        scrollId="miet-szenario"
        onNavigate={onNavigate}
      >
        <P>
          Der Benchmark vergleicht: „Was wäre, wenn ich statt Kaufen gemietet
          und die Differenz im MSCI World angelegt hätte?"
        </P>
        <SubHead>Miet-Szenario</SubHead>
        <UL>
          <LI>
            <B>Kaltmiete</B> – was würdest du für eine vergleichbare Wohnung
            zahlen? Schau auf Immoscout für deine Gegend.
          </LI>
          <LI>
            <B>Nebenkosten</B> – Warmmiete-Anteil (Heizung, Wasser, Hausgeld).
          </LI>
          <LI>
            <B>Mietpreisinflation</B> – wie stark steigt die Miete jährlich?
            Bundesschnitt: ~2 %.
          </LI>
        </UL>
        <SubHead>Annahmen</SubHead>
        <UL>
          <LI>
            <B>Rendite Kapitalanlage</B> – erwartete Brutto-Rendite des
            MSCI World (6 % ist konservativ).
          </LI>
          <LI>
            <B>Volatilität</B> – 15 % ist der historische Standardwert für
            breit gestreute Aktien.
          </LI>
          <LI>
            <B>Wertsteigerung Immobilie</B> – wie viel gewinnt dein Haus
            jährlich an Wert? Langfristschnitt DE: 2–3 %.
          </LI>
          <LI>
            <B>Instandhaltung</B> – jährliche Rücklage als % vom Kaufpreis
            (1 % = Peterssche Formel für Bestandsimmobilien).
          </LI>
          <LI>
            <B>Zeithorizont</B> – wie weit in die Zukunft simulieren?
            Standard: 30 Jahre. Nach Tilgungsende investiert der Käufer seine
            freigespielte Rate ebenfalls im MSCI World.
          </LI>
        </UL>
        <Hint>
          Du kannst mit dem Szenario-Switcher (A/B/C) zwischen den
          Sondertilgungs-Szenarien wechseln und mit dem ±1σ-Button das
          Volatilitäts-Band ein-/ausblenden.
        </Hint>
      </StepCard>

      {/* Schritt 8 */}
      <StepCard
        step={8}
        title="Dashboard lesen"
        tab="dashboard"
        onNavigate={onNavigate}
      >
        <P>Wenn alle Daten eingetragen sind, zeigt das Dashboard:</P>
        <UL>
          <LI>
            <B>KPI-Kacheln</B> – Darlehen, monatliche Rate, Gesamtzinsen,
            Förderungen, Abzahlungsende und Netto-Gesamtbelastung auf einen
            Blick.
          </LI>
          <LI>
            <B>Restschuld-Verlauf</B> – wie sich die Restschuld über die
            Zeit entwickelt (mit vs. ohne geplante Sondertilgungen).
          </LI>
          <LI>
            <B>Zins/Tilgung-Aufteilung</B> – wie sich das Verhältnis Zins zu
            Tilgung über die Laufzeit verschiebt (am Anfang viel Zins, am
            Ende viel Tilgung).
          </LI>
          <LI>
            <B>Sensitivitätsanalyse</B> – alle drei Sondertilgungs-Szenarien
            übereinander. Zeigt wie viele Jahre und Zinsen du mit
            Sondertilgungen sparst.
          </LI>
        </UL>
      </StepCard>

      {/* Outro */}
      <div className="rounded-lg border border-[var(--color-ink-800)] bg-[var(--color-ink-900)]/40 px-4 py-3 text-[11px] text-[var(--color-ink-400)] leading-relaxed">
        <strong className="text-[var(--color-ink-200)]">
          Daten & Sicherheit:
        </strong>{" "}
        Alle Eingaben werden ausschließlich lokal in deinem Browser gespeichert
        (localStorage). Nichts wird an einen Server gesendet. Du kannst jederzeit
        über <strong className="text-[var(--color-ink-200)]">Export</strong>{" "}
        eine JSON-Datei sichern und später per{" "}
        <strong className="text-[var(--color-ink-200)]">Import</strong>{" "}
        wiederherstellen.
      </div>
    </div>
  );
}

// =============================================================================
// Sub-Components
// =============================================================================

function StepCard({
  step,
  title,
  tab,
  scrollId,
  onNavigate,
  children,
}: {
  step: number;
  title: string;
  tab: string;
  scrollId?: string;
  onNavigate: (tab: string, scrollId?: string) => void;
  children: React.ReactNode;
}) {
  return (
    <Card
      title={`${step}. ${title}`}
      icon={<BookOpen size={16} />}
      actions={
        <button
          type="button"
          onClick={() => onNavigate(tab, scrollId)}
          className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-ink-700)] bg-[var(--color-ink-850)] px-2.5 py-1 text-[10px] font-medium text-[var(--color-ink-300)] hover:border-[var(--color-accent)]/40 hover:text-[var(--color-accent)] transition-colors"
        >
          Öffnen
          <ArrowRight size={10} />
        </button>
      }
    >
      <div className="text-[12px] text-[var(--color-ink-300)] leading-relaxed flex flex-col gap-2">
        {children}
      </div>
    </Card>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p>{children}</p>;
}

function UL({ children }: { children: React.ReactNode }) {
  return <ul className="flex flex-col gap-1.5 pl-1">{children}</ul>;
}

function LI({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className="text-[var(--color-accent)] mt-0.5 shrink-0">·</span>
      <span>{children}</span>
    </li>
  );
}

function B({ children }: { children: React.ReactNode }) {
  return (
    <strong className="text-[var(--color-ink-100)] font-medium">
      {children}
    </strong>
  );
}

function SubHead({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[var(--color-ink-100)] font-medium mt-1">{children}</p>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md bg-[var(--color-accent)]/5 border border-[var(--color-accent)]/10 px-3 py-2 text-[11px] text-[var(--color-ink-400)]">
      {children}
    </div>
  );
}
