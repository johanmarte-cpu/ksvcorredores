"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { SETTINGS_ID } from "@/lib/settings";

const settingsSchema = z.object({
  itbisRate: z.coerce.number().min(0).max(100),
  downPaymentRate: z.coerce.number().min(0).max(100),
  paymentReminderDays: z.coerce.number().int().min(0).max(90),
  renewalNoticeDays: z.coerce.number().int().min(0).max(180),
  companyName: z.string().min(1, "El nombre de la empresa es obligatorio"),
  companyTaxId: z.string().optional(),
  companyPhone: z.string().optional(),
  companyEmail: z.string().email("Correo inválido").optional().or(z.literal("")),
  companyAddress: z.string().optional(),
});

export async function updateSettings(_prevState: { error?: string; success?: boolean } | undefined, formData: FormData) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return { error: "No tienes permisos para esta acción" };

  const parsed = settingsSchema.safeParse({
    itbisRate: formData.get("itbisRate"),
    downPaymentRate: formData.get("downPaymentRate"),
    paymentReminderDays: formData.get("paymentReminderDays"),
    renewalNoticeDays: formData.get("renewalNoticeDays"),
    companyName: formData.get("companyName"),
    companyTaxId: formData.get("companyTaxId"),
    companyPhone: formData.get("companyPhone"),
    companyEmail: formData.get("companyEmail"),
    companyAddress: formData.get("companyAddress"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  await prisma.systemSettings.upsert({
    where: { id: SETTINGS_ID },
    update: {
      itbisRate: parsed.data.itbisRate,
      downPaymentRate: parsed.data.downPaymentRate,
      paymentReminderDays: parsed.data.paymentReminderDays,
      renewalNoticeDays: parsed.data.renewalNoticeDays,
      companyName: parsed.data.companyName,
      companyTaxId: parsed.data.companyTaxId || null,
      companyPhone: parsed.data.companyPhone || null,
      companyEmail: parsed.data.companyEmail || null,
      companyAddress: parsed.data.companyAddress || null,
      updatedById: session.user.id,
    },
    create: {
      id: SETTINGS_ID,
      itbisRate: parsed.data.itbisRate,
      downPaymentRate: parsed.data.downPaymentRate,
      paymentReminderDays: parsed.data.paymentReminderDays,
      renewalNoticeDays: parsed.data.renewalNoticeDays,
      companyName: parsed.data.companyName,
      companyTaxId: parsed.data.companyTaxId || null,
      companyPhone: parsed.data.companyPhone || null,
      companyEmail: parsed.data.companyEmail || null,
      companyAddress: parsed.data.companyAddress || null,
      updatedById: session.user.id,
    },
  });

  revalidatePath("/settings");
  return { success: true };
}
