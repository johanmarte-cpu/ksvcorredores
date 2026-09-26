import Link from "next/link";
import { ShieldCheck, RefreshCw, FileText, AlertTriangle, Wallet, Percent, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { formatCurrency, clientDisplayName, lastMonthKeys, monthKeyOf } from "@/lib/format";
import { RenewalsPanel, type RenewalRow } from "@/components/dashboard/renewals-panel";
import { InsurerBreakdown, type InsurerRow } from "@/components/dashboard/insurer-breakdown";
import { TrendCard } from "@/components/dashboard/trend-card";

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {greeting}, {session?.user?.name?.split(" ")[0]}
        </h1>
        <div className="mt-2 h-1 w-24 rounded-full bg-gradient-to-r from-[var(--brand-navy)] via-[var(--brand-blue)] to-[var(--brand-green)]" />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Pólizas activas"
          value={activePolicies}
          href="/policies"
          icon={ShieldCheck}
          color="blue"
          hint="Pólizas con estado ACTIVA en este momento."
        />
        <StatCard
          label="Por vencer (30d)"
          value={expiringPolicies}
          href="/renewals"
          icon={RefreshCw}
          color="amber"
          warn={expiringPolicies > 0}
          hint="Pólizas activas cuya fecha de vencimiento cae en los próximos 30 días."
        />
        <StatCard
          label="Cotizaciones pendientes"
          value={pendingQuotes}
          href="/quotes"
          icon={FileText}
          color="violet"
          hint="Cotizaciones en borrador, enviadas, en revisión o comparadas."
        />
        <StatCard
          label="Reclamaciones abiertas"
          value={openClaims}
          href="/claims"
          icon={AlertTriangle}
          color="rose"
          warn={openClaims > 0}
          hint="Reclamaciones que aún no están cerradas, pagadas o rechazadas."
        />
        <StatCard
          label="Primas cobradas (mes)"
          value={formatCurrency((premiumsThisMonth._sum.amount ?? 0).toString())}
          href="/commissions"
          icon={Wallet}
          color="emerald"
          hint="Suma de cuotas pagadas con fecha de pago dentro del mes en curso."
        />
        <StatCard
          label="Comisiones (mes)"
          value={formatCurrency((commissionsThisMonth._sum.expectedAmount ?? 0).toString())}
          href="/commissions"
          icon={Percent}
          color="cyan"
          hint="Comisiones esperadas para el período actual (todas las pólizas)."
        />
      </div>

      <TrendCard premiums={premiumTrend} commissions={commissionTrend} />

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
            <CardTitle className="text-base">Pólizas activas por aseguradora</CardTitle>
          </CardHeader>
          <CardContent>
            <InsurerBreakdown rows={insurerRows} />
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
  hint,
}: {
  label: string;
  value: string | number;
  href: string;
  icon: LucideIcon;
  color: keyof typeof STAT_CARD_COLORS;
  warn?: boolean;
  hint?: string;
}) {
  const palette = STAT_CARD_COLORS[color];
  const card = (
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

  if (!hint) return card;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{card}</TooltipTrigger>
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  );
}
