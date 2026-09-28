import { ShieldCheck, RefreshCw, FileText, AlertTriangle, Wallet, Percent } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { formatCurrency, clientDisplayName, lastMonthKeys, monthKeyOf, daysUntil } from "@/lib/format";
import { RenewalsPanel, type RenewalRow } from "@/components/dashboard/renewals-panel";
import { InsurerBreakdown, type InsurerRow } from "@/components/dashboard/insurer-breakdown";
import { TrendCard } from "@/components/dashboard/trend-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { CollectionsSummary } from "@/components/dashboard/collections-summary";
import { FadeIn } from "@/components/effects/fade-in";

export default async function DashboardPage() {
  const session = await auth();
  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const months6 = lastMonthKeys(6);
  const earliestMonth6 = new Date(months6[0].year, months6[0].month, 1);

  const [
    activePolicies,
    expiringPolicies,
    pendingQuotes,
    openClaims,
    premiumsThisMonth,
    commissionsThisMonth,
    upcomingRenewals,
    byInsurer,
    payments6,
    commissions6,
    pendingPayments,
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
      take: 25,
      include: { client: true, insurer: true },
    }),
    prisma.policy.groupBy({
      by: ["insurerId"],
      where: { status: "ACTIVE" },
      _count: { _all: true },
      _sum: { premium: true },
    }),
    prisma.policyPayment.findMany({
      where: { status: "PAID", paidDate: { gte: earliestMonth6 } },
      select: { amount: true, paidDate: true },
    }),
    prisma.policyCommission.findMany({
      where: { period: { in: months6.map((m) => m.key) } },
      select: { period: true, receivedAmount: true },
    }),
    prisma.policyPayment.findMany({
      where: { status: "PENDING" },
      select: { amount: true, dueDate: true },
    }),
  ]);

  const insurers = await prisma.insurer.findMany({
    where: { id: { in: byInsurer.map((b) => b.insurerId) } },
  });
  const insurerName = (id: string) => insurers.find((i) => i.id === id)?.name ?? "—";

  const hour = now.getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";

  const insurerRows: InsurerRow[] = byInsurer.map((row) => ({
    insurerId: row.insurerId,
    name: insurerName(row.insurerId),
    count: row._count._all,
    premium: Number(row._sum.premium ?? 0),
  }));

  const renewalRows: RenewalRow[] = upcomingRenewals.map((p) => ({
    id: p.id,
    policyNumber: p.policyNumber,
    clientName: clientDisplayName(p.client),
    insurerName: p.insurer.name,
    endDate: p.endDate,
    daysLeft: Math.ceil((p.endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)),
  }));

  const paymentsByMonth = new Map<string, number>();
  for (const payment of payments6) {
    if (!payment.paidDate) continue;
    const key = monthKeyOf(payment.paidDate);
    paymentsByMonth.set(key, (paymentsByMonth.get(key) ?? 0) + Number(payment.amount));
  }
  const commissionsByMonth = new Map<string, number>();
  for (const c of commissions6) {
    commissionsByMonth.set(c.period, (commissionsByMonth.get(c.period) ?? 0) + Number(c.receivedAmount ?? 0));
  }
  const premiumTrend = months6.map((m) => ({ label: m.label, value: paymentsByMonth.get(m.key) ?? 0 }));
  const commissionTrend = months6.map((m) => ({ label: m.label, value: commissionsByMonth.get(m.key) ?? 0 }));

  const totalPending = pendingPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const overduePayments = pendingPayments.filter((p) => daysUntil(p.dueDate) < 0);
  const totalOverdue = overduePayments.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      <FadeIn>
        <h1 className="text-2xl font-semibold">
          {greeting}, {session?.user?.name?.split(" ")[0]}
        </h1>
        <div className="mt-2 h-1 w-24 rounded-full bg-gradient-to-r from-[var(--brand-navy)] via-[var(--brand-blue)] to-[var(--brand-green)]" />
      </FadeIn>

      <FadeIn delay={0.1} className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Pólizas activas"
          value={activePolicies}
          href="/policies"
          icon={<ShieldCheck className="h-4 w-4" />}
          color="blue"
          hint="Pólizas con estado ACTIVA en este momento."
        />
        <StatCard
          label="Por vencer (30d)"
          value={expiringPolicies}
          href="/renewals"
          icon={<RefreshCw className="h-4 w-4" />}
          color="amber"
          warn={expiringPolicies > 0}
          hint="Pólizas activas cuya fecha de vencimiento cae en los próximos 30 días."
        />
        <StatCard
          label="Cotizaciones pendientes"
          value={pendingQuotes}
          href="/quotes"
          icon={<FileText className="h-4 w-4" />}
          color="violet"
          hint="Cotizaciones en borrador, enviadas, en revisión o comparadas."
        />
        <StatCard
          label="Reclamaciones abiertas"
          value={openClaims}
          href="/claims"
          icon={<AlertTriangle className="h-4 w-4" />}
          color="rose"
          warn={openClaims > 0}
          hint="Reclamaciones que aún no están cerradas, pagadas o rechazadas."
        />
        <StatCard
          label="Primas cobradas (mes)"
          value={formatCurrency((premiumsThisMonth._sum.amount ?? 0).toString())}
          href="/commissions"
          icon={<Wallet className="h-4 w-4" />}
          color="emerald"
          hint="Suma de cuotas pagadas con fecha de pago dentro del mes en curso."
        />
        <StatCard
          label="Comisiones (mes)"
          value={formatCurrency((commissionsThisMonth._sum.expectedAmount ?? 0).toString())}
          href="/commissions"
          icon={<Percent className="h-4 w-4" />}
          color="cyan"
          hint="Comisiones esperadas para el período actual (todas las pólizas)."
        />
      </FadeIn>

      <FadeIn delay={0.2} className="space-y-3">
        <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Cartera</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Renovaciones próximas</CardTitle>
            </CardHeader>
            <CardContent>
              <RenewalsPanel renewals={renewalRows} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cartera por aseguradora</CardTitle>
            </CardHeader>
            <CardContent>
              <InsurerBreakdown rows={insurerRows} />
            </CardContent>
          </Card>
        </div>
      </FadeIn>

      <FadeIn delay={0.3} className="space-y-3">
        <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Finanzas</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <TrendCard premiums={premiumTrend} commissions={commissionTrend} />
          </div>
          <CollectionsSummary totalPending={totalPending} totalOverdue={totalOverdue} overdueCount={overduePayments.length} />
        </div>
      </FadeIn>
    </div>
  );
}
