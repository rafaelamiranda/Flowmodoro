"use client";

import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatDay, formatDuration } from "@/lib/format";
import type { DayBucket } from "./aggregate";

export type Slice = { name: string; value: number; color: string };

const tip = {
  contentStyle: { background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, color: "var(--fg)" },
  itemStyle: { color: "var(--fg)" },
  labelStyle: { color: "var(--muted)" },
};

export function DonutChart({ data }: { data: Slice[] }) {
  return (
    <div className="h-56 w-full" role="img" aria-label="Distribuição do tempo focado por tarefa">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="88%" paddingAngle={data.length > 1 ? 2 : 0} stroke="none">
            {data.map((d) => <Cell key={d.name} fill={d.color} />)}
          </Pie>
          <Tooltip {...tip} formatter={(v) => formatDuration(Number(v))} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DayBars({ data }: { data: DayBucket[] }) {
  const rows = data.map((d) => ({ label: formatDay(d.dayStart), min: Math.round(d.focusMs / 60_000), ms: d.focusMs }));
  return (
    <div className="h-56 w-full" role="img" aria-label="Tempo focado por dia">
      <ResponsiveContainer>
        <BarChart data={rows} margin={{ left: -16, right: 4, top: 4 }}>
          <XAxis dataKey="label" tick={{ fill: "var(--muted)", fontSize: 11 }} interval="preserveStartEnd" axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "var(--muted)", fontSize: 11 }} axisLine={false} tickLine={false} unit="m" />
          <Tooltip {...tip} cursor={{ fill: "var(--soft)" }} formatter={(_v, _n, p) => [formatDuration((p.payload as { ms: number }).ms), "Foco"]} />
          <Bar dataKey="min" fill="var(--primary)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
