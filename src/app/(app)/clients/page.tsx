import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { clientDisplayName } from "@/lib/format";
import { toneClass, statusClass, RISK_LEVEL_TONE } from "@/lib/status-colors";
import { RISK_LEVEL_LABELS } from "@/lib/labels";
import { NewClientDialog } from "./new-client-dialog";

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { policies: true, quotes: true } }, knowledgeForm: { select: { riskLevel: true } } },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <NewClientDialog />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Cédula/RNC</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Pólizas</TableHead>
                <TableHead>Cotizaciones</TableHead>
                <TableHead>Riesgo LA/FT</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    Aún no hay clientes registrados.
                  </TableCell>
                </TableRow>
              )}
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <Link href={`/clients/${client.id}`} className="font-medium underline-offset-2 hover:underline">
                      {clientDisplayName(client)}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge className={toneClass(client.type === "PERSON" ? "blue" : "violet")}>
                      {client.type === "PERSON" ? "Persona" : "Empresa"}
                    </Badge>
                  </TableCell>
                  <TableCell>{client.taxId}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {client.email || client.phone || "—"}
                  </TableCell>
                  <TableCell>{client._count.policies}</TableCell>
                  <TableCell>{client._count.quotes}</TableCell>
                  <TableCell>
                    {client.knowledgeForm?.riskLevel ? (
                      <Badge className={statusClass(RISK_LEVEL_TONE, client.knowledgeForm.riskLevel)}>
                        {RISK_LEVEL_LABELS[client.knowledgeForm.riskLevel]}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sin evaluar</span>
                    )}
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
