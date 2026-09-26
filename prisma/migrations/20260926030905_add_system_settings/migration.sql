-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "itbisRate" DECIMAL(5,2) NOT NULL DEFAULT 16.00,
    "downPaymentRate" DECIMAL(5,2) NOT NULL DEFAULT 25.00,
    "paymentReminderDays" INTEGER NOT NULL DEFAULT 3,
    "renewalNoticeDays" INTEGER NOT NULL DEFAULT 30,
    "companyName" TEXT NOT NULL DEFAULT 'KSV Corredores de Seguros',
    "companyTaxId" TEXT,
    "companyPhone" TEXT,
    "companyEmail" TEXT,
    "companyAddress" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
