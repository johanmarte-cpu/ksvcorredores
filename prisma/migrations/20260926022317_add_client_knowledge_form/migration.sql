-- CreateEnum
CREATE TYPE "ThirdPartyType" AS ENUM ('TOMADOR', 'ASEGURADO', 'BENEFICIARIO', 'AFIANZADO', 'PROVEEDOR', 'EMPLEADO', 'APODERADO');

-- CreateEnum
CREATE TYPE "IdentificationType" AS ENUM ('CEDULA', 'PASAPORTE', 'ID_RESIDENCIA');

-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('F', 'M');

-- CreateEnum
CREATE TYPE "CorrespondenceAddress" AS ENUM ('TRABAJO', 'CORREO_ELECTRONICO', 'RESIDENCIA');

-- CreateEnum
CREATE TYPE "EconomicActivity" AS ENUM ('EMPLEADO_ASALARIADO', 'PROPIETARIO_SOCIO', 'JUBILADO_PENSIONADO', 'INVERSIONISTA_PRESTAMISTA', 'INDEPENDIENTE', 'ESTUDIANTE', 'AMA_DE_CASA', 'OTRO');

-- CreateEnum
CREATE TYPE "MonthlyIncomeRange" AS ENUM ('UNDER_20K', 'FROM_20K_TO_50K', 'FROM_50K_TO_100K', 'OVER_100K');

-- CreateEnum
CREATE TYPE "InsuranceBranch" AS ENUM ('PERSONAS', 'GENERALES', 'FIANZAS', 'OTRO');

-- CreateTable
CREATE TABLE "client_knowledge_forms" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "thirdPartyTypes" "ThirdPartyType"[],
    "branch" TEXT,
    "idType" "IdentificationType",
    "idNumber" TEXT,
    "idExpirationDate" TIMESTAMP(3),
    "sex" "Sex",
    "birthDate" TIMESTAMP(3),
    "birthCity" TEXT,
    "birthProvince" TEXT,
    "nationality" TEXT,
    "profession" TEXT,
    "occupation" TEXT,
    "employer" TEXT,
    "employerAddress" TEXT,
    "employerCity" TEXT,
    "employerProvince" TEXT,
    "employerPhone" TEXT,
    "residenceCity" TEXT,
    "residenceProvince" TEXT,
    "residenceCountry" TEXT,
    "residencePhone" TEXT,
    "residenceCell" TEXT,
    "residenceAddress" TEXT,
    "sector" TEXT,
    "correspondenceAddress" "CorrespondenceAddress",
    "economicActivity" "EconomicActivity",
    "economicActivityOther" TEXT,
    "monthlyIncomeRange" "MonthlyIncomeRange",
    "otherIncomeAmount" DECIMAL(12,2),
    "otherIncomeDescription" TEXT,
    "hasManagedPublicFunds" BOOLEAN,
    "hasManagedPublicFundsDetail" TEXT,
    "hasHeldPublicOffice" BOOLEAN,
    "hasHeldPublicOfficeDetail" TEXT,
    "isPep" BOOLEAN,
    "isPepDetail" TEXT,
    "relativeIsPep" BOOLEAN,
    "relativeIsPepDetail" TEXT,
    "insuranceBranch" "InsuranceBranch",
    "insuranceBranchOther" TEXT,
    "verificationDate" TIMESTAMP(3),
    "verifierCode" TEXT,
    "completedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_knowledge_forms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "client_knowledge_forms_clientId_key" ON "client_knowledge_forms"("clientId");

-- AddForeignKey
ALTER TABLE "client_knowledge_forms" ADD CONSTRAINT "client_knowledge_forms_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_knowledge_forms" ADD CONSTRAINT "client_knowledge_forms_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
