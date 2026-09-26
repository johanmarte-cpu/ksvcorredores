-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('BAJO', 'MEDIO', 'ALTO');

-- CreateEnum
CREATE TYPE "DueDiligenceType" AS ENUM ('SIMPLIFICADA', 'NORMAL', 'AMPLIADA');

-- AlterTable
ALTER TABLE "client_knowledge_forms" ADD COLUMN     "adverseMediaChecked" BOOLEAN,
ADD COLUMN     "businessRelationshipPurpose" TEXT,
ADD COLUMN     "diligenceType" "DueDiligenceType",
ADD COLUMN     "nextReviewDate" TIMESTAMP(3),
ADD COLUMN     "ongoingMonitoringNotes" TEXT,
ADD COLUMN     "riskFactorsDetail" TEXT,
ADD COLUMN     "riskLevel" "RiskLevel",
ADD COLUMN     "sanctionsListChecked" BOOLEAN,
ADD COLUMN     "sanctionsListCheckedDate" TIMESTAMP(3),
ADD COLUMN     "seniorManagementApproved" BOOLEAN,
ADD COLUMN     "seniorManagementApprovedById" TEXT,
ADD COLUMN     "sourceOfFunds" TEXT,
ADD COLUMN     "sourceOfFundsDocumented" BOOLEAN;

-- CreateTable
CREATE TABLE "beneficial_owners" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "idType" "IdentificationType",
    "idNumber" TEXT,
    "ownershipPercent" DECIMAL(5,2),
    "isPep" BOOLEAN,
    "isPepDetail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "beneficial_owners_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "client_knowledge_forms" ADD CONSTRAINT "client_knowledge_forms_seniorManagementApprovedById_fkey" FOREIGN KEY ("seniorManagementApprovedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficial_owners" ADD CONSTRAINT "beneficial_owners_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
