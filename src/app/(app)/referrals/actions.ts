"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

const referrerSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  phone: z.string().optional(),
  email: z.string().email("Correo inválido").optional().or(z.literal("")),
  taxId: z.string().optional(),
  notes: z.string().optional(),
});

export async function createReferrer(_prevState: { error?: string } | undefined, formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "No autenticado" };

  const parsed = referrerSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || undefined,
    taxId: formData.get("taxId") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  await prisma.referrer.create({ data: parsed.data });

  revalidatePath("/referrals");
  return { success: true };
}

export async function toggleReferrerActive(referrerId: string, active: boolean) {
  await prisma.referrer.update({ where: { id: referrerId }, data: { active } });
  revalidatePath("/referrals");
}

const assignReferralSchema = z.object({
  policyId: z.string().min(1),
  referrerId: z.string().min(1, "Selecciona un referido"),
  percentage: z.coerce.number().min(0).max(100),
});

export async function assignPolicyReferral(_prevState: { error?: string } | undefined, formData: FormData) {
  const parsed = assignReferralSchema.safeParse({
    policyId: formData.get("policyId"),
    referrerId: formData.get("referrerId"),
    percentage: formData.get("percentage"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const policy = await prisma.policy.findUnique({ where: { id: parsed.data.policyId } });
  if (!policy) return { error: "Póliza no encontrada" };

  const amount = (Number(policy.premium) * parsed.data.percentage) / 100;

  await prisma.policyReferral.upsert({
    where: { policyId: parsed.data.policyId },
    update: { referrerId: parsed.data.referrerId, percentage: parsed.data.percentage, amount },
    create: {
      policyId: parsed.data.policyId,
      referrerId: parsed.data.referrerId,
      percentage: parsed.data.percentage,
      amount,
    },
  });

  revalidatePath(`/policies/${parsed.data.policyId}`);
  revalidatePath("/referrals");
  return { success: true };
}

export async function markReferralPaid(policyId: string, referralId: string) {
  await prisma.policyReferral.update({
    where: { id: referralId },
    data: { status: "PAID", paidDate: new Date() },
  });
  revalidatePath(`/policies/${policyId}`);
  revalidatePath("/referrals");
}

export async function removePolicyReferral(policyId: string, referralId: string) {
  await prisma.policyReferral.delete({ where: { id: referralId } });
  revalidatePath(`/policies/${policyId}`);
  revalidatePath("/referrals");
}
