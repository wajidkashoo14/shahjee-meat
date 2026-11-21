"use client";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatJpy } from "@/lib/utils";

type Point = { date: string; total: number };

const tick = { fontSize: 12, fill: "var(--foreground-muted)" };
const compactYen = (v: number) => (v >= 1000 ? `¥${Math.round(v / 1000).toLocaleString()}K` : `¥${v}`);

function RevenueTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value?: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 shadow-[var(--shadow-overlay)]">
      <p className="text-sm font-bold tabular-nums text-foreground">{formatJpy(Number(payload[0].value ?? 0))}</p>
      <p className="flex items-center gap-1.5 text-xs text-foreground-muted">
        <span className="inline-block h-0.5 w-3 rounded-full bg-chart-1" aria-hidden />
        Revenue · {label}
      </p>
    </div>
  );
}

/** Single-series daily revenue. Styled per the design system: chart-1 line, 10% wash, hairline grid. */
export function RevenueChart({ series }: { series: Point[] }) {
  return (
    <figure>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={series} margin={{ top: 12, right: 8, left: 4, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeWidth={1} />
          <XAxis
            dataKey="date"
            tick={tick}
            tickFormatter={(d: string) => d.slice(5).replace("-", "/")}
            axisLine={false}
            tickLine={false}
            tickMargin={8}
            minTickGap={24}
          />
          <YAxis tick={tick} tickFormatter={compactYen} axisLine={false} tickLine={false} width={64} />
          <Tooltip content={<RevenueTooltip />} cursor={{ stroke: "var(--foreground-muted)", strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="total"
            stroke="var(--chart-1)"
            strokeWidth={2}
            fill="var(--chart-1)"
            fillOpacity={0.1}
            activeDot={{ r: 4, fill: "var(--chart-1)", stroke: "var(--surface)", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
      <table className="sr-only">
        <caption>Daily revenue</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Revenue</th>
          </tr>
        </thead>
        <tbody>
          {series.map((p) => (
            <tr key={p.date}>
              <td>{p.date}</td>
              <td>{formatJpy(p.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
