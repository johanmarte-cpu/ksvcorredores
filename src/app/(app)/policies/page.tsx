import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { clientDisplayName, formatCurrency, formatDate } from "@/lib/format";
import { POLICY_STATUS_LABELS } from "@/lib/labels";
import { NewPolicyDialog } from "./new-policy-dialog";

export default async function PoliciesPage() {
  const [policies, clients, insurers] = await Promise.all([
    prisma.policy.findMany({
      orderBy: { createdAt: "desc" },
      include: { client: true, insurer: true, product: true },
    }),
    prisma.client.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.insurer.findMany({ where: { active: true }, include: { products: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Pólizas</h1>
        <NewPolicyDialog clients={clients.map((c) => ({ id: c.id, name: clientDisplayName(c) }))} insurers={insurers} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Aseguradora</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Prima</TableHead>
                <TableHead>Vence</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {policies.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    Aún no hay pólizas registradas.
                  </TableCell>
                </TableRow>
              )}
              {policies.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link href={`/policies/${p.id}`} className="font-medium underline-offset-2 hover:underline">
                      {p.policyNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{clientDisplayName(p.client)}</TableCell>
                  <TableCell>{p.insurer.name}</TableCell>
                  <TableCell>{p.product.name}</TableCell>
                  <TableCell>{formatCurrency(p.premium.toString())}</TableCell>
                  <TableCell>{formatDate(p.endDate)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{POLICY_STATUS_LABELS[p.status]}</Badge>
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
