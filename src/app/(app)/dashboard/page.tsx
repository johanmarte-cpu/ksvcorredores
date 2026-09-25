import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { formatCurrency, formatDate, clientDisplayName } from "@/lib/format";

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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">
        {greeting}, {session?.user?.name?.split(" ")[0]}
      </h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Pólizas activas" value={activePolicies} href="/policies" />
        <StatCard label="Por vencer (30d)" value={expiringPolicies} href="/renewals" warn={expiringPolicies > 0} />
        <StatCard label="Cotizaciones pendientes" value={pendingQuotes} href="/quotes" />
        <StatCard label="Reclamaciones abiertas" value={openClaims} href="/claims" warn={openClaims > 0} />
        <StatCard label="Primas cobradas (mes)" value={formatCurrency((premiumsThisMonth._sum.amount ?? 0).toString())} href="/commissions" />
        <StatCard label="Comisiones (mes)" value={formatCurrency((commissionsThisMonth._sum.expectedAmount ?? 0).toString())} href="/commissions" />
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
                  {upcomingRenewals.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{clientDisplayName(p.client)}</TableCell>
                      <TableCell>
                        <Link href={`/policies/${p.id}`} className="underline underline-offset-2">
                          {p.policyNumber}
                        </Link>
                      </TableCell>
                      <TableCell>{p.insurer.name}</TableCell>
                      <TableCell>
                        <Badge variant="destructive">{formatDate(p.endDate)}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pólizas activas por aseguradora</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {byInsurer.length === 0 && <p className="text-sm text-muted-foreground">Sin datos aún.</p>}
            {byInsurer
              .sort((a, b) => b._count._all - a._count._all)
              .map((row) => (
                <div key={row.insurerId} className="flex items-center justify-between text-sm">
                  <span>{insurerName(row.insurerId)}</span>
                  <Badge variant="secondary">{row._count._all}</Badge>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
  warn,
}: {
  label: string;
  value: string | number;
  href: string;
  warn?: boolean;
}) {
  return (
    <Link href={href}>
      <Card className="transition-colors hover:border-primary">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={`mt-1 text-xl font-semibold ${warn ? "text-destructive" : ""}`}>{value}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
