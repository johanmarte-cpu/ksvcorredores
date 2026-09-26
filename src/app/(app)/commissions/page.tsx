import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { clientDisplayName, formatCurrency } from "@/lib/format";
import { COMMISSION_STATUS_TONE, statusClass } from "@/lib/status-colors";

export default async function CommissionsPage() {
  const commissions = await prisma.policyCommission.findMany({
    orderBy: [{ period: "desc" }],
    include: { policy: { include: { client: true, insurer: true } } },
  });

  const totalExpected = commissions.reduce((sum, c) => sum + Number(c.expectedAmount), 0);
  const totalReceived = commissions.reduce((sum, c) => sum + Number(c.receivedAmount ?? 0), 0);

  const byInsurer = new Map<string, { name: string; expected: number; received: number }>();
  for (const c of commissions) {
    const key = c.policy.insurer.id;
    const entry = byInsurer.get(key) ?? { name: c.policy.insurer.name, expected: 0, received: 0 };
    entry.expected += Number(c.expectedAmount);
    entry.received += Number(c.receivedAmount ?? 0);
    byInsurer.set(key, entry);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Comisiones</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total esperado</p>
            <p className="mt-1 text-xl font-semibold">{formatCurrency(totalExpected)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total recibido</p>
            <p className="mt-1 text-xl font-semibold">{formatCurrency(totalReceived)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Diferencia</p>
            <p className="mt-1 text-xl font-semibold">{formatCurrency(totalExpected - totalReceived)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Por aseguradora</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[...byInsurer.values()].map((entry) => (
            <div key={entry.name} className="flex items-center justify-between text-sm">
              <span>{entry.name}</span>
              <span>
                {formatCurrency(entry.received)} / {formatCurrency(entry.expected)}
              </span>
            </div>
          ))}
          {byInsurer.size === 0 && <p className="text-sm text-muted-foreground">Sin datos aún.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalle por póliza</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Período</TableHead>
                <TableHead>Póliza</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Aseguradora</TableHead>
                <TableHead>Esperada</TableHead>
                <TableHead>Recibida</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commissions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    Aún no hay comisiones registradas.
                  </TableCell>
                </TableRow>
              )}
              {commissions.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.period}</TableCell>
                  <TableCell>
                    <Link href={`/policies/${c.policyId}`} className="underline-offset-2 hover:underline">
                      {c.policy.policyNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{clientDisplayName(c.policy.client)}</TableCell>
                  <TableCell>{c.policy.insurer.name}</TableCell>
                  <TableCell>{formatCurrency(c.expectedAmount.toString())}</TableCell>
                  <TableCell>{c.receivedAmount ? formatCurrency(c.receivedAmount.toString()) : "—"}</TableCell>
                  <TableCell>
                    <Badge className={statusClass(COMMISSION_STATUS_TONE, c.status)}>{c.status}</Badge>
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
