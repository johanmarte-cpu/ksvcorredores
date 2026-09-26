"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import type {
  ThirdPartyType,
  IdentificationType,
  Sex,
  CorrespondenceAddress,
  EconomicActivity,
  MonthlyIncomeRange,
  InsuranceBranch,
} from "@/generated/prisma/client";

const THIRD_PARTY_TYPES: ThirdPartyType[] = [
  "TOMADOR",
  "ASEGURADO",
  "BENEFICIARIO",
  "AFIANZADO",
  "PROVEEDOR",
  "EMPLEADO",
  "APODERADO",
];

const emptyToUndefined = (v: unknown) => (v === null || v === "" || v === undefined ? undefined : v);
const optionalString = z.preprocess(emptyToUndefined, z.string().optional());

const schema = z.object({
  clientId: z.string().min(1),
  branch: optionalString,
  idType: optionalString,
  idNumber: optionalString,
  idExpirationDate: optionalString,
  sex: optionalString,
  birthDate: optionalString,
  birthCity: optionalString,
  birthProvince: optionalString,
  nationality: optionalString,
  profession: optionalString,
  occupation: optionalString,
  employer: optionalString,
  employerAddress: optionalString,
  employerCity: optionalString,
  employerProvince: optionalString,
  employerPhone: optionalString,
  residenceCity: optionalString,
  residenceProvince: optionalString,
  residenceCountry: optionalString,
  residencePhone: optionalString,
  residenceCell: optionalString,
  residenceAddress: optionalString,
  sector: optionalString,
  correspondenceAddress: optionalString,
  economicActivity: optionalString,
  economicActivityOther: optionalString,
  monthlyIncomeRange: optionalString,
  otherIncomeAmount: optionalString,
  otherIncomeDescription: optionalString,
  hasManagedPublicFunds: optionalString,
  hasManagedPublicFundsDetail: optionalString,
  hasHeldPublicOffice: optionalString,
  hasHeldPublicOfficeDetail: optionalString,
  isPep: optionalString,
  isPepDetail: optionalString,
  relativeIsPep: optionalString,
  relativeIsPepDetail: optionalString,
  insuranceBranch: optionalString,
  insuranceBranchOther: optionalString,
  verificationDate: optionalString,
  verifierCode: optionalString,
});

const toBool = (v?: string) => (v === undefined ? undefined : v === "true");
const toDate = (v?: string) => (v ? new Date(v) : undefined);
const toNum = (v?: string) => (v ? Number(v) : undefined);

export async function upsertKnowledgeForm(_prevState: { error?: string } | undefined, formData: FormData) {
  const session = await auth();
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const thirdPartyTypes = formData.getAll("thirdPartyTypes").filter((v): v is string => typeof v === "string" && THIRD_PARTY_TYPES.includes(v as ThirdPartyType)) as ThirdPartyType[];

  const data = {
    thirdPartyTypes,
    branch: parsed.data.branch,
    idType: parsed.data.idType as IdentificationType | undefined,
    idNumber: parsed.data.idNumber,
    idExpirationDate: toDate(parsed.data.idExpirationDate),
    sex: parsed.data.sex as Sex | undefined,
    birthDate: toDate(parsed.data.birthDate),
    birthCity: parsed.data.birthCity,
    birthProvince: parsed.data.birthProvince,
    nationality: parsed.data.nationality,
    profession: parsed.data.profession,
    occupation: parsed.data.occupation,
    employer: parsed.data.employer,
    employerAddress: parsed.data.employerAddress,
    employerCity: parsed.data.employerCity,
    employerProvince: parsed.data.employerProvince,
    employerPhone: parsed.data.employerPhone,
    residenceCity: parsed.data.residenceCity,
    residenceProvince: parsed.data.residenceProvince,
    residenceCountry: parsed.data.residenceCountry,
    residencePhone: parsed.data.residencePhone,
    residenceCell: parsed.data.residenceCell,
    residenceAddress: parsed.data.residenceAddress,
    sector: parsed.data.sector,
    correspondenceAddress: parsed.data.correspondenceAddress as CorrespondenceAddress | undefined,
    economicActivity: parsed.data.economicActivity as EconomicActivity | undefined,
    economicActivityOther: parsed.data.economicActivityOther,
    monthlyIncomeRange: parsed.data.monthlyIncomeRange as MonthlyIncomeRange | undefined,
    otherIncomeAmount: toNum(parsed.data.otherIncomeAmount),
    otherIncomeDescription: parsed.data.otherIncomeDescription,
    hasManagedPublicFunds: toBool(parsed.data.hasManagedPublicFunds),
    hasManagedPublicFundsDetail: parsed.data.hasManagedPublicFundsDetail,
    hasHeldPublicOffice: toBool(parsed.data.hasHeldPublicOffice),
    hasHeldPublicOfficeDetail: parsed.data.hasHeldPublicOfficeDetail,
    isPep: toBool(parsed.data.isPep),
    isPepDetail: parsed.data.isPepDetail,
    relativeIsPep: toBool(parsed.data.relativeIsPep),
    relativeIsPepDetail: parsed.data.relativeIsPepDetail,
    insuranceBranch: parsed.data.insuranceBranch as InsuranceBranch | undefined,
    insuranceBranchOther: parsed.data.insuranceBranchOther,
    verificationDate: toDate(parsed.data.verificationDate),
    verifierCode: parsed.data.verifierCode,
    completedById: session?.user?.id,
  };

  await prisma.clientKnowledgeForm.upsert({
    where: { clientId: parsed.data.clientId },
    create: { clientId: parsed.data.clientId, ...data },
    update: data,
  });

  revalidatePath(`/clients/${parsed.data.clientId}`);
  revalidatePath(`/clients/${parsed.data.clientId}/knowledge-form`);
  return { success: true };
}
