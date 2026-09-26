"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { parseClientImportWorkbook, type ClientImportError } from "@/lib/client-import";

const ALLOWED_EXTENSIONS = [".xlsx", ".xls", ".csv"];
const MAX_IMPORT_SIZE = 5 * 1024 * 1024; // 5MB

export type ClientImportResult =
  | { error: string }
  | { success: true; inserted: number; skipped: number; errors: ClientImportError[] };

export async function importClients(_prevState: ClientImportResult | undefined, formData: FormData): Promise<ClientImportResult> {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return { error: "No tienes permisos para esta acción" };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Selecciona un archivo para importar" };

  const name = file.name.toLowerCase();
  if (!ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext))) {
    return { error: "Formato no soportado. Usa un archivo .xlsx, .xls o .csv" };
  }
  if (file.size > MAX_IMPORT_SIZE) return { error: "El archivo es demasiado grande (máx. 5MB)" };

  const buffer = Buffer.from(await file.arrayBuffer());
  let parsed: ReturnType<typeof parseClientImportWorkbook>;
  try {
    parsed = parseClientImportWorkbook(buffer);
  } catch {
    return { error: "No se pudo leer el archivo. Verifica que sea un .xlsx, .xls o .csv válido." };
  }

  const { rows, errors: parseErrors } = parsed;
  if (rows.length === 0 && parseErrors.length === 0) {
    return { error: "No se encontraron filas con datos en el archivo" };
  }

  const errors: ClientImportError[] = [...parseErrors];

  const existing = await prisma.client.findMany({
    where: { taxId: { in: rows.map((r) => r.taxId) } },
    select: { taxId: true },
  });
  const existingTaxIds = new Set(existing.map((c) => c.taxId));
  const seenInFile = new Set<string>();

  let inserted = 0;
  let skipped = 0;

  for (const row of rows) {
    if (existingTaxIds.has(row.taxId)) {
      skipped++;
      errors.push({ row: row.row, message: `Ya existe un cliente con la cédula/RNC ${row.taxId}; se omitió.` });
      continue;
    }
    if (seenInFile.has(row.taxId)) {
      skipped++;
      errors.push({ row: row.row, message: `Cédula/RNC ${row.taxId} repetida en el archivo; se omitió.` });
      continue;
    }
    seenInFile.add(row.taxId);

    try {
      await prisma.client.create({
        data: {
          type: row.type,
          firstName: row.firstName,
          lastName: row.lastName,
          companyName: row.companyName,
          taxId: row.taxId,
          email: row.email,
          phone: row.phone,
          address: row.address,
          city: row.city,
          birthDate: row.birthDate,
          assignedToId: session.user.id,
        },
      });
      inserted++;
    } catch {
      skipped++;
      errors.push({ row: row.row, message: `No se pudo crear el cliente con cédula/RNC ${row.taxId}.` });
    }
  }

  if (inserted > 0) revalidatePath("/clients");

  return { success: true, inserted, skipped, errors };
}
