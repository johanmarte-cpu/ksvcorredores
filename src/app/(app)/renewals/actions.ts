"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function generateRenewalTask(policyId: string) {
  const session = await auth();
  const policy = await prisma.policy.findUnique({
    where: { id: policyId },
    include: { client: true },
  });
  if (!policy) return;

  const existing = await prisma.policyRenewal.findFirst({
    where: { policyId, status: { in: ["PENDING", "IN_PROGRESS", "OFFERED"] } },
  });
  if (existing) return;

  await prisma.$transaction(async (tx) => {
    const task = await tx.task.create({
      data: {
        title: `Gestionar renovación — póliza ${policy.policyNumber}`,
        description: `La póliza ${policy.policyNumber} vence el ${policy.endDate.toISOString().slice(0, 10)}.`,
        dueDate: policy.endDate,
        assignedToId: policy.client.assignedToId ?? session?.user?.id,
        createdById: session?.user?.id,
        status: "PENDING",
        priority: "HIGH",
      },
    });

    await tx.policyRenewal.create({
      data: {
        policyId: policy.id,
        dueDate: policy.endDate,
        status: "PENDING",
        taskId: task.id,
      },
    });
  });

  revalidatePath("/renewals");
}

export async function markRenewalStatus(renewalId: string, status: "IN_PROGRESS" | "OFFERED" | "RENEWED" | "LAPSED" | "DECLINED") {
  await prisma.policyRenewal.update({ where: { id: renewalId }, data: { status } });
  revalidatePath("/renewals");
}
