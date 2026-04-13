import { useState } from "react";
import {
  LayoutDashboard,
  Landmark,
  ArrowDownLeft,
  ArrowUpRight,
  Scale,
} from "lucide-react";
import { useFinanzierung } from "./hooks/useFinanzierung";
import { useMatchHeight } from "./hooks/useMatchHeight";
import { Header } from "./components/Header";
import { Ergebnis } from "./components/Ergebnis";
import { Tabs, type TabDef } from "./components/ui/Tabs";
import { ImmobilienDaten } from "./components/ImmobilienDaten";
import { KreditKonditionen } from "./components/KreditKonditionen";
import { AnschlussfinanzierungBlock } from "./components/Anschlussfinanzierung";
import { Sondertilgungen } from "./components/Sondertilgungen";
import { Foerderungen } from "./components/Foerderungen";
import { EinmaligeEinnahmen, EinmaligeAusgaben } from "./components/EinmaligePosten";
import { LaufendeKosten } from "./components/LaufendeKosten";
import { MietBenchmarkPanel } from "./components/MietBenchmarkPanel";
import { RestschuldVerlauf } from "./components/charts/RestschuldVerlauf";
import { ZinsTilgungAufteilung } from "./components/charts/ZinsTilgungAufteilung";
import { Sensitivitaet } from "./components/charts/Sensitivitaet";

type TabKey =
  | "dashboard"
  | "finanzierung"
  | "einnahmen"
  | "ausgaben"
  | "miet-benchmark";

const TAB_DEFS: TabDef<TabKey>[] = [
  { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={14} /> },
  { key: "finanzierung", label: "Finanzierung", icon: <Landmark size={14} /> },
  { key: "einnahmen", label: "Einnahmen", icon: <ArrowDownLeft size={14} /> },
  { key: "ausgaben", label: "Ausgaben", icon: <ArrowUpRight size={14} /> },
  { key: "miet-benchmark", label: "Miet-Benchmark", icon: <Scale size={14} /> },
];

export default function App() {
  const ctrl = useFinanzierung();
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");

  return (
    <div className="min-h-screen">
      <Header
        ctrl={ctrl}
        tabs={
          <Tabs<TabKey> tabs={TAB_DEFS} active={activeTab} onChange={setActiveTab} />
        }
      />

      <main className="mx-auto max-w-[1600px] px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === "dashboard" && <DashboardTab ctrl={ctrl} />}
        {activeTab === "finanzierung" && <FinanzierungTab ctrl={ctrl} />}
        {activeTab === "einnahmen" && <EinnahmenTab ctrl={ctrl} />}
        {activeTab === "ausgaben" && <AusgabenTab ctrl={ctrl} />}
        {activeTab === "miet-benchmark" && <MietBenchmarkPanel ctrl={ctrl} />}

        <footer className="mt-12 py-6 text-center text-xs text-[var(--color-ink-500)]">
          Amortize · Alle Berechnungen sind Näherungen ohne Rechtsanspruch. Daten bleiben lokal.
        </footer>
      </main>
    </div>
  );
}

// =============================================================================
// Tab: Dashboard
// =============================================================================

function DashboardTab({ ctrl }: { ctrl: ReturnType<typeof useFinanzierung> }) {
  // RestschuldVerlauf ist breiter und natürlich höher → als Referenz messen.
  const { ref: restRef, height: restHeight } = useMatchHeight<HTMLDivElement>();
  // Sensitivität ist Referenz für Sondertilgungen.
  const { ref: sensiRef, height: sensiHeight } = useMatchHeight<HTMLDivElement>();

  return (
    <div className="flex flex-col gap-6">
      <Ergebnis ctrl={ctrl} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
        <div ref={restRef} className="xl:col-span-2">
          <RestschuldVerlauf ctrl={ctrl} />
        </div>
        <div
          className="xl:col-span-1"
          style={restHeight ? { height: restHeight } : undefined}
        >
          <ZinsTilgungAufteilung ctrl={ctrl} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
        <div ref={sensiRef} className="xl:col-span-2">
          <Sensitivitaet ctrl={ctrl} />
        </div>
        <div
          className="xl:col-span-1"
          style={sensiHeight ? { height: sensiHeight } : undefined}
        >
          <Sondertilgungen ctrl={ctrl} />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Tab: Finanzierung
// =============================================================================

function FinanzierungTab({ ctrl }: { ctrl: ReturnType<typeof useFinanzierung> }) {
  // Immobilie ist links natürlich am höchsten – als Referenz messen und die
  // rechte Spalte exakt an dessen Höhe koppeln. Beide Karten rechts bleiben
  // bei ihrer natürlichen Höhe; der zusätzliche vertikale Platz wird per
  // `justify-between` auf den Zwischenraum verteilt.
  const { ref: immoRef, height: immoHeight } = useMatchHeight<HTMLDivElement>();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
      <div ref={immoRef}>
        <ImmobilienDaten
          immobilie={ctrl.finanzierung.immobilie}
          setImmobilie={ctrl.setImmobilie}
        />
      </div>
      <div
        className="flex flex-col gap-4 justify-between"
        style={immoHeight ? { height: immoHeight } : undefined}
      >
        <KreditKonditionen
          kredit={ctrl.finanzierung.kredit}
          darlehen={ctrl.kosten.darlehenssumme}
          setKredit={ctrl.setKredit}
        />
        <AnschlussfinanzierungBlock
          anschluss={ctrl.finanzierung.anschlussfinanzierung}
          kredit={ctrl.finanzierung.kredit}
          setAnschluss={ctrl.setAnschluss}
        />
      </div>
    </div>
  );
}

// =============================================================================
// Tab: Einnahmen
// =============================================================================

function EinnahmenTab({ ctrl }: { ctrl: ReturnType<typeof useFinanzierung> }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
      <EinmaligeEinnahmen ctrl={ctrl} />
      <Foerderungen ctrl={ctrl} />
    </div>
  );
}

// =============================================================================
// Tab: Ausgaben
// =============================================================================

function AusgabenTab({ ctrl }: { ctrl: ReturnType<typeof useFinanzierung> }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
      <LaufendeKosten ctrl={ctrl} />
      <EinmaligeAusgaben ctrl={ctrl} />
    </div>
  );
}
