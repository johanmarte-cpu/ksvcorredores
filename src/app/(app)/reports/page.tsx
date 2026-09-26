import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { clientDisplayName, formatCurrency, lastMonthKeys, monthKeyOf } from "@/lib/format";
import { MonthlyBarChart, StackedStatusBar } from "@/components/reports/monthly-bar-chart";

const INACTIVE_STATUSES = ["EXPIRED", "CANCELLED", "RENEWED"] as const;

export default async function ReportsPage() {
  const months = lastMonthKeys(12);
  const earliestMonth = new Date(months[0].year, months[0].month, 1);

  const [
    policies,
    payments,
    commissions,
    clientTotals,
    recentClients,
    topClientPolicies,
    clientsByExecutive,
  ] = await Promise.all([
    prisma.policy.findMany({
      select: { status: true, premium: true, insurer: { select: { name: true } } },
    }),
    prisma.policyPayment.findMany({
      where: { status: "PAID", paidDate: { gte: earliestMonth } },
      select: { amount: true, paidDate: true },
    }),
    prisma.policyCommission.findMany({
      where: { period: { in: months.map((m) => m.key) } },
      select: { period: true, expectedAmount: true, receivedAmount: true },
    }),
    prisma.client.groupBy({ by: ["type"], _count: { _all: true } }),
    prisma.client.findMany({
      where: { createdAt: { gte: earliestMonth } },
      select: { createdAt: true },
    }),
    prisma.policy.findMany({
      where: { status: "ACTIVE" },
      select: { premium: true, client: true },
    }),
    prisma.client.groupBy({ by: ["assignedToId"], _count: { _all: true } }),
  ]);

  // ── Cartera activa / inactiva ──────────────────────────────
  const statusCounts = { ACTIVE: 0, PENDING: 0, INACTIVE: 0 };
  const statusPremiums = { ACTIVE: 0, PENDING: 0, INACTIVE: 0 };
  const byInsurer = new Map<string, { active: number; activePremium: number; inactive: number; inactivePremium: number }>();

  for (const p of policies) {
    const premium = Number(p.premium);
    const bucket = p.status === "ACTIVE" ? "ACTIVE" : p.status === "PENDING" ? "PENDING" : "INACTIVE";
    statusCounts[bucket]++;
    statusPremiums[bucket] += premium;

    const entry = byInsurer.get(p.insurer.name) ?? { active: 0, activePremium: 0, inactive: 0, inactivePremium: 0 };
    if (p.status === "ACTIVE") {
      entry.active++;
      entry.activePremium += premium;
    } else if ((INACTIVE_STATUSES as readonly string[]).includes(p.status)) {
      entry.inactive++;
      entry.inactivePremium += premium;
    }
    byInsurer.set(p.insurer.name, entry);
  }

  // ── Ingresos por mes ──────────────────────────────
  const paymentsByMonth = new Map<string, number>();
  for (const payment of payments) {
    if (!payment.paidDate) continue;
    const key = monthKeyOf(payment.paidDate);
    paymentsByMonth.set(key, (paymentsByMonth.get(key) ?? 0) + Number(payment.amount));
  }
  const commissionsByMonth = new Map<string, { expected: number; received: number }>();
  for (const c of commissions) {
    const entry = commissionsByMonth.get(c.period) ?? { expected: 0, received: 0 };
    entry.expected += Number(c.expectedAmount);
    entry.received += Number(c.receivedAmount ?? 0);
    commissionsByMonth.set(c.period, entry);
  }

  const premiumChartData = months.map((m) => ({ label: m.label, value: paymentsByMonth.get(m.key) ?? 0 }));
  const commissionChartData = months.map((m) => ({ label: m.label, value: commissionsByMonth.get(m.key)?.received ?? 0 }));

  // ── Reporte de clientes ──────────────────────────────
  const clientsByMonth = new Map<string, number>();
  for (const c of recentClients) {
    const key = monthKeyOf(c.createdAt);
    clientsByMonth.set(key, (clientsByMonth.get(key) ?? 0) + 1);
  }
  const newClientsChartData = months.map((m) => ({ label: m.label, value: clientsByMonth.get(m.key) ?? 0 }));

  const totalClients = clientTotals.reduce((sum, t) => sum + t._count._all, 0);
  const personCount = clientTotals.find((t) => t.type === "PERSON")?._count._all ?? 0;
  const companyCount = clientTotals.find((t) => t.type === "COMPANY")?._count._all ?? 0;

  const clientPremiumMap = new Map<string, { name: string; premium: number; policies: number }>();
  for (const p of topClientPolicies) {
    const entry = clientPremiumMap.get(p.client.id) ?? { name: clientDisplayName(p.client), premium: 0, policies: 0 };
    entry.premium += Number(p.premium);
    entry.policies += 1;
    clientPremiumMap.set(p.client.id, entry);
  }
  const topClients = [...clientPremiumMap.values()].sort((a, b) => b.premium - a.premium).slice(0, 10);

  const executiveIds = clientsByExecutive.map((e) => e.assignedToId).filter((id): id is string => !!id);
  const executives = await prisma.user.findMany({ where: { id: { in: executiveIds } } });
  const executiveName = (id: string | null) => (id ? executives.find((e) => e.id === id)?.name ?? "—" : "Sin asignar");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Reportes</h1>

      <Tabs defaultValue="portfolio">
        <TabsList>
          <TabsTrigger value="portfolio">Cartera activa/inactiva</TabsTrigger>
          <TabsTrigger value="income">Ingresos por mes</TabsTrigger>
          <TabsTrigger value="clients">Clientes</TabsTrigger>
        </TabsList>

        {/* ── Cartera ── */}
        <TabsContent value="portfolio" className="space-y-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <StatCard label="Pólizas activas" value={statusCounts.ACTIVE} sub={formatCurrency(statusPremiums.ACTIVE)} />
            <StatCard label="Pendientes" value={statusCounts.PENDING} sub={formatCurrency(statusPremiums.PENDING)} />
            <StatCard label="Inactivas" value={statusCounts.INACTIVE} sub={formatCurrency(statusPremiums.INACTIVE)} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Distribución de la cartera</CardTitle>
            </CardHeader>
            <CardContent>
              <StackedStatusBar
                segments={[
                  { label: "Activas", value: statusCounts.ACTIVE, color: "var(--brand-green)" },
                  { label: "Pendientes", value: statusCounts.PENDING, color: "var(--brand-blue)" },
                  { label: "Inactivas", value: statusCounts.INACTIVE, color: "#94a3b8" },
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Por aseguradora</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aseguradora</TableHead>
                    <TableHead>Activas</TableHead>
                    <TableHead>Prima activa</TableHead>
                    <TableHead>Inactivas</TableHead>
                    <TableHead>Prima inactiva</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {byInsurer.size === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                        Sin pólizas registradas.
                      </TableCell>
                    </TableRow>
                  )}
                  {[...byInsurer.entries()].map(([name, row]) => (
                    <TableRow key={name}>
                      <TableCell>{name}</TableCell>
                      <TableCell>{row.active}</TableCell>
                      <TableCell>{formatCurrency(row.activePremium)}</TableCell>
                      <TableCell>{row.inactive}</TableCell>
                      <TableCell>{formatCurrency(row.inactivePremium)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Ingresos ── */}
        <TabsContent value="income" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Primas cobradas por mes</CardTitle>
              </CardHeader>
              <CardContent>
                <MonthlyBarChart data={premiumChartData} color="var(--brand-blue)" formatValue={(v) => formatCurrency(v)} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Comisiones recibidas por mes</CardTitle>
              </CardHeader>
              <CardContent>
                <MonthlyBarChart data={commissionChartData} color="var(--brand-green)" formatValue={(v) => formatCurrency(v)} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detalle mensual</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mes</TableHead>
                    <TableHead>Primas cobradas</TableHead>
                    <TableHead>Comisiones esperadas</TableHead>
                    <TableHead>Comisiones recibidas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {months.map((m) => (
                    <TableRow key={m.key}>
                      <TableCell className="capitalize">{m.label}</TableCell>
                      <TableCell>{formatCurrency(paymentsByMonth.get(m.key) ?? 0)}</TableCell>
                      <TableCell>{formatCurrency(commissionsByMonth.get(m.key)?.expected ?? 0)}</TableCell>
                      <TableCell>{formatCurrency(commissionsByMonth.get(m.key)?.received ?? 0)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Clientes ── */}
        <TabsContent value="clients" className="space-y-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <StatCard label="Total de clientes" value={totalClients} />
            <StatCard label="Personas físicas" value={personCount} />
            <StatCard label="Empresas" value={companyCount} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Nuevos clientes por mes</CardTitle>
            </CardHeader>
            <CardContent>
              <MonthlyBarChart data={newClientsChartData} color="var(--brand-navy)" />
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top 10 clientes por prima activa</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Pólizas</TableHead>
                      <TableHead>Prima total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topClients.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          Sin datos aún.
                        </TableCell>
                      </TableRow>
                    )}
                    {topClients.map((c) => (
                      <TableRow key={c.name}>
                        <TableCell>{c.name}</TableCell>
                        <TableCell>{c.policies}</TableCell>
                        <TableCell>{formatCurrency(c.premium)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Clientes por ejecutivo</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ejecutivo</TableHead>
                      <TableHead>Clientes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientsByExecutive.map((row) => (
                      <TableRow key={row.assignedToId ?? "none"}>
                        <TableCell>{executiveName(row.assignedToId)}</TableCell>
                        <TableCell>{row._count._all}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-xl font-semibold">{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}
