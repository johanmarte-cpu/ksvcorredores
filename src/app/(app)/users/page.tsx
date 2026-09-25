import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NewUserDialog } from "./new-user-dialog";
import { ToggleActiveButton } from "./toggle-active-switch";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  BROKER: "Corredor/ejecutivo",
  CUSTOMER_SERVICE: "Servicio al cliente",
  ACCOUNTING: "Contabilidad",
  READ_ONLY: "Solo lectura",
};

export default async function UsersPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");

  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Usuarios</h1>
        <NewUserDialog />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{ROLE_LABELS[u.role]}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.active ? "secondary" : "outline"}>{u.active ? "Activo" : "Inactivo"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <ToggleActiveButton userId={u.id} active={u.active} />
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
