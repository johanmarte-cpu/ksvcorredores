"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

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
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  try {
    await prisma.client.create({
      data: { ...parsed.data, assignedToId: session?.user?.id },
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

export async function addClientNote(clientId: string, content: string) {
  const session = await auth();
  if (!content.trim()) return;
  await prisma.clientNote.create({
    data: { clientId, content, authorId: session?.user?.id },
  });
  revalidatePath(`/clients/${clientId}`);
}
