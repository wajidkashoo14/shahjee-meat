"use client";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatJpy } from "@/lib/utils";

export function RevenueChart({ series }: { series: Array<{ date: string; total: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-ember)" stopOpacity={0.4} />
            <stop offset="95%" stopColor="var(--color-ember)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--foreground-muted)" }} tickFormatter={(d) => d.slice(5)} />
        <YAxis tick={{ fontSize: 11, fill: "var(--foreground-muted)" }} tickFormatter={(v) => `¥${(v / 1000).toFixed(0)}k`} />
        <Tooltip
          formatter={(value) => formatJpy(Number(value ?? 0))}
          contentStyle={{ background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
        />
        <Area type="monotone" dataKey="total" stroke="var(--color-ember)" fill="url(#revenue)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
