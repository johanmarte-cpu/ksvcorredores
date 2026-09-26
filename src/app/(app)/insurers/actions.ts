"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requiredString } from "@/lib/validation";

const insurerSchema = z.object({
  name: z.string().min(1),
  taxId: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().optional(),
  address: z.string().optional(),
});

export async function createInsurer(_prevState: { error?: string } | undefined, formData: FormData) {
  const parsed = insurerSchema.safeParse({
    name: formData.get("name"),
    taxId: formData.get("taxId") || undefined,
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || undefined,
    website: formData.get("website") || undefined,
    address: formData.get("address") || undefined,
  });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  try {
    await prisma.insurer.create({ data: parsed.data });
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return { error: "Ya existe una aseguradora con ese nombre" };
    }
    return { error: "No se pudo crear la aseguradora" };
  }

  revalidatePath("/insurers");
  return { success: true };
}

const productSchema = z.object({
  insurerId: z.string().min(1),
  name: z.string().min(1),
  lineOfBusiness: z.enum(["AUTO", "LIFE", "HEALTH", "PROPERTY", "LIABILITY", "OTHER"]),
  description: z.string().optional(),
});

export async function createProduct(_prevState: { error?: string } | undefined, formData: FormData) {
  const parsed = productSchema.safeParse({
    insurerId: formData.get("insurerId"),
    name: formData.get("name"),
    lineOfBusiness: formData.get("lineOfBusiness"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  try {
    await prisma.insurerProduct.create({ data: parsed.data });
  } catch {
    return { error: "No se pudo crear el producto" };
  }

  revalidatePath(`/insurers/${parsed.data.insurerId}`);
  return { success: true };
}

const commissionSchema = z.object({
  insurerId: requiredString("Aseguradora inválida"),
  productId: requiredString("Selecciona un producto"),
  percentage: z.coerce.number().min(0).max(100),
  effectiveFrom: z.string().min(1),
});

export async function createCommissionRate(_prevState: { error?: string } | undefined, formData: FormData) {
  const parsed = commissionSchema.safeParse({
    insurerId: formData.get("insurerId"),
    productId: formData.get("productId"),
    percentage: formData.get("percentage"),
    effectiveFrom: formData.get("effectiveFrom"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  await prisma.insurerCommissionRate.create({
    data: {
      insurerId: parsed.data.insurerId,
      productId: parsed.data.productId,
      percentage: parsed.data.percentage,
      effectiveFrom: new Date(parsed.data.effectiveFrom),
    },
  });

  revalidatePath(`/insurers/${parsed.data.insurerId}`);
  return { success: true };
}
