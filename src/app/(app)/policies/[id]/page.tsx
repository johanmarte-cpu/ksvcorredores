import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { clientDisplayName, formatCurrency, formatDate } from "@/lib/format";
import { POLICY_STATUS_LABELS, PAYMENT_FREQUENCY_LABELS, CLAIM_STATUS_LABELS } from "@/lib/labels";
import { NewPaymentDialog, MarkPaidButton } from "./payment-forms";
import { NewCommissionDialog, ReceiveCommissionDialog } from "../../commissions/commission-forms";

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  PAID: "Pagado",
  OVERDUE: "Vencido",
  CANCELLED: "Cancelado",
};

export default async function PolicyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const policy = await prisma.policy.findUnique({
    where: { id },
    include: {
      client: true,
      insurer: true,
      product: true,
      payments: { orderBy: { dueDate: "asc" } },
      commissions: { orderBy: { period: "desc" } },
      claims: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!policy) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{policy.policyNumber}</h1>
          <p className="text-sm text-muted-foreground">
            <Link href={`/clients/${policy.clientId}`} className="underline-offset-2 hover:underline">
              {clientDisplayName(policy.client)}
            </Link>{" "}
            · {policy.insurer.name} · {policy.product.name}
          </p>
        </div>
        <Badge variant="outline">{POLICY_STATUS_LABELS[policy.status]}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <InfoCard label="Prima" value={formatCurrency(policy.premium.toString())} />
        <InfoCard label="Comisión" value={`${policy.commissionPercentage}% · ${formatCurrency(policy.commissionAmount.toString())}`} />
        <InfoCard label="Forma de pago" value={PAYMENT_FREQUENCY_LABELS[policy.paymentFrequency]} />
        <InfoCard label="Vigencia" value={`${formatDate(policy.startDate)} → ${formatDate(policy.endDate)}`} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Cobros</CardTitle>
          <NewPaymentDialog policyId={policy.id} />
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vence</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {policy.payments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Sin cobros registrados
                  </TableCell>
                </TableRow>
              )}
              {policy.payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{formatDate(payment.dueDate)}</TableCell>
                  <TableCell>{formatCurrency(payment.amount.toString())}</TableCell>
                  <TableCell>
                    <Badge variant={payment.status === "PAID" ? "secondary" : "outline"}>
                      {PAYMENT_STATUS_LABELS[payment.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {payment.status === "PENDING" && <MarkPaidButton policyId={policy.id} paymentId={payment.id} />}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Comisiones</CardTitle>
          <NewCommissionDialog policyId={policy.id} defaultAmount={Number(policy.commissionAmount)} />
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Período</TableHead>
                <TableHead>Esperada</TableHead>
                <TableHead>Recibida</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {policy.commissions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Sin comisiones registradas
                  </TableCell>
                </TableRow>
              )}
              {policy.commissions.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.period}</TableCell>
                  <TableCell>{formatCurrency(c.expectedAmount.toString())}</TableCell>
                  <TableCell>{c.receivedAmount ? formatCurrency(c.receivedAmount.toString()) : "—"}</TableCell>
                  <TableCell>
                    <Badge variant={c.status === "RECEIVED" ? "secondary" : "outline"}>{c.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {c.status !== "RECEIVED" && (
                      <ReceiveCommissionDialog policyId={policy.id} commissionId={c.id} expectedAmount={Number(c.expectedAmount)} />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Reclamaciones</CardTitle>
          <Button asChild size="sm" variant="secondary">
            <Link href={`/claims/new?policyId=${policy.id}`}>Nueva reclamación</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Caso</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {policy.claims.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Sin reclamaciones
                  </TableCell>
                </TableRow>
              )}
              {policy.claims.map((claim) => (
                <TableRow key={claim.id}>
                  <TableCell>
                    <Link href={`/claims/${claim.id}`} className="underline-offset-2 hover:underline">
                      {claim.caseNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{claim.claimType}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{CLAIM_STATUS_LABELS[claim.status]}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(claim.incidentDate)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-sm font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
