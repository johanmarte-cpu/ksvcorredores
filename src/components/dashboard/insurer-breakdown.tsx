"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/format";

const DOT_COLORS = ["bg-blue-500", "bg-amber-500", "bg-violet-500", "bg-rose-500", "bg-emerald-500", "bg-cyan-500"];

export type InsurerRow = { insurerId: string; name: string; count: number; premium: number };

type Metric = "count" | "premium";

export function InsurerBreakdown({ rows }: { rows: InsurerRow[] }) {
  const [metric, setMetric] = useState<Metric>("count");

  const sorted = [...rows].sort((a, b) => b[metric] - a[metric]);
  const top = sorted.slice(0, 5);
  const otherTotal = sorted.slice(5).reduce((sum, r) => sum + r[metric], 0);
  const grandTotal = sorted.reduce((sum, r) => sum + r[metric], 0) || 1;
  const max = Math.max(1, ...sorted.map((r) => r[metric]));
  const format = (value: number) => (metric === "premium" ? formatCurrency(value) : value.toLocaleString("es-DO"));

  return (
    <div className="space-y-3">
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

      {rows.length === 0 && <p className="text-sm text-muted-foreground">Sin datos aún.</p>}

      {top.map((row, index) => {
        const pct = (row[metric] / grandTotal) * 100;
        return (
          <div key={row.insurerId} className="space-y-1" title={`${row.name}: ${format(row[metric])} (${pct.toFixed(0)}%)`}>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className={`h-2 w-2 shrink-0 rounded-full ${DOT_COLORS[index % DOT_COLORS.length]}`} />
                {row.name}
              </span>
              <span className="font-medium">{format(row[metric])}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all ${DOT_COLORS[index % DOT_COLORS.length]}`}
                style={{ width: `${(row[metric] / max) * 100}%` }}
              />
            </div>
          </div>
        );
      })}

      {otherTotal > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-full bg-slate-400" />
            Otras
          </span>
          <span className="font-medium">{format(otherTotal)}</span>
        </div>
      )}
    </div>
  );
}
