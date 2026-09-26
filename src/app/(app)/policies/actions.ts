"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requiredString } from "@/lib/validation";
import { buildPaymentSchedule, buildCustomInstallments } from "@/lib/payment-schedule";
import { calculateItbis } from "@/lib/tax";

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
  const { itbisAmount, totalAmount } = calculateItbis(parsed.data.premium);
  const startDate = new Date(parsed.data.startDate);
  const schedule = buildPaymentSchedule(totalAmount, parsed.data.paymentFrequency, startDate);

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
          itbisAmount,
          totalAmount,
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

const scheduleSchema = z.object({
  policyId: requiredString("Póliza inválida"),
  installments: z.coerce.number().int().min(1, "Debe ser al menos 1 cuota").max(36, "Máximo 36 cuotas"),
  startDate: z.string().min(1, "La fecha de la primera cuota es requerida"),
});

/**
 * Rebuilds a policy's pending "acuerdo de pago" into a custom number of installments,
 * independent of its contractual paymentFrequency (e.g. an annual policy billed in quotas).
 * Already-paid installments are left untouched; only the remaining balance is rescheduled.
 */
export async function updatePaymentSchedule(_prevState: { error?: string } | undefined, formData: FormData) {
  const parsed = scheduleSchema.safeParse({
    policyId: formData.get("policyId"),
    installments: formData.get("installments"),
    startDate: formData.get("startDate"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const policy = await prisma.policy.findUnique({
    where: { id: parsed.data.policyId },
    include: { payments: true },
  });
  if (!policy) return { error: "Póliza no encontrada" };

  const paidAmount = policy.payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const remaining = Math.round((Number(policy.totalAmount) - paidAmount) * 100) / 100;

  if (remaining <= 0) {
    return { error: "Esta póliza ya está completamente pagada, no hay saldo para reprogramar" };
  }

  const pendingIds = policy.payments.filter((p) => p.status !== "PAID").map((p) => p.id);
  const schedule = buildCustomInstallments(remaining, parsed.data.installments, new Date(parsed.data.startDate));

  await prisma.$transaction([
    prisma.policyPayment.deleteMany({ where: { id: { in: pendingIds } } }),
    prisma.policyPayment.createMany({
      data: schedule.map((installment) => ({
        policyId: policy.id,
        amount: installment.amount,
        dueDate: installment.dueDate,
        status: "PENDING",
      })),
    }),
  ]);

  revalidatePath(`/policies/${policy.id}`);
  return { success: true };
}
