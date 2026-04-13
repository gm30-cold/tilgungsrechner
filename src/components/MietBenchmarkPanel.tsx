// Tab: Miet-Benchmark. Vergleicht über den gesamten Kreditzeitraum das
// Nettovermögen im Kauf-Case mit dem Miet-plus-Anlage-Case, für alle
// drei Sondertilgungs-Szenarien gleichzeitig.

import { useState } from "react";
import { Database, Eye, EyeOff, Home, Landmark, Scale, TrendingUp } from "lucide-react";
import { MsciImportDialog } from "./MsciImportDialog";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "./ui/Card";
import { InputField } from "./ui/InputField";
import { formatEUR, formatMonatJahr } from "../utils/format";
import type { FinanzierungController } from "../hooks/useFinanzierung";
import type { MietBenchmark as MietBenchmarkTyp } from "../types";

interface Props {
  ctrl: FinanzierungController;
}

const SZENARIO_FARBEN = ["#5b6370", "#5eead4", "#f59e0b", "#f43f5e"];

export function MietBenchmarkPanel({ ctrl }: Props) {
  const { mietBenchmark, finanzierung } = ctrl;
  const mb = finanzierung.mietBenchmark;

  // Welche Szenarien sind aktuell im Chart sichtbar? Startwert: alle an.
  const [visibleSzenarien, setVisibleSzenarien] = useState<boolean[]>(
    () => mietBenchmark.szenarien.map(() => true),
  );
  // Sicherheitsnetz: falls sich die Anzahl der Szenarien ändert, State
  // entsprechend ausrichten.
  if (visibleSzenarien.length !== mietBenchmark.szenarien.length) {
    setVisibleSzenarien(mietBenchmark.szenarien.map(() => true));
  }
  const toggleSzenario = (idx: number) => {
    setVisibleSzenarien((prev) => prev.map((v, i) => (i === idx ? !v : v)));
  };

  // Band nur anzeigen, wenn das mittlere Szenario aktiv ist.
  const [bandVisible, setBandVisible] = useState(true);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const handleMsciImport = (returns: Record<string, number>) => {
    ctrl.setMietBenchmark((prev) => ({
      ...prev,
      historischeMonatsReturns: {
        ...prev.historischeMonatsReturns,
        ...returns,
      },
    }));
  };

  const importedCount = Object.keys(mb.historischeMonatsReturns ?? {}).length;

  // Gemeinsame Zeitachse: längster Szenario-Horizont ist maßgebend.
  const maxLen = Math.max(
    ...mietBenchmark.szenarien.map((s) => s.monate.length),
    0,
  );
  // Für jedes Szenario werden ZWEI Kurven in den Datensatz geschrieben:
  // `kauf_${idx}` und `miete_${idx}`. Zusätzlich für das mittlere Szenario
  // das ±1σ-Band als Range-Area (`miete_band: [lower, upper]`).
  const mittelIdx = Math.floor(mietBenchmark.szenarien.length / 2);
  type ChartRow = {
    monatIndex: number;
    miete_band?: [number, number];
    [key: string]: number | [number, number] | undefined;
  };
  const chartData: ChartRow[] = [];
  for (let i = 0; i < maxLen; i++) {
    const row: ChartRow = { monatIndex: i };
    mietBenchmark.szenarien.forEach((s, idx) => {
      const monat = s.monate[i];
      if (monat) {
        row[`kauf_${idx}`] = monat.wealthKauf;
        row[`miete_${idx}`] = monat.wealthMieteNetto;
      }
    });
    const midMonat = mietBenchmark.szenarien[mittelIdx]?.monate[i];
    if (midMonat) {
      row.miete_band = [midMonat.wealthMieteNettoLower, midMonat.wealthMieteNettoUpper];
    }
    chartData.push(row);
  }
  const tickInterval = Math.max(1, Math.floor(chartData.length / 8));

  // Heute-Linie
  const [startY, startM] = finanzierung.kredit.startdatum.split("-").map(Number);
  const jetzt = new Date();
  const heuteIdx =
    startY && startM
      ? (jetzt.getFullYear() - startY) * 12 + (jetzt.getMonth() + 1 - startM)
      : -1;
  const heuteSichtbar = heuteIdx >= 0 && heuteIdx < chartData.length;

  // Mittleres Szenario als "typische" Referenz für die KPIs.
  const middleSzenario =
    mietBenchmark.szenarien[Math.floor(mietBenchmark.szenarien.length / 2)] ??
    mietBenchmark.szenarien[0];
  const endMonat = middleSzenario?.monate[middleSzenario.monate.length - 1];

  return (
    <div className="flex flex-col gap-6">
      {/* KPI-Leiste für das mittlere Szenario */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        <KPI
          icon={<Home size={16} />}
          label="Vermögen bei Kauf"
          value={formatEUR(middleSzenario?.endWealthKauf ?? 0)}
          sublabel={`am ${formatMonatJahr(endMonat?.datum ?? null)}`}
        />
        <KPI
          icon={<Landmark size={16} />}
          label="Vermögen bei Miete (netto)"
          value={formatEUR(middleSzenario?.endWealthMieteNetto ?? 0)}
          sublabel={`brutto ${formatEUR(middleSzenario?.endWealthMieteBrutto ?? 0)}`}
          variant="good"
        />
        <KPI
          icon={<TrendingUp size={16} />}
          label="Seed Investment-Pot"
          value={formatEUR(mietBenchmark.seedBetrag)}
          sublabel="EK + Nebenkosten + einm. Ausg. − Einn."
        />
        <KPI
          icon={<Scale size={16} />}
          label="KapSt auf Kursgewinn"
          value={formatEUR(middleSzenario?.kapStBetrag ?? 0)}
          sublabel={`Gewinn ${formatEUR(middleSzenario?.kursgewinn ?? 0)}`}
          variant="warn"
        />
        <KPI
          icon={<Scale size={16} />}
          label={
            middleSzenario?.breakEvenMonat != null
              ? "Break-Even (mittleres Szenario)"
              : "Break-Even"
          }
          value={
            middleSzenario?.breakEvenMonat != null
              ? formatMonatJahr(
                  middleSzenario.monate[middleSzenario.breakEvenMonat]?.datum ?? null,
                )
              : "Kauf niemals vor Miete"
          }
          sublabel="Ab wann ist Kauf überlegen?"
        />
      </div>

      {/* Absolute Vermögenskurven, je Szenario Kauf (solid) + Miete (gestrichelt) */}
      <Card
        title="Vermögen über die Zeit"
        subtitle="Je Szenario: Kauf solid, Miete gestrichelt. Höher ist besser."
        icon={<Scale size={16} />}
        actions={
          <div className="flex flex-wrap items-center gap-1.5">
            {mietBenchmark.szenarien.map((s, idx) => {
              const active = visibleSzenarien[idx];
              const color = SZENARIO_FARBEN[idx % SZENARIO_FARBEN.length];
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleSzenario(idx)}
                  className={
                    "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-medium transition-colors " +
                    (active
                      ? "border-[var(--color-ink-600)] bg-[var(--color-ink-800)] text-[var(--color-ink-100)]"
                      : "border-[var(--color-ink-800)] bg-transparent text-[var(--color-ink-500)]")
                  }
                  title={`${formatEUR(s.jaehrlicheSondertilgung)}/Jahr`}
                >
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: active ? color : "transparent", border: `1px solid ${color}` }}
                  />
                  Szenario {String.fromCharCode(65 + idx)}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setBandVisible((v) => !v)}
              className={
                "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-medium transition-colors " +
                (bandVisible
                  ? "border-[var(--color-ink-600)] bg-[var(--color-ink-800)] text-[var(--color-ink-100)]"
                  : "border-[var(--color-ink-800)] bg-transparent text-[var(--color-ink-500)]")
              }
              title="±1σ-Band um mittleres Szenario"
            >
              {bandVisible ? <Eye size={11} /> : <EyeOff size={11} />}
              Vola-Band
            </button>
          </div>
        }
      >
        <div className="h-80 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="volaBand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5eead4" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#5eead4" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke="#1b1f26"
                strokeDasharray="3 3"
                vertical={false}
              />
              {/* Volatilitäts-Band um das mittlere Szenario, ganz hinten gerendert */}
              {bandVisible && visibleSzenarien[mittelIdx] && (
                <Area
                  type="monotone"
                  dataKey="miete_band"
                  stroke="none"
                  fill="url(#volaBand)"
                  isAnimationActive={false}
                  connectNulls
                  legendType="none"
                  activeDot={false}
                />
              )}
              <XAxis
                dataKey="monatIndex"
                stroke="#5b6370"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
                interval={tickInterval}
                tickFormatter={(i) => {
                  const d = chartData[i as number];
                  return d ? String(startY + Math.floor(Number(i) / 12)) : "";
                }}
              />
              <YAxis
                stroke="#5b6370"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => {
                  const n = Number(v);
                  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(0)}k`;
                  return String(n);
                }}
                width={60}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0b0d10",
                  border: "1px solid #272c35",
                  borderRadius: "8px",
                  fontSize: "11px",
                }}
                labelStyle={{ color: "#8a93a0" }}
                itemStyle={{ color: "#e4e7ec" }}
                labelFormatter={(i) => {
                  const monatsIdx = Number(i);
                  const jahre = Math.floor(monatsIdx / 12);
                  return `Jahr ${jahre}`;
                }}
                formatter={(value: unknown, name: unknown) => {
                  const key = String(name);
                  if (key === "miete_band" && Array.isArray(value)) {
                    return [
                      `${formatEUR(value[0])} – ${formatEUR(value[1])}`,
                      "Miete ±1σ (B)",
                    ];
                  }
                  if (typeof value !== "number") return ["–", key];
                  const [typ, idxStr] = key.split("_");
                  const idx = Number(idxStr ?? 0);
                  const betrag =
                    mietBenchmark.szenarien[idx]?.jaehrlicheSondertilgung ?? 0;
                  const kennung = String.fromCharCode(65 + idx);
                  const label = `${typ === "kauf" ? "Kauf" : "Miete"} ${kennung} (${formatEUR(
                    betrag,
                  )}/J)`;
                  return [formatEUR(value), label];
                }}
              />
              {heuteSichtbar && (
                <ReferenceLine
                  x={heuteIdx}
                  stroke="#f59e0b"
                  strokeWidth={1.5}
                  strokeDasharray="2 3"
                  label={{
                    value: "Heute",
                    position: "insideTopLeft",
                    fill: "#f59e0b",
                    fontSize: 10,
                    offset: 4,
                  }}
                />
              )}
              {mietBenchmark.szenarien.flatMap((_, idx) => {
                if (!visibleSzenarien[idx]) return [];
                const color = SZENARIO_FARBEN[idx % SZENARIO_FARBEN.length];
                return [
                  <Line
                    key={`kauf_${idx}`}
                    type="monotone"
                    dataKey={`kauf_${idx}`}
                    stroke={color}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                    connectNulls
                  />,
                  <Line
                    key={`miete_${idx}`}
                    type="monotone"
                    dataKey={`miete_${idx}`}
                    stroke={color}
                    strokeWidth={1.5}
                    strokeDasharray="5 4"
                    dot={false}
                    isAnimationActive={false}
                    connectNulls
                  />,
                ];
              })}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Linien-Legende (Szenario-Filter sind oben im Card-Header) */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] text-[var(--color-ink-400)]">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-5 bg-[var(--color-ink-200)]" />
            Kauf
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-5 border-t-[1.5px] border-dashed border-[var(--color-ink-200)]" />
            Miete (netto)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-5 rounded-sm bg-[var(--color-accent)]/20" />
            ±1σ (Zukunft)
          </span>
        </div>

        {/* Szenario-Tabelle */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-[var(--color-ink-400)] border-b border-[var(--color-ink-800)]">
                <th className="text-left py-2 font-medium">Szenario</th>
                <th className="text-right py-2 font-medium">Sonder/Jahr</th>
                <th className="text-right py-2 font-medium">Vermögen Kauf</th>
                <th className="text-right py-2 font-medium">Vermögen Miete (netto)</th>
                <th className="text-right py-2 font-medium">Delta</th>
                <th className="text-right py-2 font-medium">KapSt</th>
                <th className="text-right py-2 font-medium">Break-Even</th>
              </tr>
            </thead>
            <tbody>
              {mietBenchmark.szenarien.map((s, idx) => {
                const delta = s.endWealthKauf - s.endWealthMieteNetto;
                const breakEvenDatum =
                  s.breakEvenMonat != null
                    ? s.monate[s.breakEvenMonat]?.datum ?? null
                    : null;
                return (
                  <tr
                    key={idx}
                    className="border-b border-[var(--color-ink-800)]/50 text-[var(--color-ink-200)]"
                  >
                    <td className="py-2">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{
                            backgroundColor:
                              SZENARIO_FARBEN[idx % SZENARIO_FARBEN.length],
                          }}
                        />
                        {String.fromCharCode(65 + idx)}
                      </span>
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {formatEUR(s.jaehrlicheSondertilgung)}
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {formatEUR(s.endWealthKauf)}
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {formatEUR(s.endWealthMieteNetto)}
                    </td>
                    <td
                      className={
                        "py-2 text-right tabular-nums " +
                        (delta >= 0
                          ? "text-[var(--color-accent)]"
                          : "text-[var(--color-warn)]")
                      }
                    >
                      {delta >= 0 ? "+" : ""}
                      {formatEUR(delta)}
                    </td>
                    <td className="py-2 text-right tabular-nums text-[var(--color-ink-400)]">
                      −{formatEUR(s.kapStBetrag)}
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {breakEvenDatum ? formatMonatJahr(breakEvenDatum) : "–"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Eingabe-Parameter */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <MieteEingaben mb={mb} setMietBenchmark={ctrl.setMietBenchmark} />
        <AnnahmenEingaben mb={mb} setMietBenchmark={ctrl.setMietBenchmark} />
      </div>

      {/* MSCI-Import Button */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setImportDialogOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-ink-700)] bg-[var(--color-ink-850)] px-4 py-2.5 text-xs font-medium text-[var(--color-ink-200)] hover:border-[var(--color-accent)]/40 hover:text-[var(--color-accent)] transition-colors"
        >
          <Database size={14} />
          MSCI-Kursdaten aktualisieren
        </button>
        {importedCount > 0 && (
          <span className="text-[10px] text-[var(--color-ink-400)]">
            {importedCount} importierte Monats-Returns aktiv
          </span>
        )}
      </div>

      <MsciImportDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        onImport={handleMsciImport}
      />

      <div className="rounded-lg border border-[var(--color-ink-800)] bg-[var(--color-ink-900)]/40 px-4 py-3 text-[11px] text-[var(--color-ink-400)] leading-relaxed">
        <strong className="text-[var(--color-ink-200)]">
          Methodik (Lump-Sum-DCA in den MSCI World):
        </strong>{" "}
        Der Miet-Pot startet mit Eigenkapital + Nebenkosten + einmaligen
        Ausgaben − einmaligen Einnahmen – das ist die erste große Lump-
        Sum-Tranche, die sofort im MSCI World angelegt wird. Jeden Folge-
        Monat wird der Pot zunächst mit dem MSCI-World-Monatsreturn
        verzinst und anschließend um den Cash-Delta angepasst:{" "}
        <strong className="text-[var(--color-accent)]">
          Käufer-Spend (Rate + Sondertilgung + laufende Kosten) −
          Mieter-Spend (inflationierte Warmmiete)
        </strong>
        . Ist der Delta positiv, fließt der Überschuss als neue DCA-Tranche
        in den Pot, ist er negativ, wird die Lücke aus dem Pot entnommen.
        Der Kauf-Wert ist Hauswert (mit Wertsteigerung) minus Restschuld.
        Der Eigenheim-Verkauf ist bei Eigennutzung steuerfrei; auf den
        Kursgewinn des Miet-Pots wird Kapitalertragsteuer (
        {mb.kapitalertragsteuerProzent.toLocaleString("de-DE")} %) angesetzt
        und separat ausgewiesen.
        <br />
        <br />
        <strong className="text-[var(--color-ink-200)]">
          MSCI-Daten & Zukunft:
        </strong>{" "}
        Für jeden Monat zwischen Kreditstart und heute werden die{" "}
        <em className="text-[var(--color-ink-300)]">tatsächlichen</em>{" "}
        Monatsrenditen des{" "}
        <code className="mx-0.5">iShares MSCI World EUR Hedged UCITS ETF</code>
        {" "}(ISIN IE00B441G979) aus Börse.de-Schlusskursen verwendet (2025 + 2026
        vollständig, die Jahre 2020–2024 als Jahres-Fallback aus dem offiziellen
        MSCI-Factsheet). Hinterlegt in{" "}
        <code className="mx-0.5">src/config/msciWorld.ts</code> – neue Monate
        lassen sich dort einfach ergänzen. Ab dem letzten bekannten Monat
        läuft der Pot mit der Annahme-Rendite weiter, und dort öffnet sich
        das ±1σ-Band (log-normal,
        <code className="mx-1">× exp(±σ · √(Jahre seit heute))</code>).
        Hinweis: Der hedged Fund blendet das EUR/USD-Währungsrisiko aus –
        bewusste Wahl für einen Anleger, der kein Fremdwährungs-Exposure
        trägt.
        <br />
        <br />
        <strong className="text-[var(--color-ink-200)]">
          Sondertilgung als Absicherung:
        </strong>{" "}
        Die Kauf-Kurve ist risk-free (Tilgung spart garantiert Zinsen, das
        Haus verzinst sich mit der gesetzten Wertsteigerung), die Miet-Kurve
        trägt das volle Marktrisiko des Pots. Je nachdem wo dein Risikoprofil
        liegt, kann die Sondertilgungs-Disziplin auch gegen ungünstige
        Marktphasen absichern – nicht nur Rendite kosten.
      </div>
    </div>
  );
}

// =============================================================================
// Sub-Components
// =============================================================================

interface EingabenProps {
  mb: MietBenchmarkTyp;
  setMietBenchmark: (u: (prev: MietBenchmarkTyp) => MietBenchmarkTyp) => void;
}

function MieteEingaben({ mb, setMietBenchmark }: EingabenProps) {
  return (
    <Card
      title="Miet-Szenario"
      subtitle="Was würdest du stattdessen zahlen?"
      icon={<Home size={16} />}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <InputField
          label="Kaltmiete monatlich"
          type="number"
          min={0}
          suffix="EUR"
          value={mb.monatlicheKaltmiete || ""}
          onChange={(e) =>
            setMietBenchmark((p) => ({
              ...p,
              monatlicheKaltmiete: Number(e.target.value) || 0,
            }))
          }
        />
        <InputField
          label="Nebenkosten monatlich"
          type="number"
          min={0}
          suffix="EUR"
          value={mb.monatlicheNebenkosten || ""}
          onChange={(e) =>
            setMietBenchmark((p) => ({
              ...p,
              monatlicheNebenkosten: Number(e.target.value) || 0,
            }))
          }
          hint="Warmmiete-Komponenten wie Heizung, Wasser, Hausgeld"
        />
        <InputField
          label="Mietpreisinflation p.a."
          type="number"
          min={0}
          step="0.1"
          suffix="%"
          value={mb.mietpreisInflationProzent || ""}
          onChange={(e) =>
            setMietBenchmark((p) => ({
              ...p,
              mietpreisInflationProzent: Number(e.target.value) || 0,
            }))
          }
        />
      </div>
    </Card>
  );
}

function AnnahmenEingaben({ mb, setMietBenchmark }: EingabenProps) {
  return (
    <Card
      title="Annahmen"
      subtitle="Rendite, Wertsteigerung, Instandhaltung, Steuer"
      icon={<TrendingUp size={16} />}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <InputField
          label="Rendite Kapitalanlage p.a."
          type="number"
          min={0}
          step="0.1"
          suffix="%"
          value={mb.renditeProzent || ""}
          onChange={(e) =>
            setMietBenchmark((p) => ({
              ...p,
              renditeProzent: Number(e.target.value) || 0,
            }))
          }
          hint="Brutto – KapSt wird am Ende gerechnet"
        />
        <InputField
          label="Volatilität σ p.a."
          type="number"
          min={0}
          step="0.5"
          suffix="%"
          value={mb.renditeVolatilitaetProzent || ""}
          onChange={(e) =>
            setMietBenchmark((p) => ({
              ...p,
              renditeVolatilitaetProzent: Number(e.target.value) || 0,
            }))
          }
          hint="±1σ-Band der Rendite. Breit gestreute Aktien ≈ 15 %"
        />
        <InputField
          label="Wertsteigerung Immobilie p.a."
          type="number"
          step="0.1"
          suffix="%"
          value={mb.wertsteigerungProzent || ""}
          onChange={(e) =>
            setMietBenchmark((p) => ({
              ...p,
              wertsteigerungProzent: Number(e.target.value) || 0,
            }))
          }
          hint="Langfristiger Schnitt DE: 2–3 %"
        />
        <InputField
          label="Instandhaltung p.a."
          type="number"
          min={0}
          step="0.1"
          suffix="% vom Kaufpreis"
          value={mb.instandhaltungProzent || ""}
          onChange={(e) =>
            setMietBenchmark((p) => ({
              ...p,
              instandhaltungProzent: Number(e.target.value) || 0,
            }))
          }
          hint="Rücklage für Reparaturen, Renovierung"
        />
        <InputField
          label="Kapitalertragsteuer"
          type="number"
          min={0}
          step="0.001"
          suffix="%"
          value={mb.kapitalertragsteuerProzent || ""}
          onChange={(e) =>
            setMietBenchmark((p) => ({
              ...p,
              kapitalertragsteuerProzent: Number(e.target.value) || 0,
            }))
          }
          hint="25 % Abgeltung + 5,5 % Soli = 26,375 %"
        />
      </div>
    </Card>
  );
}

// =============================================================================
// KPI-Kachel (inline, leicht angepasst)
// =============================================================================

interface KPIProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel?: string;
  variant?: "default" | "warn" | "good";
}

function KPI({ icon, label, value, sublabel, variant = "default" }: KPIProps) {
  const valueColor =
    variant === "warn"
      ? "text-[var(--color-warn)]"
      : variant === "good"
      ? "text-[var(--color-accent)]"
      : "text-[var(--color-ink-50)]";
  return (
    <div className="rounded-xl border border-[var(--color-ink-700)] bg-[var(--color-ink-850)] px-3.5 py-2.5 min-w-0 transition-colors hover:border-[var(--color-ink-600)]">
      <div className="flex items-center gap-1.5 text-[var(--color-ink-400)]">
        <span className="text-[var(--color-accent)]">{icon}</span>
        <span className="text-[9px] uppercase tracking-wider font-medium truncate">
          {label}
        </span>
      </div>
      <div className={`mt-1 text-sm font-semibold tabular-nums truncate ${valueColor}`}>
        {value}
      </div>
      {sublabel && (
        <div className="text-[10px] text-[var(--color-ink-500)] mt-0.5 truncate">
          {sublabel}
        </div>
      )}
    </div>
  );
}
