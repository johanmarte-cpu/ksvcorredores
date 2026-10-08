import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { clientDisplayName, formatDate } from "@/lib/format";
import { LOB_LABELS, QUOTE_STATUS_LABELS } from "@/lib/labels";
import { QUOTE_STATUS_TONE, statusClass } from "@/lib/status-colors";
import { NewQuoteDialog } from "./new-quote-dialog";
import { FadeIn } from "@/components/effects/fade-in";
import { ListPagination } from "@/components/ui/list-pagination";
import { parsePage, paginate, totalPages as computeTotalPages } from "@/lib/pagination";

export default async function QuotesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams;
  const page = parsePage(pageParam);

  const [quotes, count, clients] = await Promise.all([
    prisma.quote.findMany({
      orderBy: { createdAt: "desc" },
      include: { client: true, _count: { select: { requests: true } } },
      ...paginate(page),
    }),
    prisma.quote.count(),
    prisma.client.findMany({ orderBy: { createdAt: "desc" } }),
  ]);
  const pages = computeTotalPages(count);

  return (
    <div className="space-y-4">
      <FadeIn className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Cotizaciones</h1>
        <NewQuoteDialog clients={clients.map((c) => ({ id: c.id, name: clientDisplayName(c) }))} />
      </FadeIn>

      <FadeIn delay={0.1}>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Ramo</TableHead>
                <TableHead>Aseguradoras</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    Aún no hay cotizaciones.
                  </TableCell>
                </TableRow>
              )}
              {quotes.map((q) => (
                <TableRow key={q.id}>
                  <TableCell>
                    <Link href={`/quotes/${q.id}`} className="font-medium underline-offset-2 hover:underline">
                      {clientDisplayName(q.client)}
                    </Link>
                  </TableCell>
                  <TableCell>{LOB_LABELS[q.lineOfBusiness]}</TableCell>
                  <TableCell>{q._count.requests}</TableCell>
                  <TableCell>
                    <Badge className={statusClass(QUOTE_STATUS_TONE, q.status)}>{QUOTE_STATUS_LABELS[q.status]}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(q.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <ListPagination page={page} totalPages={pages} basePath="/quotes" searchParams={{}} />
      </Card>
      </FadeIn>
    </div>
  );
}
