"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const commissionSchema = z.object({
  policyId: z.string().min(1),
  period: z.string().min(1),
  expectedAmount: z.coerce.number().positive(),
});

export async function createPolicyCommission(_prevState: { error?: string } | undefined, formData: FormData) {
  const parsed = commissionSchema.safeParse({
    policyId: formData.get("policyId"),
    period: formData.get("period"),
    expectedAmount: formData.get("expectedAmount"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  await prisma.policyCommission.create({
    data: {
      policyId: parsed.data.policyId,
      period: parsed.data.period,
      expectedAmount: parsed.data.expectedAmount,
      status: "EXPECTED",
    },
  });

  revalidatePath(`/policies/${parsed.data.policyId}`);
  revalidatePath("/commissions");
  return { success: true };
}

export async function markCommissionReceived(policyId: string, commissionId: string, receivedAmount: number) {
  const commission = await prisma.policyCommission.findUnique({ where: { id: commissionId } });
  if (!commission) return;

  const status = receivedAmount >= Number(commission.expectedAmount) ? "RECEIVED" : "PARTIAL";

  await prisma.policyCommission.update({
    where: { id: commissionId },
    data: { receivedAmount, receivedDate: new Date(), status },
  });

  revalidatePath(`/policies/${policyId}`);
  revalidatePath("/commissions");
}
