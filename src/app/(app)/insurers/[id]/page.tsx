import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { NewProductForm, NewCommissionForm } from "./product-forms";

export default async function InsurerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const insurer = await prisma.insurer.findUnique({
    where: { id },
    include: {
      products: true,
      contacts: true,
      commissionRates: { include: { product: true }, orderBy: { effectiveFrom: "desc" } },
    },
  });

  if (!insurer) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{insurer.name}</h1>
        <p className="text-sm text-muted-foreground">
          {insurer.email || "sin correo"} · {insurer.phone || "sin teléfono"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Productos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <NewProductForm insurerId={insurer.id} />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Ramo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {insurer.products.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">
                    Sin productos
                  </TableCell>
                </TableRow>
              )}
              {insurer.products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.name}</TableCell>
                  <TableCell>{p.lineOfBusiness}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tasas de comisión</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <NewCommissionForm insurerId={insurer.id} products={insurer.products} />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>%</TableHead>
                <TableHead>Vigente desde</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {insurer.commissionRates.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    Sin tasas registradas
                  </TableCell>
                </TableRow>
              )}
              {insurer.commissionRates.map((rate) => (
                <TableRow key={rate.id}>
                  <TableCell>{rate.product?.name ?? "—"}</TableCell>
                  <TableCell>{rate.percentage.toString()}%</TableCell>
                  <TableCell>{formatDate(rate.effectiveFrom)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
