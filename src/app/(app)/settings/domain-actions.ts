"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getSettings, SETTINGS_ID } from "@/lib/settings";

async function requireResendClient() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return { error: "No tienes permisos para esta acción" } as const;

  const settings = await getSettings();
  const apiKey = settings.resendApiKey || process.env.RESEND_API_KEY;
  if (!apiKey) return { error: "Configura primero una Resend API Key en la sección Correo." } as const;

  return { resend: new Resend(apiKey), settings } as const;
}

const domainSchema = z.object({ domain: z.string().min(3, "Ingresa un dominio válido") });

export async function getDomainStatus() {
  const settings = await getSettings();
  if (!settings.resendDomainId) return null;

  const apiKey = settings.resendApiKey || process.env.RESEND_API_KEY;
  if (!apiKey) return null;

  const resend = new Resend(apiKey);
  const { data, error } = await resend.domains.get(settings.resendDomainId);
  if (error || !data) return { error: error?.message ?? "No se pudo obtener el estado del dominio" };

  return { name: data.name, status: data.status, records: data.records };
}

export async function registerDomain(_prevState: { error?: string; success?: boolean } | undefined, formData: FormData) {
  const ctx = await requireResendClient();
  if ("error" in ctx) return { error: ctx.error };

  const parsed = domainSchema.safeParse({ domain: formData.get("domain") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dominio inválido" };

  const { data, error } = await ctx.resend.domains.create({ name: parsed.data.domain });
  if (error || !data) return { error: error?.message ?? "No se pudo registrar el dominio en Resend" };

  await prisma.systemSettings.update({
    where: { id: SETTINGS_ID },
    data: { emailDomain: data.name, resendDomainId: data.id },
  });

  revalidatePath("/settings");
  return { success: true };
}

export async function verifyDomain() {
  const ctx = await requireResendClient();
  if ("error" in ctx) return;
  if (!ctx.settings.resendDomainId) return;

  await ctx.resend.domains.verify(ctx.settings.resendDomainId);
  revalidatePath("/settings");
}

export async function removeDomain() {
  const ctx = await requireResendClient();
  if ("error" in ctx) return;
  if (!ctx.settings.resendDomainId) return;

  await ctx.resend.domains.remove(ctx.settings.resendDomainId);
  await prisma.systemSettings.update({
    where: { id: SETTINGS_ID },
    data: { emailDomain: null, resendDomainId: null },
  });

  revalidatePath("/settings");
}
