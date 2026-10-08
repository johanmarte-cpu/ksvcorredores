import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { clientDisplayName, formatCurrency, formatDate } from "@/lib/format";
import { POLICY_STATUS_LABELS } from "@/lib/labels";
import { POLICY_STATUS_TONE, statusClass } from "@/lib/status-colors";
import { getSettings } from "@/lib/settings";
import { NewPolicyDialog } from "./new-policy-dialog";
import { FadeIn } from "@/components/effects/fade-in";
import { ListPagination } from "@/components/ui/list-pagination";
import { parsePage, paginate, totalPages as computeTotalPages } from "@/lib/pagination";

export default async function PoliciesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams;
  const page = parsePage(pageParam);

  const [policies, count, clients, insurers, settings] = await Promise.all([
    prisma.policy.findMany({
      orderBy: { createdAt: "desc" },
      include: { client: true, insurer: true, product: true },
      ...paginate(page),
    }),
    prisma.policy.count(),
    prisma.client.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.insurer.findMany({ where: { active: true }, include: { products: true }, orderBy: { name: "asc" } }),
    getSettings(),
  ]);
  const pages = computeTotalPages(count);

  return (
    <div className="space-y-4">
      <FadeIn className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Pólizas</h1>
        <NewPolicyDialog
          clients={clients.map((c) => ({ id: c.id, name: clientDisplayName(c) }))}
          insurers={insurers}
          itbisRate={Number(settings.itbisRate)}
          downPaymentRate={Number(settings.downPaymentRate)}
        />
      </FadeIn>

      <FadeIn delay={0.1}>
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
                <TableHead>ITBIS</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Vence</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {policies.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
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
                  <TableCell className="text-muted-foreground">{formatCurrency(p.itbisAmount.toString())}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(p.totalAmount.toString())}</TableCell>
                  <TableCell>{formatDate(p.endDate)}</TableCell>
                  <TableCell>
                    <Badge className={statusClass(POLICY_STATUS_TONE, p.status)}>{POLICY_STATUS_LABELS[p.status]}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <ListPagination page={page} totalPages={pages} basePath="/policies" searchParams={{}} />
      </Card>
      </FadeIn>
    </div>
  );
}
