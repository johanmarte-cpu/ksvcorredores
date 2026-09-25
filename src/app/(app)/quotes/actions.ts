"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

const quoteSchema = z.object({
  clientId: z.string().min(1),
  lineOfBusiness: z.enum(["AUTO", "LIFE", "HEALTH", "PROPERTY", "LIABILITY", "OTHER"]),
  notes: z.string().optional(),
});

export async function createQuote(_prevState: { error?: string } | undefined, formData: FormData) {
  const session = await auth();
  const parsed = quoteSchema.safeParse({
    clientId: formData.get("clientId"),
    lineOfBusiness: formData.get("lineOfBusiness"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const quote = await prisma.quote.create({
    data: { ...parsed.data, status: "DRAFT", requestedById: session?.user?.id },
  });

  revalidatePath("/quotes");
  redirect(`/quotes/${quote.id}`);
}

const requestSchema = z.object({
  quoteId: z.string().min(1),
  insurerId: z.string().min(1),
  productId: z.string().optional(),
});

export async function sendQuoteRequest(_prevState: { error?: string } | undefined, formData: FormData) {
  const parsed = requestSchema.safeParse({
    quoteId: formData.get("quoteId"),
    insurerId: formData.get("insurerId"),
    productId: formData.get("productId") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  await prisma.$transaction([
    prisma.quoteRequest.create({
      data: {
        quoteId: parsed.data.quoteId,
        insurerId: parsed.data.insurerId,
        productId: parsed.data.productId,
        status: "PENDING",
        sentAt: new Date(),
      },
    }),
    prisma.quote.update({
      where: { id: parsed.data.quoteId },
      data: { status: "SENT" },
    }),
  ]);

  revalidatePath(`/quotes/${parsed.data.quoteId}`);
  return { success: true };
}

const optionSchema = z.object({
  quoteId: z.string().min(1),
  quoteRequestId: z.string().min(1),
  premium: z.coerce.number().positive(),
  coverageSummary: z.string().optional(),
  deductible: z.coerce.number().optional(),
  termMonths: z.coerce.number().int().positive().default(12),
});

export async function registerQuoteOption(_prevState: { error?: string } | undefined, formData: FormData) {
  const parsed = optionSchema.safeParse({
    quoteId: formData.get("quoteId"),
    quoteRequestId: formData.get("quoteRequestId"),
    premium: formData.get("premium"),
    coverageSummary: formData.get("coverageSummary") || undefined,
    deductible: formData.get("deductible") || undefined,
    termMonths: formData.get("termMonths") || 12,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  await prisma.$transaction([
    prisma.quoteOption.create({
      data: {
        quoteRequestId: parsed.data.quoteRequestId,
        premium: parsed.data.premium,
        coverageSummary: parsed.data.coverageSummary,
        deductible: parsed.data.deductible,
        termMonths: parsed.data.termMonths,
      },
    }),
    prisma.quoteRequest.update({
      where: { id: parsed.data.quoteRequestId },
      data: { status: "RESPONDED", respondedAt: new Date() },
    }),
    prisma.quote.update({
      where: { id: parsed.data.quoteId },
      data: { status: "IN_REVIEW" },
    }),
  ]);

  revalidatePath(`/quotes/${parsed.data.quoteId}`);
  return { success: true };
}

export async function selectQuoteOption(quoteId: string, quoteOptionId: string) {
  const requests = await prisma.quoteRequest.findMany({
    where: { quoteId },
    include: { option: true },
  });
  const optionIds = requests.map((r) => r.option?.id).filter(Boolean) as string[];

  await prisma.$transaction([
    prisma.quoteOption.updateMany({
      where: { id: { in: optionIds } },
      data: { isSelected: false },
    }),
    prisma.quoteOption.update({
      where: { id: quoteOptionId },
      data: { isSelected: true },
    }),
    prisma.quote.update({
      where: { id: quoteId },
      data: { status: "COMPARED" },
    }),
  ]);

  revalidatePath(`/quotes/${quoteId}`);
}

const convertSchema = z.object({
  quoteId: z.string().min(1),
  quoteRequestId: z.string().min(1),
  policyNumber: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  paymentFrequency: z.enum(["SINGLE", "MONTHLY", "QUARTERLY", "SEMIANNUAL", "ANNUAL"]),
  commissionPercentage: z.coerce.number().min(0).max(100),
});

export async function convertQuoteToPolicy(_prevState: { error?: string } | undefined, formData: FormData) {
  const parsed = convertSchema.safeParse({
    quoteId: formData.get("quoteId"),
    quoteRequestId: formData.get("quoteRequestId"),
    policyNumber: formData.get("policyNumber"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    paymentFrequency: formData.get("paymentFrequency"),
    commissionPercentage: formData.get("commissionPercentage"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const request = await prisma.quoteRequest.findUnique({
    where: { id: parsed.data.quoteRequestId },
    include: { option: true, quote: true },
  });
  if (!request?.option || !request.productId) {
    return { error: "Esta solicitud no tiene una propuesta registrada o producto asociado" };
  }

  const premium = Number(request.option.premium);
  const commissionAmount = (premium * parsed.data.commissionPercentage) / 100;

  let policyId: string;
  try {
    const policy = await prisma.$transaction(async (tx) => {
      const created = await tx.policy.create({
        data: {
          policyNumber: parsed.data.policyNumber,
          clientId: request.quote.clientId,
          insurerId: request.insurerId,
          productId: request.productId!,
          quoteId: request.quoteId,
          premium,
          commissionPercentage: parsed.data.commissionPercentage,
          commissionAmount,
          paymentFrequency: parsed.data.paymentFrequency,
          startDate: new Date(parsed.data.startDate),
          endDate: new Date(parsed.data.endDate),
          status: "ACTIVE",
        },
      });
      await tx.quote.update({ where: { id: request.quoteId }, data: { status: "CONVERTED" } });
      return created;
    });
    policyId = policy.id;
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return { error: "Ya existe una póliza con ese número" };
    }
    return { error: "No se pudo crear la póliza" };
  }

  revalidatePath(`/quotes/${parsed.data.quoteId}`);
  revalidatePath("/policies");
  redirect(`/policies/${policyId}`);
}
