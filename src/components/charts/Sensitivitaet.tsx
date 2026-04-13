// Sensitivitätsvergleich: Was passiert bei unterschiedlichen jährlichen
// Sondertilgungsbeträgen? Zeigt Linien übereinander + eine Vergleichstabelle.

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "../ui/Card";
import { Scale } from "lucide-react";
import { formatEUR, formatMonatJahr } from "../../utils/format";
import type { FinanzierungController } from "../../hooks/useFinanzierung";

interface Props {
  ctrl: FinanzierungController;
}

const COLORS = ["#5b6370", "#5eead4", "#f59e0b", "#f43f5e"];

export function Sensitivitaet({ ctrl }: Props) {
  const { sensitivitaet, finanzierung: f } = ctrl;

  const maxLen = Math.max(...sensitivitaet.map((s) => s.plan.monate.length), 0);

  // Gemeinsame Zeitachse
  const data: Record<string, number | null>[] = [];
  for (let i = 0; i < maxLen; i++) {
    const row: Record<string, number | null> = { monatIndex: i };
    sensitivitaet.forEach((s, idx) => {
      row[`szenario_${idx}`] = s.plan.monate[i]?.restschuld ?? null;
    });
    data.push(row);
  }

  const tickInterval = Math.max(1, Math.floor(data.length / 8));
  const baselineZinsen = sensitivitaet[0]?.plan.gesamtzinsen ?? 0;

  // Heute-Linie: gleicher Monats-Index wie im Restschuld-Chart.
  const [startY, startM] = f.kredit.startdatum.split("-").map(Number);
  const jetzt = new Date();
  const heuteIdx =
    startY && startM
      ? (jetzt.getFullYear() - startY) * 12 + (jetzt.getMonth() + 1 - startM)
      : -1;
  const heuteSichtbar = heuteIdx >= 0 && heuteIdx < data.length;

  return (
    <Card
      title="Sensitivitätsanalyse"
      subtitle="Wie beeinflussen Sondertilgungen die Laufzeit?"
      icon={<Scale size={18} />}
    >
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid stroke="#1b1f26" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="monatIndex"
              stroke="#5b6370"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
              interval={tickInterval}
              tickFormatter={(i) => {
                const months = i as number;
                return String(Math.floor(months / 12));
              }}
              label={{
                value: "Jahre",
                position: "insideBottomRight",
                fill: "#5b6370",
                fontSize: 10,
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
              labelFormatter={(i) => `Monat ${i}`}
              formatter={(value: unknown, name: unknown) => {
                const num = typeof value === "number" ? value : 0;
                const idx = Number(String(name).split("_")[1] ?? 0);
                const betrag = sensitivitaet[idx]?.jaehrlicheSondertilgung ?? 0;
                return [formatEUR(num), `${formatEUR(betrag)}/Jahr`];
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
            {sensitivitaet.map((_, idx) => (
              <Line
                key={idx}
                type="monotone"
                dataKey={`szenario_${idx}`}
                stroke={COLORS[idx % COLORS.length]}
                strokeWidth={idx === 0 ? 1.5 : 2}
                strokeDasharray={idx === 0 ? "4 4" : undefined}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-[var(--color-ink-400)] border-b border-[var(--color-ink-800)]">
              <th className="text-left py-2 font-medium">Szenario</th>
              <th className="text-right py-2 font-medium">Sondertilgung/Jahr</th>
              <th className="text-right py-2 font-medium">Laufzeit</th>
              <th className="text-right py-2 font-medium">Gesamtzinsen</th>
              <th className="text-right py-2 font-medium">Ersparnis</th>
            </tr>
          </thead>
          <tbody>
            {sensitivitaet.map((s, idx) => {
              const zinsErsparnis = baselineZinsen - s.plan.gesamtzinsen;
              return (
                <tr
                  key={idx}
                  className="border-b border-[var(--color-ink-800)]/50 text-[var(--color-ink-200)]"
                >
                  <td className="py-2 flex items-center gap-2">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    {String.fromCharCode(65 + idx)}
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {formatEUR(s.jaehrlicheSondertilgung)}
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {formatMonatJahr(s.plan.abzahlungsEndeDatum)}
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {formatEUR(s.plan.gesamtzinsen)}
                  </td>
                  <td
                    className={`py-2 text-right tabular-nums ${
                      zinsErsparnis > 0
                        ? "text-[var(--color-accent)]"
                        : "text-[var(--color-ink-500)]"
                    }`}
                  >
                    {zinsErsparnis > 0 ? `− ${formatEUR(zinsErsparnis)}` : "–"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
