// Gestapeltes Flächendiagramm: Zinsanteil vs. Tilgungsanteil pro Jahr.
// Zeigt wie sich die Verteilung über die Laufzeit verschiebt.

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "../ui/Card";
import { BarChart3 } from "lucide-react";
import { formatEUR } from "../../utils/format";
import type { FinanzierungController } from "../../hooks/useFinanzierung";

interface Props {
  ctrl: FinanzierungController;
}

interface YearPoint {
  jahr: number;
  zins: number;
  tilgung: number;
}

export function ZinsTilgungAufteilung({ ctrl }: Props) {
  const { plan } = ctrl;

  // Monate zu Jahren aggregieren
  const byJahr = new Map<number, YearPoint>();
  for (const m of plan.monate) {
    const existing = byJahr.get(m.jahr);
    if (existing) {
      existing.zins += m.zinsanteil;
      existing.tilgung += m.tilgungsanteil + m.sondertilgung;
    } else {
      byJahr.set(m.jahr, {
        jahr: m.jahr,
        zins: m.zinsanteil,
        tilgung: m.tilgungsanteil + m.sondertilgung,
      });
    }
  }
  const data = Array.from(byJahr.values()).sort((a, b) => a.jahr - b.jahr);

  return (
    <Card
      title="Zins / Tilgung"
      subtitle="Aufteilung deiner jährlichen Zahlungen"
      icon={<BarChart3 size={16} />}
      fill
    >
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="zinsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="tilgungFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5eead4" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#5eead4" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1b1f26" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="jahr"
              stroke="#5b6370"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
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
              formatter={(value: unknown, name: unknown) => [
                formatEUR(typeof value === "number" ? value : 0),
                name === "zins" ? "Zinsen" : "Tilgung",
              ]}
            />
            <Area
              type="monotone"
              dataKey="zins"
              stackId="1"
              stroke="#f43f5e"
              strokeWidth={1.5}
              fill="url(#zinsFill)"
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="tilgung"
              stackId="1"
              stroke="#5eead4"
              strokeWidth={1.5}
              fill="url(#tilgungFill)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex items-center gap-4 text-[10px] text-[var(--color-ink-400)] shrink-0">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[var(--color-warn)]/40" />
          Zinsen
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[var(--color-accent)]/40" />
          Tilgung
        </span>
      </div>
    </Card>
  );
}
