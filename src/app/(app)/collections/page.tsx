import Link from "next/link";
import { Wallet, AlertTriangle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { clientDisplayName, formatCurrency, formatDate, daysUntil } from "@/lib/format";
import { toneClass } from "@/lib/status-colors";
import { MarkPaidCell } from "./collections-actions-cell";

export default async function CollectionsPage() {
  const payments = await prisma.policyPayment.findMany({
    where: { status: "PENDING" },
    orderBy: { dueDate: "asc" },
    include: { policy: { include: { client: true, insurer: true } } },
  });

  const totalPending = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const overdue = payments.filter((p) => daysUntil(p.dueDate) < 0);
  const dueSoon = payments.filter((p) => {
    const d = daysUntil(p.dueDate);
    return d >= 0 && d <= 7;
  });
  const totalOverdue = overdue.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalDueSoon = dueSoon.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Cobros</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Total pendiente" value={formatCurrency(totalPending)} sub={`${payments.length} cuota(s)`} icon={Wallet} color="blue" />
        <StatCard
          label="Vencido"
          value={formatCurrency(totalOverdue)}
          sub={`${overdue.length} cuota(s)`}
          icon={AlertTriangle}
          color="rose"
        />
        <StatCard
          label="Por vencer (7 días)"
          value={formatCurrency(totalDueSoon)}
          sub={`${dueSoon.length} cuota(s)`}
          icon={Clock}
          color="amber"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Póliza</TableHead>
                <TableHead>Aseguradora</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Vence</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No hay cobros pendientes.
                  </TableCell>
                </TableRow>
              )}
              {payments.map((payment) => {
                const days = daysUntil(payment.dueDate);
                const tone = days < 0 ? "rose" : days <= 7 ? "amber" : "blue";
                return (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <Link href={`/clients/${payment.policy.clientId}`} className="underline-offset-2 hover:underline">
                        {clientDisplayName(payment.policy.client)}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/policies/${payment.policyId}`} className="underline-offset-2 hover:underline">
                        {payment.policy.policyNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{payment.policy.insurer.name}</TableCell>
                    <TableCell>{formatCurrency(payment.amount.toString())}</TableCell>
                    <TableCell>
                      <Badge className={toneClass(tone)}>
                        {formatDate(payment.dueDate)}
                        {days < 0 ? ` · ${Math.abs(days)}d vencido` : ""}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <MarkPaidCell policyId={payment.policyId} paymentId={payment.id} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

const STAT_CARD_COLORS = {
  blue: { bg: "bg-blue-100", text: "text-blue-600" },
  amber: { bg: "bg-amber-100", text: "text-amber-600" },
  rose: { bg: "bg-rose-100", text: "text-rose-600" },
} as const;

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  icon: typeof Wallet;
  color: keyof typeof STAT_CARD_COLORS;
}) {
  const palette = STAT_CARD_COLORS[color];
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-2 p-4">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-1 text-xl font-semibold">{value}</p>
          <p className="text-xs text-muted-foreground">{sub}</p>
        </div>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${palette.bg} ${palette.text}`}>
          <Icon className="h-4 w-4" />
        </span>
      </CardContent>
    </Card>
  );
}
