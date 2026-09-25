"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

const claimSchema = z.object({
  policyId: z.string().min(1),
  caseNumber: z.string().min(1),
  incidentDate: z.string().min(1),
  claimType: z.string().min(1),
  description: z.string().optional(),
});

export async function createClaim(_prevState: { error?: string } | undefined, formData: FormData) {
  const parsed = claimSchema.safeParse({
    policyId: formData.get("policyId"),
    caseNumber: formData.get("caseNumber"),
    incidentDate: formData.get("incidentDate"),
    claimType: formData.get("claimType"),
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  let claimId: string;
  try {
    const claim = await prisma.claim.create({
      data: {
        policyId: parsed.data.policyId,
        caseNumber: parsed.data.caseNumber,
        incidentDate: new Date(parsed.data.incidentDate),
        claimType: parsed.data.claimType,
        description: parsed.data.description,
        status: "OPEN",
      },
    });
    claimId = claim.id;
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return { error: "Ya existe una reclamación con ese número de caso" };
    }
    return { error: "No se pudo crear la reclamación" };
  }

  revalidatePath("/claims");
  redirect(`/claims/${claimId}`);
}

export async function addClaimEvent(claimId: string, content: string) {
  const session = await auth();
  if (!content.trim()) return;
  await prisma.claimEvent.create({
    data: { claimId, content, authorId: session?.user?.id, type: "COMMENT" },
  });
  revalidatePath(`/claims/${claimId}`);
}

const statusSchema = z.enum(["OPEN", "IN_REVIEW", "WITH_INSURER", "APPROVED", "REJECTED", "PAID", "CLOSED"]);

export async function updateClaimStatus(claimId: string, status: string) {
  const parsed = statusSchema.safeParse(status);
  if (!parsed.success) return;

  const session = await auth();
  await prisma.$transaction([
    prisma.claim.update({ where: { id: claimId }, data: { status: parsed.data } }),
    prisma.claimEvent.create({
      data: {
        claimId,
        content: `Estado actualizado a ${parsed.data}`,
        type: "STATUS_CHANGE",
        authorId: session?.user?.id,
      },
    }),
  ]);

  revalidatePath(`/claims/${claimId}`);
}
