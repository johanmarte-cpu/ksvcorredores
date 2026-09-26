"use server";

import { revalidatePath } from "next/cache";
import { put, del } from "@vercel/blob";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

const ALLOWED_DOCUMENT_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

const clientSchema = z.object({
  type: z.enum(["PERSON", "COMPANY"]),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  companyName: z.string().optional(),
  taxId: z.string().min(1, "La cédula/RNC es requerida"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  birthDate: z.string().optional(),
});

export async function createClient(_prevState: { error?: string } | undefined, formData: FormData) {
  const session = await auth();
  const parsed = clientSchema.safeParse({
    type: formData.get("type"),
    firstName: formData.get("firstName") || undefined,
    lastName: formData.get("lastName") || undefined,
    companyName: formData.get("companyName") || undefined,
    taxId: formData.get("taxId"),
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
    city: formData.get("city") || undefined,
    birthDate: formData.get("birthDate") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { birthDate, ...rest } = parsed.data;

  try {
    await prisma.client.create({
      data: { ...rest, birthDate: birthDate ? new Date(birthDate) : undefined, assignedToId: session?.user?.id },
    });
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return { error: "Ya existe un cliente con esa cédula/RNC" };
    }
    return { error: "No se pudo crear el cliente" };
  }

  revalidatePath("/clients");
  return { success: true };
}

export async function updateClient(_prevState: { error?: string } | undefined, formData: FormData) {
  const clientId = formData.get("clientId");
  if (typeof clientId !== "string" || !clientId) return { error: "Cliente inválido" };

  const parsed = clientSchema.safeParse({
    type: formData.get("type"),
    firstName: formData.get("firstName") || undefined,
    lastName: formData.get("lastName") || undefined,
    companyName: formData.get("companyName") || undefined,
    taxId: formData.get("taxId"),
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
    city: formData.get("city") || undefined,
    birthDate: formData.get("birthDate") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { birthDate, ...rest } = parsed.data;

  try {
    await prisma.client.update({
      where: { id: clientId },
      data: { ...rest, birthDate: birthDate ? new Date(birthDate) : null },
    });
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return { error: "Ya existe un cliente con esa cédula/RNC" };
    }
    return { error: "No se pudo actualizar el cliente" };
  }

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  return { success: true };
}

export async function addClientNote(clientId: string, content: string) {
  const session = await auth();
  if (!content.trim()) return;
  await prisma.clientNote.create({
    data: { clientId, content, authorId: session?.user?.id },
  });
  revalidatePath(`/clients/${clientId}`);
}

export async function uploadClientDocument(_prevState: { error?: string } | undefined, formData: FormData) {
  const session = await auth();
  const clientId = formData.get("clientId");
  const file = formData.get("file");

  if (typeof clientId !== "string" || !clientId) {
    return { error: "Cliente inválido" };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecciona un archivo" };
  }
  if (file.size > MAX_DOCUMENT_SIZE) {
    return { error: "El archivo no puede superar 10MB" };
  }
  if (file.type && !ALLOWED_DOCUMENT_TYPES.has(file.type)) {
    return { error: "Solo se permiten PDF, Word (.doc/.docx) o imágenes (JPG/PNG/WEBP)" };
  }

  let blobUrl: string;
  try {
    const blob = await put(`clients/${clientId}/${Date.now()}-${file.name}`, file, {
      access: "public",
    });
    blobUrl = blob.url;
  } catch {
    return { error: "No se pudo subir el archivo" };
  }

  await prisma.clientDocument.create({
    data: {
      clientId,
      name: file.name,
      fileUrl: blobUrl,
      fileType: file.type || null,
      uploadedById: session?.user?.id,
    },
  });

  revalidatePath(`/clients/${clientId}`);
  return { success: true };
}

export async function deleteClientDocument(clientId: string, documentId: string) {
  const document = await prisma.clientDocument.findUnique({ where: { id: documentId } });
  if (!document) return;

  try {
    await del(document.fileUrl);
  } catch {
    // Blob may already be gone — proceed with removing the record regardless.
  }

  await prisma.clientDocument.delete({ where: { id: documentId } });
  revalidatePath(`/clients/${clientId}`);
}
