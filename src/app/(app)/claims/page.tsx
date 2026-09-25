import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { clientDisplayName, formatDate } from "@/lib/format";
import { CLAIM_STATUS_LABELS } from "@/lib/labels";

export default async function ClaimsPage() {
  const claims = await prisma.claim.findMany({
    orderBy: { createdAt: "desc" },
    include: { policy: { include: { client: true } } },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Reclamaciones</h1>
        <Button asChild size="sm">
          <Link href="/claims/new">Nueva reclamación</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Caso</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Póliza</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Fecha del siniestro</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {claims.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    Aún no hay reclamaciones registradas.
                  </TableCell>
                </TableRow>
              )}
              {claims.map((claim) => (
                <TableRow key={claim.id}>
                  <TableCell>
                    <Link href={`/claims/${claim.id}`} className="font-medium underline-offset-2 hover:underline">
                      {claim.caseNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{clientDisplayName(claim.policy.client)}</TableCell>
                  <TableCell>{claim.policy.policyNumber}</TableCell>
                  <TableCell>{claim.claimType}</TableCell>
                  <TableCell>{formatDate(claim.incidentDate)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{CLAIM_STATUS_LABELS[claim.status]}</Badge>
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
