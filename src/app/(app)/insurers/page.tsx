import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { NewInsurerDialog } from "./new-insurer-dialog";

export default async function InsurersPage() {
  const insurers = await prisma.insurer.findMany({
    orderBy: { name: "asc" },
    include: { products: true, _count: { select: { policies: true } } },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Aseguradoras</h1>
        <NewInsurerDialog />
      </div>

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
                      <Badge key={p.id} variant="outline">
                        {p.name}
                      </Badge>
                    ))}
                  </TableCell>
                  <TableCell>{insurer._count.policies}</TableCell>
                  <TableCell>
                    <Badge variant={insurer.active ? "secondary" : "outline"}>
                      {insurer.active ? "Activa" : "Inactiva"}
                    </Badge>
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
