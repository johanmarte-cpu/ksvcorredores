import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { clientDisplayName, formatDate, daysUntil } from "@/lib/format";
import { toneClass } from "@/lib/status-colors";
import { GenerateTaskButton, RenewalStatusSelect } from "./renewal-actions-cell";

export default async function RenewalsPage() {
  const now = new Date();
  const in60 = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  const [expiring, renewals] = await Promise.all([
    prisma.policy.findMany({
      where: { status: "ACTIVE", endDate: { gte: now, lte: in60 } },
      orderBy: { endDate: "asc" },
      include: { client: true, insurer: true, renewals: true },
    }),
    prisma.policyRenewal.findMany({
      where: { status: { notIn: ["RENEWED", "LAPSED", "DECLINED"] } },
      orderBy: { dueDate: "asc" },
      include: { policy: { include: { client: true, insurer: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Renovaciones</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pólizas próximas a vencer (60 días)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Póliza</TableHead>
                <TableHead>Aseguradora</TableHead>
                <TableHead>Vence</TableHead>
                <TableHead>Alerta</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {expiring.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No hay pólizas por vencer en los próximos 60 días.
                  </TableCell>
                </TableRow>
              )}
              {expiring.map((policy) => {
                const days = daysUntil(policy.endDate);
                const hasOpenRenewal = policy.renewals.some((r) => !["RENEWED", "LAPSED", "DECLINED"].includes(r.status));
                return (
                  <TableRow key={policy.id}>
                    <TableCell>{clientDisplayName(policy.client)}</TableCell>
                    <TableCell>
                      <Link href={`/policies/${policy.id}`} className="underline-offset-2 hover:underline">
                        {policy.policyNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{policy.insurer.name}</TableCell>
                    <TableCell>{formatDate(policy.endDate)}</TableCell>
                    <TableCell>
                      <Badge className={toneClass(days <= 7 ? "rose" : days <= 30 ? "amber" : "blue")}>{days} días</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {!hasOpenRenewal && <GenerateTaskButton policyId={policy.id} />}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Seguimiento de renovaciones</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Póliza</TableHead>
                <TableHead>Vence</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renewals.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    No hay renovaciones en seguimiento.
                  </TableCell>
                </TableRow>
              )}
              {renewals.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{clientDisplayName(r.policy.client)}</TableCell>
                  <TableCell>
                    <Link href={`/policies/${r.policy.id}`} className="underline-offset-2 hover:underline">
                      {r.policy.policyNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{formatDate(r.dueDate)}</TableCell>
                  <TableCell>
                    <RenewalStatusSelect renewalId={r.id} status={r.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
