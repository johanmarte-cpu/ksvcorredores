"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/format";

const COLORS = ["#3b82f6", "#f59e0b", "#8b5cf6", "#f43f5e", "#10b981", "#06b6d4"];
const OTHER_COLOR = "#94a3b8";

const compactCurrency = new Intl.NumberFormat("es-DO", {
  style: "currency",
  currency: "DOP",
  notation: "compact",
  maximumFractionDigits: 1,
});

export type InsurerRow = { insurerId: string; name: string; count: number; premium: number };

type Metric = "count" | "premium";

export function InsurerBreakdown({ rows }: { rows: InsurerRow[] }) {
  const [metric, setMetric] = useState<Metric>("count");

  const sorted = [...rows].sort((a, b) => b[metric] - a[metric]);
  const top = sorted.slice(0, 5);
  const otherTotal = sorted.slice(5).reduce((sum, r) => sum + r[metric], 0);
  const grandTotal = sorted.reduce((sum, r) => sum + r[metric], 0);
  const format = (value: number) => (metric === "premium" ? formatCurrency(value) : value.toLocaleString("es-DO"));

  const segments = [
    ...top.map((row, i) => ({ label: row.name, value: row[metric], color: COLORS[i % COLORS.length] })),
    ...(otherTotal > 0 ? [{ label: "Otras", value: otherTotal, color: OTHER_COLOR }] : []),
  ];

  let cumulative = 0;
  const stops = segments.map((s) => {
    const start = (cumulative / (grandTotal || 1)) * 100;
    cumulative += s.value;
    const end = (cumulative / (grandTotal || 1)) * 100;
    return `${s.color} ${start}% ${end}%`;
  });
  const gradient = stops.length > 0 ? `conic-gradient(${stops.join(", ")})` : "var(--muted)";

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-md bg-muted p-0.5 text-xs">
        <button
          type="button"
          onClick={() => setMetric("count")}
          className={`flex-1 rounded-sm px-2 py-1 font-medium transition-colors ${
            metric === "count" ? "bg-background shadow-sm" : "text-muted-foreground"
          }`}
        >
          Pólizas
        </button>
        <button
          type="button"
          onClick={() => setMetric("premium")}
          className={`flex-1 rounded-sm px-2 py-1 font-medium transition-colors ${
            metric === "premium" ? "bg-background shadow-sm" : "text-muted-foreground"
          }`}
        >
          Prima activa
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin datos aún.</p>
      ) : (
        <div className="flex items-center gap-5">
          <div className="relative h-28 w-28 shrink-0 rounded-full" style={{ background: gradient }}>
            <div className="absolute inset-[13%] flex flex-col items-center justify-center rounded-full bg-card px-1 text-center shadow-sm">
              <span className="text-sm leading-none font-semibold">
                {metric === "premium" ? compactCurrency.format(grandTotal) : grandTotal.toLocaleString("es-DO")}
              </span>
              <span className="mt-1.5 text-[10px] text-muted-foreground">{metric === "premium" ? "Prima total" : "Pólizas"}</span>
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-2 text-sm">
            {segments.map((s) => (
              <div key={s.label} className="flex items-center justify-between gap-3" title={`${s.label}: ${format(s.value)}`}>
                <span className="flex min-w-0 items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="truncate">{s.label}</span>
                </span>
                <span className="shrink-0 font-medium">{format(s.value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
