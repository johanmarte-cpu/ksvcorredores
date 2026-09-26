import { auth } from "@/auth";
import { buildClientImportTemplate } from "@/lib/client-import";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return Response.json({ error: "No autorizado" }, { status: 403 });
  }

  const buffer = buildClientImportTemplate();
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="plantilla-clientes.xlsx"',
    },
  });
}
