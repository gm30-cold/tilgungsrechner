// Hauptgrafik: Restschuld über die Zeit.
// - Baseline (ohne geplante Sondertilgungen)
// - Mit Sondertilgungen
// - Visueller Cut bei Ende Zinsbindung (ReferenceLine + Shading)

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { FinanzierungController } from "../../hooks/useFinanzierung";
import { Card } from "../ui/Card";
import { TrendingDown } from "lucide-react";
import { formatEUR, formatMonatJahr } from "../../utils/format";

interface Props {
  ctrl: FinanzierungController;
}

interface ChartPoint {
  datum: string;
  jahr: number;
  monatIndex: number;
  mitSonder: number | null;
  ohneSonder: number | null;
}

export function RestschuldVerlauf({ ctrl }: Props) {
  const { plan, baseline, finanzierung: f } = ctrl;

  // Monate beider Pläne auf eine gemeinsame Zeitachse legen.
  const maxLen = Math.max(plan.monate.length, baseline.monate.length);
  const data: ChartPoint[] = [];
  for (let i = 0; i < maxLen; i++) {
    const m = plan.monate[i];
    const b = baseline.monate[i];
    data.push({
      datum: m?.datum ?? b?.datum ?? "",
      jahr: m?.jahr ?? b?.jahr ?? 0,
      monatIndex: i,
      mitSonder: m?.restschuld ?? null,
      ohneSonder: b?.restschuld ?? null,
    });
  }

  const zinsbindungEndeIdx = f.kredit.zinsbindungJahre * 12;
  const zinsbindungEndeDatum =
    data[Math.min(zinsbindungEndeIdx - 1, data.length - 1)]?.datum;

  // Heute-Linie: Monats-Index vom Kreditstart bis zum aktuellen Monat.
  const [startY, startM] = f.kredit.startdatum.split("-").map(Number);
  const jetzt = new Date();
  const heuteIdx =
    startY && startM
      ? (jetzt.getFullYear() - startY) * 12 + (jetzt.getMonth() + 1 - startM)
      : -1;
  const heuteSichtbar = heuteIdx >= 0 && heuteIdx < data.length;

  const tickInterval = Math.max(1, Math.floor(data.length / 8));

  return (
    <Card
      title="Restschuld-Verlauf"
      subtitle="Mit vs. ohne geplante Sondertilgungen"
      icon={<TrendingDown size={16} />}
    >
      <div className="h-80 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="mitSonderLine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#5eead4" />
                <stop offset="100%" stopColor="#14b8a6" />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke="#1b1f26"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="monatIndex"
              stroke="#5b6370"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
              interval={tickInterval}
              tickFormatter={(i) => {
                const d = data[i];
                return d ? String(d.jahr) : "";
              }}
            />
            <YAxis
              stroke="#5b6370"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
              tickFormatter={(v) =>
                v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
              }
              width={55}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0b0d10",
                border: "1px solid #272c35",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "#8a93a0" }}
              itemStyle={{ color: "#e4e7ec" }}
              labelFormatter={(i) => formatMonatJahr(data[i as number]?.datum ?? null)}
              formatter={(value: unknown, name: unknown) => [
                formatEUR(typeof value === "number" ? value : 0),
                name === "mitSonder" ? "Mit Sondertilgung" : "Baseline",
              ]}
            />

            {/* Anschlussfinanzierungs-Phase visuell abgesetzt */}
            {zinsbindungEndeIdx < data.length && (
              <ReferenceArea
                x1={zinsbindungEndeIdx}
                x2={data.length - 1}
                fill="#5eead4"
                fillOpacity={0.04}
              />
            )}
            {zinsbindungEndeDatum && (
              <ReferenceLine
                x={zinsbindungEndeIdx}
                stroke="#5eead4"
                strokeDasharray="4 4"
                strokeOpacity={0.5}
                label={{
                  value: "Anschluss",
                  position: "insideTopRight",
                  fill: "#5eead4",
                  fontSize: 10,
                }}
              />
            )}

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

            <Line
              type="monotone"
              dataKey="ohneSonder"
              stroke="#5b6370"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              name="Baseline"
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="mitSonder"
              stroke="url(#mitSonderLine)"
              strokeWidth={2.5}
              dot={false}
              name="Mit Sondertilgung"
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <Legende />
    </Card>
  );
}

function Legende() {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-[var(--color-ink-400)] shrink-0">
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-0.5 w-4 bg-[var(--color-accent)]" />
        Mit Sondertilgung
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-0.5 w-4 border-t border-dashed border-[var(--color-ink-400)]" />
        Baseline
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-3 rounded-sm bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/40" />
        Anschlussfinanzierung
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-0.5 w-4 border-t-[1.5px] border-dashed border-[var(--color-amber)]" />
        Heute
      </span>
    </div>
  );
}
