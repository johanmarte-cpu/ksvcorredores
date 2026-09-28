import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

export function CollectionsSummary({
  totalPending,
  totalOverdue,
  overdueCount,
}: {
  totalPending: number;
  totalOverdue: number;
  overdueCount: number;
}) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Cobros</CardTitle>
        <Link
          href="/collections"
          className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          Ver todo <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-center gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Pendiente por cobrar</p>
          <p className="mt-1 text-xl font-semibold">{formatCurrency(totalPending)}</p>
        </div>
        <div className="border-t pt-4">
          <p className="text-xs text-muted-foreground">Vencido{overdueCount > 0 ? ` · ${overdueCount} cuota(s)` : ""}</p>
          <p className={`mt-1 text-xl font-semibold ${totalOverdue > 0 ? "text-destructive" : ""}`}>
            {formatCurrency(totalOverdue)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
