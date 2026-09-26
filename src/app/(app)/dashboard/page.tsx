import Link from "next/link";
import { ShieldCheck, RefreshCw, FileText, AlertTriangle, Wallet, Percent, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { formatCurrency, formatDate, clientDisplayName } from "@/lib/format";

// Colores por categoría (identidad fija por tarjeta, nunca por rango de valor).
const INSURER_DOT_COLORS = ["bg-blue-500", "bg-amber-500", "bg-violet-500", "bg-rose-500", "bg-emerald-500", "bg-cyan-500"];

export default async function DashboardPage() {
  const session = await auth();
  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [
    activePolicies,
    expiringPolicies,
    pendingQuotes,
    openClaims,
    premiumsThisMonth,
    commissionsThisMonth,
    upcomingRenewals,
    byInsurer,
  ] = await Promise.all([
    prisma.policy.count({ where: { status: "ACTIVE" } }),
    prisma.policy.count({ where: { status: "ACTIVE", endDate: { gte: now, lte: in30 } } }),
    prisma.quote.count({ where: { status: { in: ["DRAFT", "SENT", "IN_REVIEW", "COMPARED"] } } }),
    prisma.claim.count({ where: { status: { notIn: ["CLOSED", "PAID", "REJECTED"] } } }),
    prisma.policyPayment.aggregate({
      _sum: { amount: true },
      where: { status: "PAID", paidDate: { gte: startOfMonth, lt: startOfNextMonth } },
    }),
    prisma.policyCommission.aggregate({
      _sum: { expectedAmount: true },
      where: { period: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}` },
    }),
    prisma.policy.findMany({
      where: { status: "ACTIVE", endDate: { gte: now, lte: in30 } },
      orderBy: { endDate: "asc" },
      take: 8,
      include: { client: true, insurer: true },
    }),
    prisma.policy.groupBy({
      by: ["insurerId"],
      where: { status: "ACTIVE" },
      _count: { _all: true },
    }),
  ]);

  const insurers = await prisma.insurer.findMany({
    where: { id: { in: byInsurer.map((b) => b.insurerId) } },
  });
  const insurerName = (id: string) => insurers.find((i) => i.id === id)?.name ?? "—";

  const hour = now.getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";

  const sortedInsurers = [...byInsurer].sort((a, b) => b._count._all - a._count._all);
  const topInsurers = sortedInsurers.slice(0, 5);
  const otherInsurersCount = sortedInsurers.slice(5).reduce((sum, row) => sum + row._count._all, 0);
  const maxInsurerCount = Math.max(1, ...sortedInsurers.map((r) => r._count._all));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {greeting}, {session?.user?.name?.split(" ")[0]}
        </h1>
        <div className="mt-2 h-1 w-24 rounded-full bg-gradient-to-r from-[var(--brand-navy)] via-[var(--brand-blue)] to-[var(--brand-green)]" />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Pólizas activas" value={activePolicies} href="/policies" icon={ShieldCheck} color="blue" />
        <StatCard
          label="Por vencer (30d)"
          value={expiringPolicies}
          href="/renewals"
          icon={RefreshCw}
          color="amber"
          warn={expiringPolicies > 0}
        />
        <StatCard label="Cotizaciones pendientes" value={pendingQuotes} href="/quotes" icon={FileText} color="violet" />
        <StatCard
          label="Reclamaciones abiertas"
          value={openClaims}
          href="/claims"
          icon={AlertTriangle}
          color="rose"
          warn={openClaims > 0}
        />
        <StatCard
          label="Primas cobradas (mes)"
          value={formatCurrency((premiumsThisMonth._sum.amount ?? 0).toString())}
          href="/commissions"
          icon={Wallet}
          color="emerald"
        />
        <StatCard
          label="Comisiones (mes)"
          value={formatCurrency((commissionsThisMonth._sum.expectedAmount ?? 0).toString())}
          href="/commissions"
          icon={Percent}
          color="cyan"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Renovaciones próximas</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingRenewals.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay pólizas por vencer en los próximos 30 días.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Póliza</TableHead>
                    <TableHead>Aseguradora</TableHead>
                    <TableHead>Vence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingRenewals.map((p) => {
                    const daysLeft = Math.ceil((p.endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
                    const urgent = daysLeft <= 7;
                    return (
                      <TableRow key={p.id}>
                        <TableCell>{clientDisplayName(p.client)}</TableCell>
                        <TableCell>
                          <Link href={`/policies/${p.id}`} className="underline underline-offset-2">
                            {p.policyNumber}
                          </Link>
                        </TableCell>
                        <TableCell>{p.insurer.name}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              urgent
                                ? "border-transparent bg-rose-100 text-rose-700 hover:bg-rose-100"
                                : "border-transparent bg-amber-100 text-amber-700 hover:bg-amber-100"
                            }
                          >
                            {formatDate(p.endDate)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pólizas activas por aseguradora</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {byInsurer.length === 0 && <p className="text-sm text-muted-foreground">Sin datos aún.</p>}
            {topInsurers.map((row, index) => (
              <div key={row.insurerId} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${INSURER_DOT_COLORS[index % INSURER_DOT_COLORS.length]}`} />
                    {insurerName(row.insurerId)}
                  </span>
                  <span className="font-medium">{row._count._all}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${INSURER_DOT_COLORS[index % INSURER_DOT_COLORS.length]}`}
                    style={{ width: `${(row._count._all / maxInsurerCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {otherInsurersCount > 0 && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-slate-400" />
                  Otras
                </span>
                <span className="font-medium">{otherInsurersCount}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const STAT_CARD_COLORS = {
  blue: { bg: "bg-blue-100", text: "text-blue-600" },
  amber: { bg: "bg-amber-100", text: "text-amber-600" },
  violet: { bg: "bg-violet-100", text: "text-violet-600" },
  rose: { bg: "bg-rose-100", text: "text-rose-600" },
  emerald: { bg: "bg-emerald-100", text: "text-emerald-600" },
  cyan: { bg: "bg-cyan-100", text: "text-cyan-600" },
} as const;

function StatCard({
  label,
  value,
  href,
  icon: Icon,
  color,
  warn,
}: {
  label: string;
  value: string | number;
  href: string;
  icon: LucideIcon;
  color: keyof typeof STAT_CARD_COLORS;
  warn?: boolean;
}) {
  const palette = STAT_CARD_COLORS[color];
  return (
    <Link href={href}>
      <Card className="transition-colors hover:border-primary">
        <CardContent className="flex items-start justify-between gap-2 p-4">
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`mt-1 text-xl font-semibold ${warn ? "text-destructive" : ""}`}>{value}</p>
          </div>
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${palette.bg} ${palette.text}`}>
            <Icon className="h-4 w-4" />
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
