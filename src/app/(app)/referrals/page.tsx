import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { clientDisplayName, formatCurrency, formatDate } from "@/lib/format";
import { REFERRAL_PAYMENT_STATUS_LABELS } from "@/lib/labels";
import { REFERRAL_PAYMENT_STATUS_TONE, statusClass, toneClass } from "@/lib/status-colors";
import { NewReferrerDialog } from "./new-referrer-dialog";
import { ToggleReferrerActiveButton } from "./toggle-referrer-active";
import { MarkReferralPaidButton } from "./referral-forms";
import { FadeIn } from "@/components/effects/fade-in";

export default async function ReferralsPage() {
  const [referrers, referrals] = await Promise.all([
    prisma.referrer.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.policyReferral.findMany({
      orderBy: { createdAt: "desc" },
      include: { referrer: true, policy: { include: { client: true } } },
    }),
  ]);

  const totalPending = referrals.filter((r) => r.status === "PENDING").reduce((sum, r) => sum + Number(r.amount), 0);
  const totalPaid = referrals.filter((r) => r.status === "PAID").reduce((sum, r) => sum + Number(r.amount), 0);
  const activeReferrers = referrers.filter((r) => r.active).length;

  return (
    <div className="space-y-6">
      <FadeIn>
        <h1 className="text-2xl font-semibold">Referidos</h1>
      </FadeIn>

      <FadeIn delay={0.05} className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard label="Referidos activos" value={activeReferrers} />
        <StatCard label="Pendiente de pago" value={formatCurrency(totalPending)} />
        <StatCard label="Pagado" value={formatCurrency(totalPaid)} />
      </FadeIn>

      <FadeIn delay={0.1}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Registro de referidos</CardTitle>
          <NewReferrerDialog />
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {referrers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    Aún no hay referidos registrados.
                  </TableCell>
                </TableRow>
              )}
              {referrers.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.name}</TableCell>
                  <TableCell>{r.phone ?? "—"}</TableCell>
                  <TableCell>{r.email ?? "—"}</TableCell>
                  <TableCell>
                    <Badge className={toneClass(r.active ? "emerald" : "slate")}>{r.active ? "Activo" : "Inactivo"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <ToggleReferrerActiveButton referrerId={r.id} active={r.active} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      </FadeIn>

      <FadeIn delay={0.15}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pagos por póliza (% de prima neta)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Póliza</TableHead>
                <TableHead>Prima neta</TableHead>
                <TableHead>%</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {referrals.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                    Aún no hay pagos de referidos registrados.
                  </TableCell>
                </TableRow>
              )}
              {referrals.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.referrer.name}</TableCell>
                  <TableCell>{clientDisplayName(r.policy.client)}</TableCell>
                  <TableCell>
                    <Link href={`/policies/${r.policyId}`} className="underline-offset-2 hover:underline">
                      {r.policy.policyNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{formatCurrency(r.policy.premium.toString())}</TableCell>
                  <TableCell>{r.percentage.toString()}%</TableCell>
                  <TableCell>{formatCurrency(r.amount.toString())}</TableCell>
                  <TableCell>
                    <Badge className={statusClass(REFERRAL_PAYMENT_STATUS_TONE, r.status)}>
                      {REFERRAL_PAYMENT_STATUS_LABELS[r.status]}
                    </Badge>
                    {r.paidDate && <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(r.paidDate)}</p>}
                  </TableCell>
                  <TableCell className="text-right">
                    {r.status === "PENDING" && <MarkReferralPaidButton policyId={r.policyId} referralId={r.id} />}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      </FadeIn>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
