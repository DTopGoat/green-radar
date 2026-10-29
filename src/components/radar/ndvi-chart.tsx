import { useEffect, useState } from "react";
import type { Observation } from "@/lib/radar/types";

export function NdviChart({ series }: { series: Observation[] }) {
  const [charts, setCharts] = useState<typeof import("recharts") | null>(null);

  useEffect(() => {
    let live = true;
    void import("recharts").then((mod) => {
      if (live) setCharts(mod);
    });
    return () => {
      live = false;
    };
  }, []);

  if (!series.length) {
    return <p className="text-sm text-muted">No clear Sentinel-2 date for this site yet.</p>;
  }

  if (!charts) return <div className="h-56" aria-hidden />;

  const { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } = charts;
  const rows = series.map((row) => ({
    date: row.date.slice(2),
    median: row.medianNdvi,
    min: row.minNdvi,
    span: row.maxNdvi != null && row.minNdvi != null ? row.maxNdvi - row.minNdvi : null,
  }));

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--color-line)" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: "var(--color-muted)", fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis
            domain={[-0.1, 1]}
            width={36}
            tick={{ fill: "var(--color-muted)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-cloud)",
              border: "1px solid var(--color-line)",
              borderRadius: 12,
              color: "var(--color-ink)",
              fontSize: 12,
            }}
          />
          <Area dataKey="min" stackId="band" stroke="none" fill="transparent" />
          <Area dataKey="span" stackId="band" stroke="none" fill="var(--color-pine)" fillOpacity={0.18} />
          <Line dataKey="median" name="Median NDVI" stroke="var(--color-pine)" strokeWidth={2} dot={{ r: 3 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
