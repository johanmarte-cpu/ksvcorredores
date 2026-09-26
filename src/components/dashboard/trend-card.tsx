"use client";

import { useState } from "react";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthlyBarChart } from "@/components/reports/monthly-bar-chart";
import { formatCurrency } from "@/lib/format";

type Series = "premiums" | "commissions";

export function TrendCard({
  premiums,
  commissions,
}: {
  premiums: { label: string; value: number }[];
  commissions: { label: string; value: number }[];
}) {
  const [series, setSeries] = useState<Series>("premiums");
  const data = series === "premiums" ? premiums : commissions;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tendencia (últimos 6 meses)</CardTitle>
        <CardAction>
          <div className="flex gap-1 rounded-md bg-muted p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setSeries("premiums")}
              className={`rounded-sm px-2 py-1 font-medium transition-colors ${
                series === "premiums" ? "bg-background shadow-sm" : "text-muted-foreground"
              }`}
            >
              Primas
            </button>
            <button
              type="button"
              onClick={() => setSeries("commissions")}
              className={`rounded-sm px-2 py-1 font-medium transition-colors ${
                series === "commissions" ? "bg-background shadow-sm" : "text-muted-foreground"
              }`}
            >
              Comisiones
            </button>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        <MonthlyBarChart
          data={data}
          color={series === "premiums" ? "var(--brand-blue)" : "var(--brand-green)"}
          formatValue={(v) => formatCurrency(v)}
        />
      </CardContent>
    </Card>
  );
}
