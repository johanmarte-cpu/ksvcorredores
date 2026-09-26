"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requiredString } from "@/lib/validation";
import { buildPaymentSchedule } from "@/lib/payment-schedule";

const policySchema = z.object({
  clientId: requiredString("Selecciona un cliente"),
  insurerId: requiredString("Selecciona una aseguradora"),
  productId: requiredString("Selecciona un producto"),
  policyNumber: z.string().min(1, "El número de póliza es requerido"),
  premium: z.coerce.number().positive("La prima debe ser mayor a 0"),
  commissionPercentage: z.coerce.number().min(0).max(100),
  paymentFrequency: z.enum(["SINGLE", "MONTHLY", "QUARTERLY", "SEMIANNUAL", "ANNUAL"]),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});

export async function createPolicy(_prevState: { error?: string } | undefined, formData: FormData) {
  const parsed = policySchema.safeParse({
    clientId: formData.get("clientId"),
    insurerId: formData.get("insurerId"),
    productId: formData.get("productId"),
    policyNumber: formData.get("policyNumber"),
    premium: formData.get("premium"),
    commissionPercentage: formData.get("commissionPercentage"),
    paymentFrequency: formData.get("paymentFrequency"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const commissionAmount = (parsed.data.premium * parsed.data.commissionPercentage) / 100;
  const startDate = new Date(parsed.data.startDate);
  const schedule = buildPaymentSchedule(parsed.data.premium, parsed.data.paymentFrequency, startDate);

  let policyId: string;
  try {
    const policy = await prisma.$transaction(async (tx) => {
      const created = await tx.policy.create({
        data: {
          clientId: parsed.data.clientId,
          insurerId: parsed.data.insurerId,
          productId: parsed.data.productId,
          policyNumber: parsed.data.policyNumber,
          premium: parsed.data.premium,
          commissionPercentage: parsed.data.commissionPercentage,
          commissionAmount,
          paymentFrequency: parsed.data.paymentFrequency,
          startDate,
          endDate: new Date(parsed.data.endDate),
          status: "ACTIVE",
        },
      });
      await tx.policyPayment.createMany({
        data: schedule.map((installment) => ({
          policyId: created.id,
          amount: installment.amount,
          dueDate: installment.dueDate,
          status: "PENDING",
        })),
      });
      return created;
    });
    policyId = policy.id;
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return { error: "Ya existe una póliza con ese número" };
    }
    return { error: "No se pudo crear la póliza" };
  }

  revalidatePath("/policies");
  redirect(`/policies/${policyId}`);
}

const paymentSchema = z.object({
  policyId: z.string().min(1),
  amount: z.coerce.number().positive(),
  dueDate: z.string().min(1),
});

export async function registerPayment(_prevState: { error?: string } | undefined, formData: FormData) {
  const parsed = paymentSchema.safeParse({
    policyId: formData.get("policyId"),
    amount: formData.get("amount"),
    dueDate: formData.get("dueDate"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  await prisma.policyPayment.create({
    data: {
      policyId: parsed.data.policyId,
      amount: parsed.data.amount,
      dueDate: new Date(parsed.data.dueDate),
      status: "PENDING",
    },
  });

  revalidatePath(`/policies/${parsed.data.policyId}`);
  return { success: true };
}

export async function markPaymentPaid(policyId: string, paymentId: string) {
  await prisma.policyPayment.update({
    where: { id: paymentId },
    data: { status: "PAID", paidDate: new Date() },
  });
  revalidatePath(`/policies/${policyId}`);
}
