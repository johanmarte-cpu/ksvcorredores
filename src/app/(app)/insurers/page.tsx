import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { toneClass } from "@/lib/status-colors";
import { NewInsurerDialog } from "./new-insurer-dialog";
import { FadeIn } from "@/components/effects/fade-in";
import { ListPagination } from "@/components/ui/list-pagination";
import { parsePage, paginate, totalPages as computeTotalPages } from "@/lib/pagination";

export default async function InsurersPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams;
  const page = parsePage(pageParam);

  const [insurers, count] = await Promise.all([
    prisma.insurer.findMany({
      orderBy: { name: "asc" },
      include: { products: true, _count: { select: { policies: true } } },
      ...paginate(page),
    }),
    prisma.insurer.count(),
  ]);
  const pages = computeTotalPages(count);

  return (
    <div className="space-y-4">
      <FadeIn className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Aseguradoras</h1>
        <NewInsurerDialog />
      </FadeIn>

      <FadeIn delay={0.1}>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Productos</TableHead>
                <TableHead>Pólizas</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {insurers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    Aún no hay aseguradoras en el catálogo.
                  </TableCell>
                </TableRow>
              )}
              {insurers.map((insurer) => (
                <TableRow key={insurer.id}>
                  <TableCell>
                    <Link href={`/insurers/${insurer.id}`} className="font-medium underline-offset-2 hover:underline">
                      {insurer.name}
                    </Link>
                  </TableCell>
                  <TableCell className="space-x-1">
                    {insurer.products.length === 0 && <span className="text-muted-foreground">—</span>}
                    {insurer.products.map((p) => (
                      <Badge key={p.id} className={toneClass("blue")}>
                        {p.name}
                      </Badge>
                    ))}
                  </TableCell>
                  <TableCell>{insurer._count.policies}</TableCell>
                  <TableCell>
                    <Badge className={toneClass(insurer.active ? "emerald" : "slate")}>
                      {insurer.active ? "Activa" : "Inactiva"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <ListPagination page={page} totalPages={pages} basePath="/insurers" searchParams={{}} />
      </Card>
      </FadeIn>
    </div>
  );
}
